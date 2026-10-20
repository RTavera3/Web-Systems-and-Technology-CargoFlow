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

/**
 * A saved booking in the shape GET /api/shipments/:code returns. A booking
 * has only just been paid for, so the timeline shows "Order Placed" as done,
 * the scheduled pickup next, and everything after it as pending.
 */
function bookingToShipment(booking) {
  const placedLabel = new Date(booking.createdAt).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return {
    route: `${booking.from} → ${booking.to}`,
    eta: `${booking.date} (pending pickup)`,
    status: booking.status,
    badgeClass: "cf-badge-placed",
    timeline: [
      { label: "Order Placed", time: placedLabel, state: "is-done" },
      { label: "Picked Up", time: `Scheduled ${booking.date}, ${booking.time}`, state: "is-upcoming" },
      { label: "In Transit", time: "Pending pickup", state: "is-upcoming" },
      { label: "Out for Delivery", time: "Pending pickup", state: "is-upcoming" },
      { label: "Delivered", time: "Pending pickup", state: "is-upcoming" },
    ],
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
  CODE_PATTERN,
  PAYMENT_METHODS,
  MAX_WEIGHT_KG,
};
