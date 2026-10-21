import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import app from "../server.js";

// Save contact messages in a temporary file, not data/contact-messages.json.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cargoflow-contact-"));
process.env.CONTACT_FILE = path.join(tmpDir, "contact-messages.json");

beforeEach(() => fs.rmSync(process.env.CONTACT_FILE, { force: true }));
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

const saved = () => JSON.parse(fs.readFileSync(process.env.CONTACT_FILE, "utf8"));
const valid = { name: " Ana Reyes ", email: "ana@example.com", message: "Do you ship to Davao?" };

test("saves a valid message, trimmed, and answers 201", async () => {
  const res = await request(app).post("/api/contact").send(valid);
  assert.equal(res.status, 201);
  assert.equal(res.body.message, "Message sent.");
  assert.ok(res.body.data.id);

  const [entry] = saved();
  assert.equal(entry.id, res.body.data.id);
  assert.equal(entry.name, "Ana Reyes");
  assert.equal(entry.email, "ana@example.com");
  assert.ok(entry.receivedAt);
});

test("rejects missing fields, a bad email and over-long text with 400", async () => {
  const cases = [
    [{}, ["name", "email", "message"]],
    [{ ...valid, email: "not-an-email" }, ["email"]],
    [{ ...valid, message: "x".repeat(2001) }, ["message"]],
    [{ ...valid, name: 42 }, ["name"]],
  ];
  for (const [body, fields] of cases) {
    const res = await request(app).post("/api/contact").send(body);
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 60));
    assert.deepEqual(res.body.errors.map((e) => e.field), fields);
    assert.equal(res.body.error, res.body.errors[0].message);
  }
  assert.equal(fs.existsSync(process.env.CONTACT_FILE), false, "nothing was saved");
});

test("keeps only the form's fields", async () => {
  await request(app).post("/api/contact").send({ ...valid, admin: true, id: "mine" });
  const [entry] = saved();
  assert.equal(entry.admin, undefined);
  assert.notEqual(entry.id, "mine");
});

test("messages sent together are all kept", async () => {
  await Promise.all(
    Array.from({ length: 10 }, (_, i) => request(app).post("/api/contact").send({ ...valid, message: `Message ${i}` })),
  );
  assert.equal(saved().length, 10);
});
