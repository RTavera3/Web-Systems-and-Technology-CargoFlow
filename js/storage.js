/**
 * Shared browser storage for CargoFlow.
 *
 * Every page that saves or reads data goes through this module instead of
 * calling `localStorage` directly, so the keys, the JSON parsing and the
 * error handling live in one place:
 *
 *   - Bookings: saved by js/payment.js, read by js/trackshipment.js and
 *     js/history.js. Stored under "cargoflow_bookings" as an object keyed by
 *     tracking code, e.g. { "CF-04829371": { from, to, ... } }.
 *   - Chat messages: saved and cleared by js/messages.js. Stored under
 *     "chatMessages" as an array of { text, messageType, time }.
 *
 * There is no backend, so everything stays in this browser. Reads never
 * throw: a missing, blocked (private mode) or corrupted value comes back as
 * empty instead of breaking the page.
 *
 * Versioning: the shape of what we save is recorded under
 * "cargoflow_storage_version". When the shape changes, bump
 * STORAGE_VERSION and add a step to `migrate()`, so bookings saved by an
 * older version of the site are upgraded instead of breaking pages.
 */

/** Current shape of the saved data. Bump when it changes, and add a migration step. */
export const STORAGE_VERSION = 1;

/** Every localStorage key the site uses. */
export const KEYS = Object.freeze({
  bookings: 'cargoflow_bookings',
  messages: 'chatMessages',
  version: 'cargoflow_storage_version',
});

/**
 * The fields of a saved booking. Fields an older booking did not save are
 * filled with null, so pages can rely on every key existing.
 * @typedef {Object} SavedBooking
 * @property {string} from            Pickup city.
 * @property {string} to              Drop-off city.
 * @property {string} pickupDate      "YYYY-MM-DD", or "Not provided".
 * @property {string} pickupTime      "HH:MM", or "Not provided".
 * @property {string} paymentMethod   e.g. "GCash".
 * @property {string} createdAt       ISO timestamp of when it was booked.
 * @property {string|null} weight     Cargo weight as entered (kg), if saved.
 * @property {string|null} cargoType  Cargo type, if saved.
 * @property {string|null} vehicleType Requested vehicle, if saved.
 * @property {string|null} declaredValue Declared cargo value (PHP), if saved.
 */

const BOOKING_DEFAULTS = Object.freeze({
  weight: null,
  cargoType: null,
  vehicleType: null,
  declaredValue: null,
});

// --- Low-level helpers ------------------------------------------------------

/**
 * Reads and parses one key. Returns `fallback` when the key is missing,
 * storage is unavailable, or the value is not valid JSON (a corrupted value
 * is removed so it does not fail again on every page load).
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
function readJson(key, fallback) {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    console.warn(`Storage is unavailable; using an empty "${key}".`, error);
    return fallback;
  }
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Saved "${key}" was not valid JSON and has been reset.`, error);
    remove(key);
    return fallback;
  }
}

/**
 * Saves one key as JSON.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean} false if it could not be saved (storage full or blocked).
 */
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not save "${key}".`, error);
    return false;
  }
}

/** Removes one key, ignoring storage errors. */
function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/** A plain object (not null, not an array). */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// --- Versioning -------------------------------------------------------------

/**
 * Upgrades data saved by an older version of the site, then records the
 * current version. Safe to call on every page load: it does nothing once the
 * data is current.
 *
 * Version history:
 *   0 (unversioned): bookings had from, to, pickupDate, pickupTime,
 *     paymentMethod and createdAt only.
 *   1: bookings also have weight, cargoType, vehicleType and declaredValue
 *     (null when unknown).
 */
export function migrate() {
  const saved = Number(readJson(KEYS.version, 0)) || 0;
  if (saved >= STORAGE_VERSION) return;

  if (saved < 1) {
    const bookings = readJson(KEYS.bookings, {});
    if (isPlainObject(bookings)) {
      for (const code of Object.keys(bookings)) {
        if (isPlainObject(bookings[code])) {
          bookings[code] = { ...BOOKING_DEFAULTS, ...bookings[code] };
        } else {
          delete bookings[code];
        }
      }
      writeJson(KEYS.bookings, bookings);
    }
  }

  writeJson(KEYS.version, STORAGE_VERSION);
}

// --- Bookings ---------------------------------------------------------------

/**
 * Every saved booking, keyed by tracking code.
 * @returns {Record<string, SavedBooking>}
 */
export function getBookings() {
  migrate();
  const bookings = readJson(KEYS.bookings, {});
  return isPlainObject(bookings) ? bookings : {};
}

/**
 * Every saved booking as an array, each with its tracking code.
 * @returns {(SavedBooking & {code: string})[]}
 */
export function listBookings() {
  return Object.entries(getBookings()).map(([code, booking]) => ({ code, ...booking }));
}

/**
 * One saved booking.
 * @param {string} code Tracking code, e.g. "CF-04829371" (case-insensitive).
 * @returns {SavedBooking|null}
 */
export function findBooking(code) {
  if (typeof code !== 'string' || !code.trim()) return null;
  return getBookings()[code.trim().toUpperCase()] ?? null;
}

/**
 * Saves (or replaces) a booking under its tracking code.
 * @param {string} code Tracking code.
 * @param {Partial<SavedBooking>} booking
 * @returns {boolean} false if it could not be saved.
 */
export function saveBooking(code, booking) {
  if (typeof code !== 'string' || !code.trim()) {
    throw new TypeError('saveBooking needs a tracking code.');
  }
  const bookings = getBookings();
  bookings[code.trim().toUpperCase()] = {
    ...BOOKING_DEFAULTS,
    ...booking,
    createdAt: booking.createdAt ?? new Date().toISOString(),
  };
  return writeJson(KEYS.bookings, bookings);
}

// --- Chat messages ------------------------------------------------------------

/**
 * The saved chat history, in send order.
 * @returns {{text: string, messageType: string, time: string}[]}
 */
export function getMessages() {
  const messages = readJson(KEYS.messages, []);
  return Array.isArray(messages) ? messages : [];
}

/**
 * Appends one message to the saved chat history.
 * @param {{text: string, messageType: string, time: string}} message
 * @returns {boolean} false if it could not be saved.
 */
export function addMessage(message) {
  const messages = getMessages();
  messages.push(message);
  return writeJson(KEYS.messages, messages);
}

/** Deletes the saved chat history. */
export function clearMessages() {
  remove(KEYS.messages);
}
