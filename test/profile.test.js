import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import app from "../server.js";
import { DEFAULT_PROFILE } from "../routes/profile.js";

// Save the profile in a temporary file, not data/profile.json.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cargoflow-profile-"));
process.env.PROFILE_FILE = path.join(tmpDir, "profile.json");

beforeEach(() => fs.rmSync(process.env.PROFILE_FILE, { force: true }));
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

// What js/profile.js sends: every field the form edits.
const edited = (overrides = {}) => ({
  name: "Ana Reyes", accountType: "Business", companyName: "Reyes Trading", email: "ana@example.com",
  contact: "0917-000-0000", emergencyContact: "", streetAddress: "8 Luna St", city: "Cebu City",
  province: "Cebu", zipCode: "6000", preferredPayment: "GCash", notifications: "Email only",
  ...overrides,
});

test("returns the demo account until the profile is saved", async () => {
  const res = await request(app).get("/api/profile");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, DEFAULT_PROFILE);
});

test("saves the profile, keeps the user ID and records when it was first saved", async () => {
  const first = await request(app).put("/api/profile").send(edited({ userId: "BC9999" }));
  assert.equal(first.status, 200);
  assert.equal(first.body.name, "Ana Reyes");
  assert.equal(first.body.userId, DEFAULT_PROFILE.userId, "the user ID can't be changed");
  assert.ok(first.body.memberSince);

  const again = await request(app).put("/api/profile").send(edited({ name: "Ana R. Reyes" }));
  assert.equal(again.body.memberSince, first.body.memberSince, "member since doesn't move");

  const read = await request(app).get("/api/profile");
  assert.equal(read.body.name, "Ana R. Reyes");
  assert.equal(read.body.preferredPayment, "GCash");
});

test("rejects missing required fields and over-long values with 400", async () => {
  const res = await request(app).put("/api/profile").send(edited({ name: " ", zipCode: "" }));
  assert.equal(res.status, 400);
  assert.deepEqual(res.body.errors.map((e) => e.field), ["name", "zipCode"]);

  const long = await request(app).put("/api/profile").send(edited({ companyName: "x".repeat(201) }));
  assert.equal(long.status, 400);
  assert.equal(fs.existsSync(process.env.PROFILE_FILE), false, "nothing was saved");
});

test("keeps only the form's fields", async () => {
  await request(app).put("/api/profile").send(edited({ isAdmin: true }));
  const read = await request(app).get("/api/profile");
  assert.equal(read.body.isAdmin, undefined);
});
