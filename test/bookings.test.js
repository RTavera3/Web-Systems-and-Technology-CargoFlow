import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import app from "../server.js";
import { validateBooking } from "../lib/bookings.js";

// Save bookings in a temporary file, not data/bookings.json. Imports load
// before this line runs, which is fine: lib/bookings.js reads BOOKINGS_FILE
// each time it saves, not when it loads.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cargoflow-bookings-"));
process.env.BOOKINGS_FILE = path.join(tmpDir, "bookings.json");


beforeEach(() => fs.rmSync(process.env.BOOKINGS_FILE, { force: true }));
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

const tomorrow = () => {
  const d = new Date(Date.now() + 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// What js/payment.js sends: the booking form's fields plus the payment method.
const validBooking = (overrides = {}) => ({
  from: "Manila", to: "Cebu", date: tomorrow(), time: "09:00", weight: "100", type: "General goods",
  senderUserId: "BC0001", senderName: "Juan Dela Cruz", senderContact: "09171234567",
  pickupAddress: "123 Rizal St", pickupCity: "Manila", pickupProvince: "Metro Manila", pickupZip: "1000",
  receiverUserId: "BC0002", receiverName: "Maria Santos", receiverContact: "09181234567",
  dropoffAddress: "45 Osmena Blvd", dropoffCity: "Cebu City", dropoffProvince: "Cebu", dropoffZip: "6000",
  cargoDescription: "Boxes of books", packageCount: "3", declaredValue: "5000", vehicleType: "Van",
  customerName: "Juan Dela Cruz", paymentMethod: "GCash",
  ...overrides,
});

const post = (body) => request(app).post("/api/bookings").send(body);
const fieldsOf = (res) => res.body.errors.map((e) => e.field);
const saved = () => JSON.parse(fs.readFileSync(process.env.BOOKINGS_FILE, "utf8"));

test("saves a valid booking with 201 and a code made by the server", async () => {
  const res = await post(validBooking());

  assert.equal(res.status, 201);
  const booking = res.body.data;
  assert.match(booking.code, /^CF-\d{8}$/);
  assert.equal(booking.status, "Booking Placed");
  assert.equal(booking.weight, 100);
  assert.equal(booking.packageCount, 3);
  assert.equal(booking.declaredValue, 5000);
  assert.ok(booking.createdAt);
  assert.equal(saved()[booking.code].receiverName, "Maria Santos");
});

test("ignores a code, status or any other field sent by the browser", async () => {
  const res = await post(validBooking({ code: "CF-24810293", status: "Delivered", cardNumber: "4111111111111111" }));

  assert.equal(res.status, 201);
  assert.notEqual(res.body.data.code, "CF-24810293", "the demo shipment's code is never reused");
  assert.equal(res.body.data.status, "Booking Placed");
  assert.equal("cardNumber" in res.body.data, false);
  assert.equal(JSON.stringify(saved()).includes("4111"), false);
});

test("every booking gets its own code", async () => {
  const codes = new Set();
  for (let i = 0; i < 5; i++) codes.add((await post(validBooking())).body.data.code);
  assert.equal(codes.size, 5);
  assert.equal(Object.keys(saved()).length, 5);
});

test("saves bookings sent at the same time without losing any", async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => post(validBooking())));
  assert.ok(results.every((r) => r.status === 201));
  assert.equal(Object.keys(saved()).length, 8);
});

test("rejects missing required fields and lists each one", async () => {
  const res = await post({});

  assert.equal(res.status, 400);
  assert.match(res.headers["content-type"], /json/);
  assert.equal(typeof res.body.error, "string");
  assert.ok(fieldsOf(res).includes("from"));
  assert.ok(fieldsOf(res).includes("paymentMethod"));
  assert.ok(fieldsOf(res).includes("receiverContact"));
});

test("rejects a body that isn't an object", async () => {
  const res = await post([validBooking()]);
  assert.equal(res.status, 400);
  assert.deepEqual(fieldsOf(res), ["body"]);
});

test("rejects objects or lists in place of text", async () => {
  for (const value of [{ $gt: "" }, ["Manila"]]) {
    const res = await post(validBooking({ from: value }));
    assert.equal(res.status, 400);
    assert.deepEqual(fieldsOf(res), ["from"]);
  }
});

test("rejects a pickup in the past", async () => {
  const res = await post(validBooking({ date: "2020-01-01" }));
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Pickup must be in the future.");
});

test("rejects a pickup earlier today", () => {
  const now = new Date(2026, 9, 18, 10, 0);
  const errors = validateBooking(validBooking({ date: "2026-10-18", time: "09:30" }), now);
  assert.deepEqual(errors.map((e) => e.field), ["time"]);
  assert.deepEqual(validateBooking(validBooking({ date: "2026-10-18", time: "10:30" }), now), []);
});

test("rejects badly formed and impossible dates and times", async () => {
  for (const [date, time] of [["01/12/2030", "09:00"], ["2030-02-30", "09:00"], [tomorrow(), "25:00"], [tomorrow(), "9am"]]) {
    const res = await post(validBooking({ date, time }));
    assert.equal(res.status, 400, `${date} ${time}`);
  }
});

test("rejects zero, negative, non-numeric and too-heavy weights", async () => {
  for (const weight of [0, -5, "heavy", 50001]) {
    const res = await post(validBooking({ weight }));
    assert.equal(res.status, 400, String(weight));
    assert.deepEqual(fieldsOf(res), ["weight"], String(weight));
  }
});

test("rejects a bad package count and a negative declared value", async () => {
  for (const packageCount of [0, 1.5, "many"]) {
    assert.deepEqual(fieldsOf(await post(validBooking({ packageCount }))), ["packageCount"], String(packageCount));
  }
  assert.deepEqual(fieldsOf(await post(validBooking({ declaredValue: -1 }))), ["declaredValue"]);
});

test("rejects the same pickup and drop-off city", async () => {
  assert.deepEqual(fieldsOf(await post(validBooking({ to: "Manila" }))), ["to"]);
});

test("rejects an unknown payment method", async () => {
  assert.deepEqual(fieldsOf(await post(validBooking({ paymentMethod: "Bitcoin" }))), ["paymentMethod"]);
});

test("lists bookings newest first with no personal details", async () => {
  const first = (await post(validBooking({ to: "Davao" }))).body.data;
  const second = (await post(validBooking({ to: "Iloilo" }))).body.data;

  const res = await request(app).get("/api/bookings");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((b) => b.code), [second.code, first.code]);
  assert.deepEqual(Object.keys(res.body[0]).sort(),
    ["code", "createdAt", "date", "from", "paymentMethod", "status", "time", "to"]);
  assert.equal(JSON.stringify(res.body).includes("Maria Santos"), false);
  assert.equal(JSON.stringify(res.body).includes("0918"), false);
});

test("lists nothing when there are no bookings yet", async () => {
  const res = await request(app).get("/api/bookings");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test("a saved booking can be tracked through GET /api/shipments/:code", async () => {
  const { code } = (await post(validBooking())).body.data;

  const res = await request(app).get(`/api/shipments/${code.toLowerCase()}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.code, code);
  assert.equal(res.body.route, "Manila → Cebu");
  assert.equal(res.body.status, "Booking Placed");
  assert.equal(res.body.timeline.length, 5);
  assert.equal(res.body.timeline[0].state, "is-done");
  assert.equal(JSON.stringify(res.body).includes("Maria Santos"), false);
});

test("bad JSON still gets the JSON 400 from the error handler", async () => {
  const res = await request(app)
    .post("/api/bookings")
    .set("Content-Type", "application/json")
    .send("{bad");

  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Invalid JSON" });
});
