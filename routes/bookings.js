/**
 * Booking routes, mounted in server.js at /api/bookings.
 *
 *   GET  /api/bookings  - every saved booking, summary fields only (used by
 *                         history.html and the profile's booking count)
 *   POST /api/bookings  - checks and saves a new booking; the server makes
 *                         its tracking code and sends the booking back
 *
 * The rules, the saved fields and data/bookings.json are in lib/bookings.js.
 * One booking is tracked through GET /api/shipments/:code (routes/shipments.js).
 *
 * References:
 *   Express routing and express.Router: https://expressjs.com/en/guide/routing.html#express-router
 *   Express API (req.body, res.json, res.status): https://expressjs.com/en/api.html
 */

import express from "express";
import {
  validateBooking,
  cleanBooking,
  readBookings,
  saveBookings,
  newBookingCode,
  bookingSummary,
} from "../lib/bookings.js";
import { findShipment } from "../lib/shipments.js";

const router = express.Router();

// Saves run one at a time. Each save reads the whole file and writes it back,
// so two bookings arriving together could otherwise overwrite each other.
let saving = Promise.resolve();
function oneAtATime(task) {
  const run = saving.then(task);
  saving = run.catch(() => {});
  return run;
}

/**
 * GET /api/bookings - every saved booking, newest first. Only the fields
 * My Shipments shows: no names, phone numbers or addresses.
 * Reference: https://expressjs.com/en/api.html#res.json
 */
router.get("/", async (req, res) => {
  try {
    const bookings = await readBookings();
    const list = Object.entries(bookings)
      .map(([code, booking]) => bookingSummary(code, booking))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Error reading bookings:", error);
    res.status(500).json({ error: "Failed to read bookings." });
  }
});

/**
 * POST /api/bookings - checks the booking, makes its tracking code, saves
 * it, and returns it with status 201 (Created). A booking that breaks a
 * rule gets 400 with the first problem in "error" and every problem in
 * "errors". Any code or status sent by the browser is ignored.
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400
 */
router.post("/", async (req, res) => {
  const errors = validateBooking(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors[0].message, errors });
  }

  try {
    const saved = await oneAtATime(async () => {
      const bookings = await readBookings();

      // Never reuse a saved code or the demo shipment's code.
      let code;
      do {
        code = newBookingCode(bookings);
      } while (findShipment(code));

      bookings[code] = {
        ...cleanBooking(req.body),
        status: "Booking Placed",
        createdAt: new Date().toISOString(),
      };
      await saveBookings(bookings);
      return { code, ...bookings[code] };
    });

    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/201
    res.status(201).json({ message: "Booking saved.", data: saved });
  } catch (error) {
    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/500
    console.error("Error saving booking:", error);
    res.status(500).json({ error: "Failed to save booking." });
  }
});

export default router;
