/**
 * Shipment tracking, mounted in server.js at /api/shipments.
 *
 *   GET /api/shipments/:code - one shipment's route, ETA, status and timeline
 *
 * The code is looked up in the demo shipment (lib/shipments.js) and then in
 * the bookings saved through POST /api/bookings (lib/bookings.js), so the
 * Track Shipment page only ever asks this one route.
 */

import express from "express";
import { findShipment } from "../lib/shipments.js";
import { readBookings, bookingToShipment } from "../lib/bookings.js";

const router = express.Router();

// "CF-" plus 4-12 letters or digits. POST /api/bookings makes "CF-" plus
// 8 digits (e.g. CF-04829371), which this accepts.
const CODE_PATTERN = /^CF-[A-Z0-9]{4,12}$/;

router.get("/", (req, res) => {
  res.status(400).json({ error: "Tracking code is required." });
});

router.get("/:code", async (req, res) => {
  const code = req.params.code.trim().toUpperCase();

  if (!CODE_PATTERN.test(code)) {
    return res.status(400).json({ error: "Tracking code must look like CF-24810293." });
  }

  try {
    const demo = findShipment(code);
    if (demo) return res.json({ code, ...demo });

    const bookings = await readBookings();
    if (Object.hasOwn(bookings, code)) {
      return res.json({ code, ...bookingToShipment(bookings[code]) });
    }

    res.status(404).json({ error: "No shipment found for that tracking number." });
  } catch (error) {
    console.error("Error looking up shipment:", error);
    res.status(500).json({ error: "Failed to look up the shipment." });
  }
});

export default router;
