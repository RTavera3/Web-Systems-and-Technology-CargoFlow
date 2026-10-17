const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../server");

test("returns the demo shipment for a valid code", async () => {
  const res = await request(app).get("/api/shipments/CF-24810293");

  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /json/);
  assert.equal(res.body.code, "CF-24810293");
  assert.equal(res.body.status, "In Transit");
  assert.equal(res.body.timeline.length, 5);
});

test("accepts lowercase codes with surrounding spaces", async () => {
  const res = await request(app).get("/api/shipments/%20cf-24810293%20");

  assert.equal(res.status, 200);
  assert.equal(res.body.code, "CF-24810293");
});

test("rejects an empty code with 400 and a JSON error", async () => {
  const res = await request(app).get("/api/shipments/");

  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test("rejects wrongly shaped codes with 400", async () => {
  for (const bad of ["abc", "CF-1", "CF-24810293-EXTRA", "CF-%3Cscript%3E"]) {
    const res = await request(app).get(`/api/shipments/${bad}`);
    assert.equal(res.status, 400, `expected 400 for ${bad}`);
    assert.ok(res.body.error);
  }
});

test("rejects object property names like constructor", async () => {
  for (const bad of ["constructor", "__proto__", "toString"]) {
    const res = await request(app).get(`/api/shipments/${bad}`);
    assert.equal(res.status, 400, `expected 400 for ${bad}`);
  }
});

test("returns 404 for a well-formed code that does not exist", async () => {
  const res = await request(app).get("/api/shipments/CF-99999999");

  assert.equal(res.status, 404);
  assert.match(res.body.error, /no shipment found/i);
});

test("handles many rapid lookups without errors", async () => {
  const responses = await Promise.all(
    Array.from({ length: 20 }, () => request(app).get("/api/shipments/CF-24810293")),
  );

  for (const res of responses) {
    assert.equal(res.status, 200);
  }
});