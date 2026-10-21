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