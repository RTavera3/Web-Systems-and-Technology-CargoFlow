const express = require("express");
const { findShipment } = require("../lib/shipments");

const router = express.Router();

// Assumed format: "CF-" plus 4-12 letters or digits. Adjust once we see
// what code format payment.js generates.
const CODE_PATTERN = /^CF-[A-Z0-9]{4,12}$/;

router.get("/", (req, res) => {
  res.status(400).json({ error: "Tracking code is required." });
});

router.get("/:code", (req, res) => {
  const code = req.params.code.trim().toUpperCase();

  if (!CODE_PATTERN.test(code)) {
    return res.status(400).json({ error: "Tracking code must look like CF-24810293." });
  }

  const shipment = findShipment(code);
  if (!shipment) {
    return res.status(404).json({ error: "No shipment found for that tracking number." });
  }

  res.json({ code, ...shipment });
});

module.exports = router;