const express = require("express");
const fs = require("fs");
const path = require("path");
const { validateBooking, cleanBooking } = require("../lib/bookings");

const router = express.Router();

// Tests point BOOKINGS_FILE at a temporary file so they don't touch real data.
const bookingsFile = () =>
  process.env.BOOKINGS_FILE || path.join(__dirname, "..", "data", "bookings.json");

function readBookings() {
  try {
    const bookings = JSON.parse(fs.readFileSync(bookingsFile(), "utf8") || "{}");
    return bookings && typeof bookings === "object" && !Array.isArray(bookings) ? bookings : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

// POST /api/bookings: check a booking and save it under its code.
// 400 lists every problem; the first one is also in "error", like the other routes.
router.post("/", (req, res) => {
  const errors = validateBooking(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors[0].message, errors });
  }

  try {
    const booking = cleanBooking(req.body);
    const bookings = readBookings();

    if (bookings[booking.code]) {
      return res.status(409).json({ error: "A booking with that code already exists." });
    }

    const { code, ...details } = booking;
    bookings[code] = { ...details, createdAt: new Date().toISOString() };

    fs.mkdirSync(path.dirname(bookingsFile()), { recursive: true });
    fs.writeFileSync(bookingsFile(), JSON.stringify(bookings, null, 2), "utf8");

    res.status(201).json({ message: "Booking saved.", data: { code, ...bookings[code] } });
  } catch (error) {
    console.error("Error saving booking:", error);
    res.status(500).json({ error: "Failed to save booking." });
  }
});

module.exports = router;
