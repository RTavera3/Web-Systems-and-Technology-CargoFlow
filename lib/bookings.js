/**
 * lib/bookings.js
 *
 * Everything the server knows about bookings, used by routes/bookings.js
 * and routes/shipments.js:
 *   - validateBooking() checks a booking sent to POST /api/bookings. The
 *     browser checks the booking form too, but anyone can call the API
 *     directly, so the server checks again and never trusts the form.
 *   - cleanBooking() keeps only the booking form's fields, so nothing else
 *     sent in the request (a card number, a "status") is ever saved.
 *   - readBookings() / saveBookings() keep bookings in data/bookings.json.
 *   - newBookingCode() makes the tracking code on the server.
 *   - STATUS_STEPS / advanceStatus() move a booking through its delivery
 *     steps, one at a time, recording when each step happened.
 *   - bookingSummary() / bookingToShipment() are what the API sends back,
 *     so the browser never receives anyone's names, phones or addresses.
 *
 * The field names are the booking form's (pages/booking-details.html), which
 * js/payment.js sends as they are.
 *
 * References:
 *   Node.js fs promises API: https://nodejs.org/api/fs.html#promises-api
 *   Node.js path.join: https://nodejs.org/api/path.html#pathjoinpaths
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ES modules have no __dirname; build it from this file's URL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fields the booking form must send.
const REQUIRED_FIELDS = [
  "from", "to", "date", "time", "weight", "type",
  "senderName", "senderContact", "pickupAddress", "pickupCity", "pickupProvince", "pickupZip",
  "receiverName", "receiverContact", "dropoffAddress", "dropoffCity", "dropoffProvince", "dropoffZip",
  "cargoDescription", "packageCount", "declaredValue", "vehicleType", "paymentMethod",
];

// Fields the form may send. Anything not in either list is dropped.
const OPTIONAL_FIELDS = [
  "senderUserId", "receiverUserId", "description", "specialInstructions", "fragile", "loading",
  "customerName", "customerContact", "customerAddress", "customerCity", "customerProvince", "customerZip",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const CODE_PATTERN = /^CF-\d{8}$/;

// The same limit as the weight field in pages/booking-details.html.
const MAX_WEIGHT_KG = 50000;
// Longest text accepted in any one field.
const MAX_TEXT_LENGTH = 500;

const PAYMENT_METHODS = ["GCash", "Credit or debit card", "Cash on pickup"];

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Turns "2026-12-01" and "09:00" into a Date in the server's local time,
 * or null when the date doesn't exist (e.g. 2026-02-30).
 */
function pickupDateTime(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const when = new Date(year, month - 1, day, hours, minutes);
  const sameDay = when.getFullYear() === year && when.getMonth() === month - 1 && when.getDate() === day;
  return sameDay ? when : null;
}

/**
 * @param {unknown} body The parsed request body.
 * @param {Date} [now] The current time (tests pass a fixed one).
 * @returns {{ field: string, message: string }[]} Every problem found; empty when the booking is fine.
 */
function validateBooking(body, now = new Date()) {
  if (!isPlainObject(body)) {
    return [{ field: "body", message: "Booking must be a JSON object." }];
  }

  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  // Every known field must be plain text or a number, never an object or a list.
  for (const field of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
    const value = body[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string" && typeof value !== "number") {
      add(field, `${field} must be text.`);
    } else if (String(value).length > MAX_TEXT_LENGTH) {
      add(field, `${field} is too long.`);
    }
  }
  if (errors.length) return errors;

  for (const field of REQUIRED_FIELDS) {
    if (isBlank(body[field])) add(field, `${field} is required.`);
  }
  const has = (field) => !isBlank(body[field]);
  const text = (field) => String(body[field]).trim();

  if (has("from") && has("to") && text("from") === text("to")) {
    add("to", "Pickup and drop-off cities must be different.");
  }

  if (has("date") && has("time")) {
    if (!DATE_PATTERN.test(text("date"))) {
      add("date", "Pickup date must be YYYY-MM-DD.");
    } else if (!TIME_PATTERN.test(text("time"))) {
      add("time", "Pickup time must be HH:MM.");
    } else {
      const when = pickupDateTime(text("date"), text("time"));
      if (!when) add("date", "Pickup date is not a real date.");
      else if (when <= now) add("time", "Pickup must be in the future.");
    }
  }

  if (has("weight")) {
    const weight = Number(body.weight);
    if (!Number.isFinite(weight) || weight <= 0) add("weight", "Weight must be a positive number of kg.");
    else if (weight > MAX_WEIGHT_KG) add("weight", `Weight cannot be more than ${MAX_WEIGHT_KG} kg.`);
  }

  if (has("packageCount")) {
    const count = Number(body.packageCount);
    if (!Number.isInteger(count) || count < 1) add("packageCount", "Number of packages must be a whole number, 1 or more.");
  }

  if (has("declaredValue")) {
    const value = Number(body.declaredValue);
    if (!Number.isFinite(value) || value < 0) add("declaredValue", "Declared value must be zero or more.");
  }

  if (has("paymentMethod") && !PAYMENT_METHODS.includes(text("paymentMethod"))) {
    add("paymentMethod", `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}.`);
  }

  return errors;
}

/**
 * The fields of a valid booking that are saved: the form's fields only,
 * trimmed, with the numbers as numbers.
 */
function cleanBooking(body) {
  const booking = {};
  for (const field of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
    if (!isBlank(body[field])) booking[field] = String(body[field]).trim();
  }
  booking.weight = Number(booking.weight);
  booking.packageCount = Number(booking.packageCount);
  booking.declaredValue = Number(booking.declaredValue);
  return booking;
}

// --- Delivery status ---------------------------------------------------------

