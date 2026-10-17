const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");

test("rejects a body that is not valid JSON with 400 and a JSON error", async () => {
  for (const body of ["{ text: 'no quotes' }", '{"text": "cut off', "not json at all"]) {
    const res = await request(app)
      .post("/api/messages")
      .set("Content-Type", "application/json")
      .send(body);

    assert.equal(res.status, 400, `expected 400 for ${body}`);
    assert.match(res.headers["content-type"], /json/);
    assert.deepEqual(res.body, { error: "Invalid JSON" });
  }
});

test("does not leak the parser's error details", async () => {
  const res = await request(app)
    .post("/api/messages")
    .set("Content-Type", "application/json")
    .send("{bad");

  assert.doesNotMatch(res.text, /SyntaxError|at JSON\.parse|node_modules/);
});

test("still validates well-formed JSON as before", async () => {
  const res = await request(app)
    .post("/api/messages")
    .set("Content-Type", "application/json")
    .send({ text: "   " });

  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Message text cannot be empty." });
});

test("unknown pages are still a plain 404", async () => {
  const res = await request(app).get("/no-such-page");

  assert.equal(res.status, 404);
  assert.equal(res.text, "Page not found");
});
