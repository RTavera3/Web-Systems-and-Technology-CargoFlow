/**
 * Booking routes, mounted in server.js at /api/bookings.
 *
 *   GET  /api/bookings  - returns every saved booking (used by history.html)
 *   POST /api/bookings  - validates and saves a new booking, returns its code
 *
 * Bookings are saved in data/bookings.json, the same file-based approach
 * used by routes/messages.js.
 *
 * References:
 *   Express routing and express.Router: https://expressjs.com/en/guide/routing.html#express-router
 *   Express API (req.body, res.json, res.status): https://expressjs.com/en/api.html
 *   Node.js fs promises API: https://nodejs.org/api/fs.html#promises-api
 *   Node.js path.join: https://nodejs.org/api/path.html#pathjoinpaths
 */

const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const router = express.Router();

// Reference: https://nodejs.org/api/modules.html#__dirname
// This file is inside routes/, so '..' goes up one folder to reach data/.
const BOOKINGS_FILE = path.join(__dirname, '..', 'data', 'bookings.json');

/** Fields the booking form must send. Same list as js/payment.js. */
const REQUIRED = ['from', 'to', 'date', 'time', 'weight', 'type',
  'senderName', 'senderContact', 'pickupAddress', 'pickupCity', 'pickupProvince', 'pickupZip',
  'receiverName', 'receiverContact', 'dropoffAddress', 'dropoffCity', 'dropoffProvince', 'dropoffZip',
  'cargoDescription', 'packageCount', 'declaredValue', 'vehicleType', 'paymentMethod'];

/**
 * Reads all saved bookings. A missing or corrupted file returns an empty list.
 * Reference: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
 * Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
 * Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
 */
async function readBookings() {
  try {
    return JSON.parse(await fs.readFile(BOOKINGS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Saves all bookings, creating the data/ folder first if it doesn't exist.
 * Reference: https://nodejs.org/api/fs.html#fspromisesmkdirpath-options
 */
async function writeBookings(bookings) {
  await fs.mkdir(path.dirname(BOOKINGS_FILE), { recursive: true });
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf8');
}

/**
 * GET /api/bookings - sends back every saved booking.
 * Reference: https://expressjs.com/en/api.html#res.json
 */
router.get('/', async (req, res) => {
  res.json(await readBookings());
});

/**
 * POST /api/bookings - checks required fields, creates a unique tracking
 * code, saves the booking, and returns it with status 201 (Created).
 */
router.post('/', async (req, res) => {
  // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
  // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400
  const missing = REQUIRED.filter((field) => !req.body[field]);
  if (missing.length) {
    return res.status(400).json({ error: 'Missing fields', missing });
  }

  // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
  try {
    const bookings = await readBookings();

    // Keep generating a code until it doesn't match an existing booking.
    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/do...while
    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
    let code;
    do {
      code = `CF-${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
    } while (bookings.some((b) => b.code === code));

    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    const booking = {
      code,
      ...req.body,
      status: 'Booking Placed',
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);

    // Saves to data/bookings.json (see writeBookings above).
    await writeBookings(bookings);

    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/201
    res.status(201).json(booking);
  } catch (error) {
    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/500
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Failed to save booking.' });
  }
});

module.exports = router;