/**
 * Every status a booking goes through, in order. A new booking starts at
 * "Booking Placed"; PATCH /api/bookings/:code/status moves it one step on.
 */
const STATUS_STEPS = ["Booking Placed", "Picked Up", "In Transit", "Out for Delivery", "Delivered"];

/**
 * When the booking reached each status so far, oldest first. Bookings saved
 * before statuses could change have no history, so theirs starts at
 * "Booking Placed" when they were created.
 * @returns {{ status: string, at: string }[]}
 */
function statusHistory(booking) {
  if (Array.isArray(booking.statusHistory) && booking.statusHistory.length) return booking.statusHistory;
  return [{ status: "Booking Placed", at: booking.createdAt }];
}

/** The status after `status`, or null once the booking is delivered. */
function nextStatus(status) {
  const i = STATUS_STEPS.indexOf(status);
  return i >= 0 && i < STATUS_STEPS.length - 1 ? STATUS_STEPS[i + 1] : null;
}

/**
 * Moves a booking to `requested`, which must be the very next step: no
 * skipping ahead, no going back, nothing after "Delivered". Naming the step
 * (rather than "advance") means a request sent twice can't move it twice.
 *
 * @param {object} booking A saved booking; it is not changed.
 * @param {unknown} requested The status asked for.
 * @param {Date} [now] When the step happened (tests pass a fixed time).
 * @returns {{ booking?: object, error?: string, conflict?: boolean }}
 *   The updated booking, or an error; `conflict` means the request was valid
 *   but the booking is not at the step before it.
 */
function advanceStatus(booking, requested, now = new Date()) {
  if (typeof requested !== "string" || !STATUS_STEPS.includes(requested.trim())) {
    return { error: `status must be one of: ${STATUS_STEPS.join(", ")}.` };
  }
  const target = requested.trim();
  const current = booking.status || "Booking Placed";
  const next = nextStatus(current);
  if (target !== next) {
    const why = next ? `the next step is "${next}"` : "it has already been delivered";
    return { conflict: true, error: `Booking is "${current}", so it can't move to "${target}"; ${why}.` };
  }
  return {
    booking: {
      ...booking,
      status: target,
      statusHistory: [...statusHistory(booking), { status: target, at: now.toISOString() }],
    },
  };
}

// --- Saved bookings: data/bookings.json, an object keyed by booking code ----

// Tests point BOOKINGS_FILE at a temporary file so they don't touch real data.
const bookingsFile = () =>
  process.env.BOOKINGS_FILE || path.join(__dirname, "..", "data", "bookings.json");

/** Every saved booking, keyed by code. A missing file means no bookings yet. */
async function readBookings() {
  try {
    const bookings = JSON.parse((await fs.readFile(bookingsFile(), "utf8")) || "{}");
    return isPlainObject(bookings) ? bookings : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

/** Saves every booking, creating the data/ folder first if it doesn't exist. */
async function saveBookings(bookings) {
  await fs.mkdir(path.dirname(bookingsFile()), { recursive: true });
  await fs.writeFile(bookingsFile(), JSON.stringify(bookings, null, 2), "utf8");
}

/** A "CF-" plus 8 digits code that no saved booking (or `taken` code) has. */
function newBookingCode(bookings, taken = []) {
  let code;
  do {
    code = `CF-${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
  } while (Object.hasOwn(bookings, code) || taken.includes(code));
  return code;
}

/** The fields GET /api/bookings lists: enough for My Shipments, no personal details. */
function bookingSummary(code, booking) {
  return {
    code,
    from: booking.from,
    to: booking.to,
    date: booking.date,
    time: booking.time,
    paymentMethod: booking.paymentMethod,
    status: booking.status,
    createdAt: booking.createdAt,
  };
}

/** "Sep 10, 2:30 PM" in Philippine time, the format the timeline uses. */
const timeLabel = (iso) =>
  new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * A saved booking in the shape GET /api/shipments/:code returns. The
 * timeline shows each step the booking has reached with its time, the
 * latest one as current (or every step done once delivered), and the rest
 * as upcoming, with the scheduled pickup for "Picked Up".
 */
function bookingToShipment(booking) {
  const history = statusHistory(booking);
  const reached = new Map(history.map((h) => [h.status, h.at]));
  const current = booking.status || "Booking Placed";
  const delivered = current === "Delivered";
  const pickedUp = reached.has("Picked Up");

  const timeline = STATUS_STEPS.map((status) => {
    // The first step reads "Order Placed" on the page, like the demo shipment.
    const label = status === "Booking Placed" ? "Order Placed" : status;
    if (reached.has(status)) {
      const state = status === current && !delivered && status !== "Booking Placed" ? "is-current" : "is-done";
      return { label, time: timeLabel(reached.get(status)), state };
    }
    const time = status === "Picked Up" ? `Scheduled ${booking.date}, ${booking.time}`
      : pickedUp ? "Pending" : "Pending pickup";
    return { label, time, state: "is-upcoming" };
  });

  const eta = delivered ? `Delivered ${timeLabel(reached.get("Delivered"))}`
    : current === "Out for Delivery" ? "Arriving today"
      : pickedUp ? `On the way to ${booking.to}`
        : `${booking.date} (pending pickup)`;

  return {
    route: `${booking.from} → ${booking.to}`,
    eta,
    status: current,
    badgeClass: delivered ? "cf-badge-delivered" : pickedUp ? "cf-badge-transit" : "cf-badge-placed",
    timeline,
  };
}

export {
  validateBooking,
  cleanBooking,
  readBookings,
  saveBookings,
  newBookingCode,
  bookingSummary,
  bookingToShipment,
  advanceStatus,
  nextStatus,
  statusHistory,
  STATUS_STEPS,
  CODE_PATTERN,
  PAYMENT_METHODS,
  MAX_WEIGHT_KG,
};
