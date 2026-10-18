/**
 * lib/bookings.js
 *
 * Checks a booking sent to POST /api/bookings before it is saved. The
 * browser already checks the booking form, but anyone can call the API
 * directly, so the server checks again and never trusts the form.
 *
 * validateBooking() returns a list of problems ({ field, message }). An
 * empty list means the booking is fine and cleanBooking() can be saved.
 */

// js/payment.js generates "CF-" plus 8 digits (e.g. CF-04829371).
const CODE_PATTERN = /^CF-\d{8}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// The same limit as the weight field in pages/booking-details.html.
const MAX_WEIGHT_KG = 50000;

const PAYMENT_METHODS = ["GCash", "Credit or debit card", "Cash on pickup"];

const REQUIRED_FIELDS = ["code", "from", "to", "pickupDate", "pickupTime", "weight", "paymentMethod"];

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === "";

/**
 * Turns "2026-12-01" and "09:00" into a Date in the server's local time,
 * or null when the date doesn't exist (e.g. 2026-02-30).
 */
function pickupDateTime(date, time) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const when = new Date(year, month - 1, day, hours, minutes);

  const sameDay =
    when.getFullYear() === year && when.getMonth() === month - 1 && when.getDate() === day;
  return sameDay ? when : null;
}

/**
 * @param {unknown} body The parsed request body.
 * @param {Date} [now] The current time (tests pass a fixed one).
 * @returns {{ field: string, message: string }[]} Every problem found.
 */
function validateBooking(body, now = new Date()) {
  if (!isPlainObject(body)) {
    return [{ field: "body", message: "Booking must be a JSON object." }];
  }

  const errors = [];
  const add = (field, message) => errors.push({ field, message });

  for (const field of REQUIRED_FIELDS) {
    if (isBlank(body[field])) add(field, `${field} is required.`);
  }
  const has = (field) => !isBlank(body[field]);

  if (has("code") && !CODE_PATTERN.test(String(body.code).trim().toUpperCase())) {
    add("code", "Booking code must look like CF-24810293.");
  }

  if (has("from") && has("to") && String(body.from).trim() === String(body.to).trim()) {
    add("to", "Pickup and drop-off cities must be different.");
  }

  if (has("pickupDate") && has("pickupTime")) {
    const date = String(body.pickupDate).trim();
    const time = String(body.pickupTime).trim();

    if (!DATE_PATTERN.test(date)) {
      add("pickupDate", "Pickup date must be YYYY-MM-DD.");
    } else if (!TIME_PATTERN.test(time)) {
      add("pickupTime", "Pickup time must be HH:MM.");
    } else {
      const when = pickupDateTime(date, time);
      if (!when) add("pickupDate", "Pickup date is not a real date.");
      else if (when <= now) add("pickupTime", "Pickup must be in the future.");
    }
  }

  if (has("weight")) {
    const weight = Number(body.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      add("weight", "Weight must be a positive number of kg.");
    } else if (weight > MAX_WEIGHT_KG) {
      add("weight", `Weight cannot be more than ${MAX_WEIGHT_KG} kg.`);
    }
  }

  if (has("declaredValue")) {
    const value = Number(body.declaredValue);
    if (!Number.isFinite(value) || value < 0) {
      add("declaredValue", "Declared value must be zero or more.");
    }
  }

  if (has("paymentMethod") && !PAYMENT_METHODS.includes(String(body.paymentMethod).trim())) {
    add("paymentMethod", `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}.`);
  }

  return errors;
}

/**
 * The fields of a valid booking that are saved, trimmed and with numbers
 * as numbers. Anything else in the request body is dropped.
 */
function cleanBooking(body) {
  const text = (field) => (isBlank(body[field]) ? null : String(body[field]).trim());
  return {
    code: text("code").toUpperCase(),
    from: text("from"),
    to: text("to"),
    pickupDate: text("pickupDate"),
    pickupTime: text("pickupTime"),
    weight: Number(body.weight),
    cargoType: text("cargoType"),
    vehicleType: text("vehicleType"),
    declaredValue: isBlank(body.declaredValue) ? null : Number(body.declaredValue),
    paymentMethod: text("paymentMethod"),
  };
}

module.exports = { validateBooking, cleanBooking, PAYMENT_METHODS, MAX_WEIGHT_KG };
