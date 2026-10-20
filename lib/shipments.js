// Demo shipment data. Real bookings get added in a later step.
const knownShipments = {
  "CF-24810293": {
    route: "Manila → Cebu",
    eta: "Sept 15, 2026",
    status: "In Transit",
    badgeClass: "cf-badge-transit",
    timeline: [
      { label: "Order Placed", time: "Sept 10, 8:00 AM", state: "is-done" },
      { label: "Picked Up", time: "Sept 10, 2:30 PM", state: "is-done" },
      { label: "In Transit", time: "Sept 12, 9:15 AM", state: "is-current" },
      { label: "Out for Delivery", time: "Estimated Sept 15", state: "is-upcoming" },
      { label: "Delivered", time: "Estimated Sept 15", state: "is-upcoming" },
    ],
  },
};

function findShipment(code) {
  return Object.hasOwn(knownShipments, code) ? knownShipments[code] : null;
}

export { findShipment };