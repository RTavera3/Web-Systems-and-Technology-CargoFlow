import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import app from "../server.js";

// Save chat messages in a temporary folder, not data/messages.json.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cargoflow-messages-"));
process.env.MESSAGES_FILE = path.join(tmpDir, "messages.json");

const file = () => process.env.MESSAGES_FILE;
const saved = () => JSON.parse(fs.readFileSync(file(), "utf8"));

beforeEach(() => {
  for (const name of fs.readdirSync(tmpDir)) {
    fs.rmSync(path.join(tmpDir, name), { recursive: true, force: true });
  }
});
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

test("POST /api/messages saves a valid message, trimmed, with defaults, and answers 201", async () => {
  const res = await request(app).post("/api/messages").send({ text: "  Hello carrier  " });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.text, "Hello carrier");
  assert.equal(res.body.data.sender, "Shipper");
  assert.equal(res.body.data.recipient, "Carrier");
  assert.ok(res.body.data.id);
  assert.ok(res.body.data.timestamp);
  assert.deepEqual(saved(), [res.body.data]);
});

test("rejects empty or non-text messages with 400 and a JSON error", async () => {
  for (const body of [{}, { text: "" }, { text: "   " }, { text: null }, { text: 42 }, { text: ["hi"] }]) {
    const res = await request(app).post("/api/messages").send(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.match(res.headers["content-type"], /json/);
    assert.match(res.body.error, /cannot be empty/);
  }
  assert.equal(fs.existsSync(file()), false, "nothing was saved");
});

test("rejects text over 500 characters but accepts exactly 500", async () => {
  const tooLong = await request(app).post("/api/messages").send({ text: "x".repeat(501) });
  assert.equal(tooLong.status, 400);
  assert.match(tooLong.body.error, /500 character/);
  assert.equal(fs.existsSync(file()), false, "nothing was saved");

  const exact = await request(app).post("/api/messages").send({ text: "x".repeat(500) });
  assert.equal(exact.status, 201);
});

test("rejects wrongly shaped requests with 400 and a JSON error", async () => {
  const bodies = [
    undefined, // no body at all
    [], // a list instead of an object
    { text: "hi", sender: { name: "x" } },
    { text: "hi", recipient: "y".repeat(101) },
  ];
  for (const body of bodies) {
    const pending = request(app).post("/api/messages");
    const res = body === undefined ? await pending : await pending.send(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.match(res.headers["content-type"], /json/);
    assert.ok(res.body.error);
  }
  assert.equal(fs.existsSync(file()), false, "nothing was saved");
});

test("messages sent at the same moment are all kept, with no temp files left", async () => {
  const responses = await Promise.all(
    Array.from({ length: 20 }, (_, i) => request(app).post("/api/messages").send({ text: `Message ${i}` })),
  );
  for (const res of responses) assert.equal(res.status, 201);

  const texts = saved().map((m) => m.text).sort();
  assert.deepEqual(texts, Array.from({ length: 20 }, (_, i) => `Message ${i}`).sort());
  assert.deepEqual(fs.readdirSync(tmpDir), ["messages.json"]);
});

test("the history is read from the file each time, so it is still there after a restart", async () => {
  await request(app).post("/api/messages").send({ text: "first" });
  await request(app).post("/api/messages").send({ text: "second" });

  // Nothing is kept in memory: GET reads what is on disk.
  const res = await request(app).get("/api/messages");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((m) => m.text), ["first", "second"]);
  assert.deepEqual(res.body, saved());
});

test("a damaged history file is set aside, the chat starts empty, and new messages save", async () => {
  fs.writeFileSync(file(), '[{"id": "1", "text": "Hel');

  const before = await request(app).get("/api/messages");
  assert.equal(before.status, 200);
  assert.deepEqual(before.body, []);

  const res = await request(app).post("/api/messages").send({ text: "Hello" });
  assert.equal(res.status, 201);
  assert.equal(saved().length, 1);
  assert.ok(fs.readdirSync(tmpDir).some((name) => name.startsWith("messages.json.corrupt-")));
});

test("DELETE /api/messages clears the history", async () => {
  await request(app).post("/api/messages").send({ text: "hello" });

  const res = await request(app).delete("/api/messages");
  assert.equal(res.status, 200);
  assert.deepEqual((await request(app).get("/api/messages")).body, []);
});

test("each booking has its own conversation; older messages belong to the demo booking", async () => {
  fs.writeFileSync(file(), JSON.stringify([{ id: "1", text: "from before conversations", timestamp: "2026-09-10T00:00:00Z" }]));
  await request(app).post("/api/messages").send({ conversationId: "cf-11111111", text: "for the first booking" });
  await request(app).post("/api/messages").send({ conversationId: "CF-22222222", text: "for the second booking" });

  const first = await request(app).get("/api/messages?conversationId=CF-11111111");
  assert.deepEqual(first.body.map((m) => m.text), ["for the first booking"]);
  assert.equal(first.body[0].conversationId, "CF-11111111", "saved in upper case");

  const demo = await request(app).get("/api/messages?conversationId=CF-24810293");
  assert.deepEqual(demo.body.map((m) => m.text), ["from before conversations"]);

  const all = await request(app).get("/api/messages");
  assert.equal(all.body.length, 3, "no conversationId: every message");
});

test("a message sent again with the same clientMessageId is saved once", async () => {
  const body = { conversationId: "CF-11111111", clientMessageId: "abc-123", text: "only once" };
  const first = await request(app).post("/api/messages").send(body);
  const again = await request(app).post("/api/messages").send(body);

  assert.equal(first.status, 201);
  assert.equal(first.body.duplicate, false);
  assert.equal(again.status, 200);
  assert.equal(again.body.duplicate, true);
  assert.deepEqual(again.body.data, first.body.data);
  assert.equal(saved().length, 1);
});

test("rejects a blank or too-long conversationId and clientMessageId", async () => {
  for (const body of [
    { conversationId: "   ", text: "hi" },
    { conversationId: "C".repeat(65), text: "hi" },
    { conversationId: 7, text: "hi" },
    { clientMessageId: "x".repeat(129), text: "hi" },
    { clientMessageId: 5, text: "hi" },
  ]) {
    const res = await request(app).post("/api/messages").send(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok(res.body.error);
  }
  assert.equal(fs.existsSync(file()), false, "nothing was saved");
});

test("DELETE with a conversationId clears only that conversation", async () => {
  await request(app).post("/api/messages").send({ conversationId: "CF-11111111", text: "goes" });
  await request(app).post("/api/messages").send({ conversationId: "CF-22222222", text: "stays" });

  const res = await request(app).delete("/api/messages?conversationId=cf-11111111");
  assert.equal(res.status, 200);
  assert.deepEqual(saved().map((m) => m.text), ["stays"]);
});
