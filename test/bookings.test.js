const { test, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

// Save bookings in a temporary file, not data/bookings.json.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cargoflow-bookings-"));
process.env.BOOKINGS_FILE = path.join(tmpDir, "bookings.json");

const app = require("../server");
const { validateBooking } = require("../lib/bookings");

beforeEach(() => fs.rmSync(process.env.BOOKINGS_FILE, { force: true }));
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

const tomorrow = () => {
  const d = new Date(Date.now() + 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const validBooking = (overrides = {}) => ({
  code: "CF-12345678",
  from: "Manila",
  to: "Cebu",
  pickupDate: tomorrow(),
  pickupTime: "09:00",
  weight: "100",
  cargoType: "General goods",
  vehicleType: "Van",
  declaredValue: "5000",
  paymentMethod: "GCash",
  ...overrides,
});

const post = (body) => request(app).post("/api/bookings").send(body);

const fieldsOf = (res) => res.body.errors.map((e) => e.field);

test("saves a valid booking with 201", async () => {
  const res = await post(validBooking());

  assert.equal(res.status, 201);
  assert.equal(res.body.data.code, "CF-12345678");
  assert.equal(res.body.data.weight, 100);
  assert.equal(res.body.data.declaredValue, 5000);
  assert.ok(res.body.data.createdAt);

  const saved = JSON.parse(fs.readFileSync(process.env.BOOKINGS_FILE, "utf8"));
  assert.equal(saved["CF-12345678"].from, "Manila");
});

test("drops fields that aren't part of a booking", async () => {
  const res = await post(validBooking({ isAdmin: true }));

  assert.equal(res.status, 201);
  assert.equal("isAdmin" in res.body.data, false);
});

test("rejects missing required fields and lists each one", async () => {
  const res = await post({});

  assert.equal(res.status, 400);
  assert.match(res.headers["content-type"], /json/);
  assert.equal(typeof res.body.error, "string");
  assert.deepEqual(fieldsOf(res).sort(), ["code", "from", "paymentMethod", "pickupDate", "pickupTime", "to", "weight"]);
});

test("rejects a body that isn't an object", async () => {
  const res = await post([validBooking()]);

  assert.equal(res.status, 400);
  assert.deepEqual(fieldsOf(res), ["body"]);
});

test("rejects codes that aren't CF- plus 8 digits", async () => {
  for (const code of ["12345678", "CF-1234", "CF-ABCDEFGH", "XX-12345678"]) {
    const res = await post(validBooking({ code }));
    assert.equal(res.status, 400, code);
    assert.deepEqual(fieldsOf(res), ["code"], code);
  }
});

test("accepts a lowercase code and saves it uppercase", async () => {
  const res = await post(validBooking({ code: " cf-87654321 " }));

  assert.equal(res.status, 201);
  assert.equal(res.body.data.code, "CF-87654321");
});

test("rejects a pickup in the past", async () => {
  const res = await post(validBooking({ pickupDate: "2020-01-01" }));

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Pickup must be in the future.");
});

test("rejects a pickup earlier today", () => {
  const now = new Date(2026, 9, 18, 10, 0);
  const errors = validateBooking(validBooking({ pickupDate: "2026-10-18", pickupTime: "09:30" }), now);

  assert.deepEqual(errors.map((e) => e.field), ["pickupTime"]);
  assert.deepEqual(validateBooking(validBooking({ pickupDate: "2026-10-18", pickupTime: "10:30" }), now), []);
});

test("rejects badly formed and impossible dates and times", async () => {
  for (const [pickupDate, pickupTime] of [["01/12/2030", "09:00"], ["2030-02-30", "09:00"], [tomorrow(), "25:00"], [tomorrow(), "9am"]]) {
    const res = await post(validBooking({ pickupDate, pickupTime }));
    assert.equal(res.status, 400, `${pickupDate} ${pickupTime}`);
  }
});

test("rejects zero, negative, non-numeric and too-heavy weights", async () => {
  for (const weight of [0, -5, "heavy", 50001]) {
    const res = await post(validBooking({ weight }));
    assert.equal(res.status, 400, String(weight));
    assert.deepEqual(fieldsOf(res), ["weight"], String(weight));
  }
});

test("rejects a negative declared value", async () => {
  const res = await post(validBooking({ declaredValue: -1 }));

  assert.equal(res.status, 400);
  assert.deepEqual(fieldsOf(res), ["declaredValue"]);
});

test("rejects the same pickup and drop-off city", async () => {
  const res = await post(validBooking({ to: "Manila" }));

  assert.equal(res.status, 400);
  assert.deepEqual(fieldsOf(res), ["to"]);
});

test("rejects an unknown payment method", async () => {
  const res = await post(validBooking({ paymentMethod: "Bitcoin" }));

  assert.equal(res.status, 400);
  assert.deepEqual(fieldsOf(res), ["paymentMethod"]);
});

test("rejects a code that is already booked with 409", async () => {
  assert.equal((await post(validBooking())).status, 201);
  const res = await post(validBooking());

  assert.equal(res.status, 409);
  assert.ok(res.body.error);
});

test("bad JSON still gets the JSON 400 from the error handler", async () => {
  const res = await request(app)
    .post("/api/bookings")
    .set("Content-Type", "application/json")
    .send("{bad");

  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Invalid JSON" });
});
