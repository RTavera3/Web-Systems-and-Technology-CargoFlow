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
 *   - Chat messages: saved and cleared by js/messages.js. Each message is
 *     tagged with its booking code so conversations stay separate.
 *   - Message outbox: outgoing chat messages wait here when the server is
 *     unavailable and are removed after successful delivery.
 *   - Account profile: edited on pages/profile.html (js/profile.js), read by
 *     js/booking-details.js and js/payment.js to prefill the account owner
 *     and payment method. Stored under "cargoflow_profile" as one object.
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
export const STORAGE_VERSION = 2;

/** Every localStorage key the site uses. */
export const KEYS = Object.freeze({
  bookings: 'cargoflow_bookings',
  messages: 'chatMessages',
  messageOutbox: 'cargoflow_message_outbox',
  profile: 'cargoflow_profile',
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
 * @property {string|null} cargoDescription Item description.
 * @property {string|null} packageCount Number of packages.
 * @property {string|null} senderName Sender name.
 * @property {string|null} senderContact Sender contact number.
 * @property {string|null} pickupAddress Pickup street address.
 * @property {string|null} pickupCity Pickup city.
 * @property {string|null} pickupProvince Pickup province.
 * @property {string|null} pickupZip Pickup ZIP code.
 * @property {string|null} receiverName Receiver name.
 * @property {string|null} receiverContact Receiver contact number.
 * @property {string|null} dropoffAddress Drop-off street address.
 * @property {string|null} dropoffCity Drop-off city.
 * @property {string|null} dropoffProvince Drop-off province.
 * @property {string|null} dropoffZip Drop-off ZIP code.
 * @property {string|null} specialInstructions Additional booking notes.
 */

const BOOKING_DEFAULTS = Object.freeze({
  weight: null,
  cargoType: null,
  vehicleType: null,
  declaredValue: null,
  cargoDescription: null,
  packageCount: null,
  senderName: null,
  senderContact: null,
  senderUserId: null,
  pickupAddress: null,
  pickupCity: null,
  pickupProvince: null,
  pickupZip: null,
  receiverName: null,
  receiverContact: null,
  receiverUserId: null,
  dropoffAddress: null,
  dropoffCity: null,
  dropoffProvince: null,
  dropoffZip: null,
  customerName: null,
  customerContact: null,
  customerAddress: null,
  customerCity: null,
  customerProvince: null,
  customerZip: null,
  specialInstructions: null,
  fragile: false,
  loading: false,
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
 *   2: bookings also retain the shipment description and contact/address
 *     details used by transaction records and booking conversations.
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

  if (saved < 2) {
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

/**
 * Outgoing messages waiting for server delivery. The browser copy ensures
 * messages composed while offline survive navigation and reloads.
 * @returns {Array<{id: string, conversationId: string, text: string, sender: string, recipient: string, timestamp: string, status: string}>}
 */
export function getPendingMessages() {
  const messages = readJson(KEYS.messageOutbox, []);
  return Array.isArray(messages)
    ? messages.filter((message) =>
        isPlainObject(message)
        && typeof message.id === 'string'
        && typeof message.conversationId === 'string'
        && typeof message.text === 'string',
      )
    : [];
}

/**
 * Adds or updates one outbox message.
 * @param {object} pendingMessage
 * @returns {boolean} false if browser storage could not save the outbox.
 */
export function savePendingMessage(pendingMessage) {
  if (!pendingMessage || typeof pendingMessage.id !== 'string') {
    throw new TypeError('savePendingMessage needs a message ID.');
  }
  const messages = getPendingMessages();
  const index = messages.findIndex((message) => message.id === pendingMessage.id);
  if (index === -1) messages.push(pendingMessage);
  else messages[index] = pendingMessage;
  return writeJson(KEYS.messageOutbox, messages);
}

/** Removes one delivered or discarded message from the outbox. */
export function removePendingMessage(id) {
  return writeJson(KEYS.messageOutbox, getPendingMessages().filter((message) => message.id !== id));
}

/** Discards only queued messages belonging to one conversation. */
export function clearPendingMessages(conversationId) {
  return writeJson(
    KEYS.messageOutbox,
    getPendingMessages().filter((message) => message.conversationId !== conversationId),
  );
}

// --- Account profile ----------------------------------------------------------

/**
 * The shipper's account details. There are no real accounts, so this is a
 * single profile per browser.
 * @typedef {Object} AccountProfile
 * @property {string} userId
 * @property {string} name
 * @property {string} accountType       "Individual shipper" or "Business".
 * @property {string} companyName
 * @property {string} email
 * @property {string} contact
 * @property {string} streetAddress
 * @property {string} city
 * @property {string} province
 * @property {string} zipCode
 * @property {string} emergencyContact
 * @property {string} preferredPayment  "" for no preference, else a payment method.
 * @property {string} notifications     How booking updates are sent.
 * @property {string} memberSince       ISO timestamp of the first visit to the profile page.
 */

/** The demo account used until the profile is edited. */
export const DEFAULT_PROFILE = Object.freeze({
  userId: 'BC0001',
  name: 'Juan Dela Cruz',
  accountType: 'Individual shipper',
  companyName: '',
  email: '',
  contact: '0999-123-4567',
  streetAddress: '123 Rizal Street, Barangay 143',
  city: 'Quezon City',
  province: 'Metro Manila',
  zipCode: '1100',
  emergencyContact: '',
  preferredPayment: '',
  notifications: 'Email and SMS',
  memberSince: '',
});

/**
 * The saved account profile, with any missing field filled from
 * DEFAULT_PROFILE.
 * @returns {AccountProfile}
 */
export function getProfile() {
  const saved = readJson(KEYS.profile, {});
  return { ...DEFAULT_PROFILE, ...(isPlainObject(saved) ? saved : {}) };
}

/**
 * Saves the account profile.
 * @param {AccountProfile} profile
 * @returns {boolean} false if it could not be saved.
 */
export function saveProfile(profile) {
  return writeJson(KEYS.profile, { ...DEFAULT_PROFILE, ...profile });
}
