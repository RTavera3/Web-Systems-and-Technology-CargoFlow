import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import app from "../server.js";
import { advanceStatus, bookingToShipment, STATUS_STEPS } from "../lib/bookings.js";

// Bookings go to a temporary file, not data/bookings.json.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cargoflow-status-"));
process.env.BOOKINGS_FILE = path.join(tmpDir, "bookings.json");

beforeEach(() => fs.rmSync(process.env.BOOKINGS_FILE, { force: true }));
after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

const tomorrow = () => {
  const d = new Date(Date.now() + 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const newBooking = async () => {
  const res = await request(app).post("/api/bookings").send({
    from: "Manila", to: "Cebu", date: tomorrow(), time: "09:00", weight: "100", type: "General goods",
    senderName: "Juan Dela Cruz", senderContact: "09171234567",
    pickupAddress: "123 Rizal St", pickupCity: "Manila", pickupProvince: "Metro Manila", pickupZip: "1000",
    receiverName: "Maria Santos", receiverContact: "09181234567",
    dropoffAddress: "45 Osmena Blvd", dropoffCity: "Cebu City", dropoffProvince: "Cebu", dropoffZip: "6000",
    cargoDescription: "Boxes of books", packageCount: "3", declaredValue: "5000", vehicleType: "Van",
    paymentMethod: "GCash",
  });
  assert.equal(res.status, 201);
  return res.body.data.code;
};

const setStatus = (code, status) => request(app).patch(`/api/bookings/${code}/status`).send({ status });
const track = (code) => request(app).get(`/api/shipments/${code}`);
const states = (res) => res.body.timeline.map((step) => step.state);

test("a booking moves through every step, and each one is recorded", async () => {
  const code = await newBooking();

  for (const status of STATUS_STEPS.slice(1)) {
    const res = await setStatus(code, status);
    assert.equal(res.status, 200, `moves to ${status}`);
    assert.equal(res.body.data.status, status);
    assert.equal(res.body.message, `Booking is now "${status}".`);
  }

  const res = await setStatus(code, "Delivered");
  assert.equal(res.status, 409, "nothing comes after Delivered");
  assert.match(res.body.error, /already been delivered/);

  const history = JSON.parse(fs.readFileSync(process.env.BOOKINGS_FILE, "utf8"))[code].statusHistory;
  assert.deepEqual(history.map((h) => h.status), STATUS_STEPS);
  assert.ok(history.every((h) => !Number.isNaN(Date.parse(h.at))), "every step has a time");

  const list = await request(app).get("/api/bookings");
  assert.equal(list.body.find((b) => b.code === code).status, "Delivered", "My Shipments shows it");
});

test("the tracking timeline fills in as the booking moves", async () => {
  const code = await newBooking();

  let res = await track(code);
  assert.equal(res.body.status, "Booking Placed");
  assert.equal(res.body.badgeClass, "cf-badge-placed");
  assert.deepEqual(states(res), ["is-done", "is-upcoming", "is-upcoming", "is-upcoming", "is-upcoming"]);
  assert.match(res.body.timeline[1].time, /^Scheduled /);
  assert.match(res.body.eta, /pending pickup/);

  await setStatus(code, "Picked Up");
  await setStatus(code, "In Transit");
  res = await track(code);
  assert.equal(res.body.status, "In Transit");
  assert.equal(res.body.badgeClass, "cf-badge-transit");
  assert.deepEqual(states(res), ["is-done", "is-done", "is-current", "is-upcoming", "is-upcoming"]);
  assert.doesNotMatch(res.body.timeline[1].time, /Scheduled/, "Picked Up shows when it happened");
  assert.equal(res.body.timeline[3].time, "Pending");
  assert.equal(res.body.eta, "On the way to Cebu");

  await setStatus(code, "Out for Delivery");
  await setStatus(code, "Delivered");
  res = await track(code);
  assert.equal(res.body.badgeClass, "cf-badge-delivered");
  assert.deepEqual(states(res), Array(5).fill("is-done"));
  assert.match(res.body.eta, /^Delivered /);
});

test("refuses skipping ahead, going back and repeating a step", async () => {
  const code = await newBooking();

  let res = await setStatus(code, "In Transit");
  assert.equal(res.status, 409, "can't skip Picked Up");
  assert.match(res.body.error, /next step is "Picked Up"/);

  assert.equal((await setStatus(code, "Picked Up")).status, 200);
  res = await setStatus(code, "Picked Up");
  assert.equal(res.status, 409, "the same request twice moves it once");
  res = await setStatus(code, "Booking Placed");
  assert.equal(res.status, 409, "can't go back");

  assert.equal((await track(code)).body.status, "Picked Up");
});

test("two requests for the same step at once: one wins, one is refused", async () => {
  const code = await newBooking();
  const results = await Promise.all([setStatus(code, "Picked Up"), setStatus(code, "Picked Up")]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const history = JSON.parse(fs.readFileSync(process.env.BOOKINGS_FILE, "utf8"))[code].statusHistory;
  assert.equal(history.length, 2, "Picked Up is recorded once");
});

test("rejects a missing or unknown status, a bad code and an unknown booking", async () => {
  const code = await newBooking();

  for (const body of [{}, { status: "Lost" }, { status: 3 }, { status: ["Picked Up"] }]) {
    const res = await request(app).patch(`/api/bookings/${code}/status`).send(body);
    assert.equal(res.status, 400, `400 for ${JSON.stringify(body)}`);
    assert.match(res.body.error, /status must be one of/);
  }

  assert.equal((await setStatus("CF-12AB", "Picked Up")).status, 400);
  assert.equal((await setStatus("CF-00000000", "Picked Up")).status, 404);
  const demo = await setStatus("CF-24810293", "Delivered");
  assert.equal(demo.status, 404, "the demo shipment is not a booking and doesn't change");
  assert.equal((await track("CF-24810293")).body.status, "In Transit");
});

test("bookings saved before statuses could change still move and track", () => {
  const old = { from: "Manila", to: "Cebu", date: "2026-12-01", time: "09:00", status: "Booking Placed",
    createdAt: "2026-11-20T01:00:00.000Z" };
  assert.deepEqual(states({ body: bookingToShipment(old) }).slice(0, 2), ["is-done", "is-upcoming"]);

  const { booking } = advanceStatus(old, "Picked Up", new Date("2026-12-01T01:30:00.000Z"));
  assert.deepEqual(booking.statusHistory, [
    { status: "Booking Placed", at: "2026-11-20T01:00:00.000Z" },
    { status: "Picked Up", at: "2026-12-01T01:30:00.000Z" },
  ]);
  assert.equal(old.status, "Booking Placed", "the saved booking isn't changed in place");
  assert.equal(bookingToShipment(booking).timeline[1].time, "Dec 1, 9:30 AM", "times are shown in Philippine time");
});
