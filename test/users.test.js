import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import app from "../server.js";

// Read users from a temporary file, not data/users.json.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cargoflow-users-"));
process.env.USERS_FILE = path.join(tmpDir, "users.json");
fs.writeFileSync(process.env.USERS_FILE, JSON.stringify([
  { userId: "BC0001", name: "Juan Dela Cruz", contactNumber: "0999-123-4567", streetAddress: "123 Rizal Street", city: "Manila", province: "Metro Manila", zipCode: "1000" },
  { userId: "BC0002", name: "Maria Santos", contactNumber: "0917-234-5678", streetAddress: "45 Mabini Avenue", city: "Batangas City", province: "Batangas", zipCode: "4200" },
]));
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

test("lists every user's ID and name, and nothing else", async () => {
  const res = await request(app).get("/api/users");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, [
    { userId: "BC0001", name: "Juan Dela Cruz" },
    { userId: "BC0002", name: "Maria Santos" },
  ]);
});

test("returns one user's details, ignoring case and spaces", async () => {
  const res = await request(app).get("/api/users/%20bc0002%20");
  assert.equal(res.status, 200);
  assert.equal(res.body.name, "Maria Santos");
  assert.equal(res.body.city, "Batangas City");
});

test("rejects a malformed ID with 400 and an unknown one with 404", async () => {
  const bad = await request(app).get("/api/users/constructor");
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: "User ID must look like BC0001." });

  const missing = await request(app).get("/api/users/BC9999");
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.body, { error: "User ID not found." });
});

test("the users file itself can't be downloaded", async () => {
  for (const url of ["/data/users.json", "/resources/users.json"]) {
    const res = await request(app).get(url);
    assert.equal(res.status, 404, url);
  }
});
