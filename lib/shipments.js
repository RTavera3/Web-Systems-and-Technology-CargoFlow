// Demo shipment data: the sample records that My Shipments, the profile and
// Messages also list (js/transaction-data.js), so each one can be tracked.
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
  "CF-24750118": {
    route: "Quezon City → Davao",
    eta: "Delivered",
    status: "Delivered",
    badgeClass: "cf-badge-delivered",
    timeline: [
      { label: "Order Placed", time: "Aug 28, 2026", state: "is-done" },
      { label: "Picked Up", time: "Aug 28, 2026", state: "is-done" },
      { label: "In Transit", time: "Aug 28, 2026", state: "is-done" },
      { label: "Out for Delivery", time: "Aug 28, 2026", state: "is-done" },
      { label: "Delivered", time: "Aug 28, 2026", state: "is-done" },
    ],
  },
  "CF-24690457": {
    route: "Pasig → Iloilo",
    eta: "Delivered",
    status: "Delivered",
    badgeClass: "cf-badge-delivered",
    timeline: [
      { label: "Order Placed", time: "Aug 12, 2026", state: "is-done" },
      { label: "Picked Up", time: "Aug 12, 2026", state: "is-done" },
      { label: "In Transit", time: "Aug 12, 2026", state: "is-done" },
      { label: "Out for Delivery", time: "Aug 12, 2026", state: "is-done" },
      { label: "Delivered", time: "Aug 12, 2026", state: "is-done" },
    ],
  },
  "CF-24610932": {
    route: "Makati → Baguio",
    eta: "Delivered",
    status: "Delivered",
    badgeClass: "cf-badge-delivered",
    timeline: [
      { label: "Order Placed", time: "Jul 30, 2026", state: "is-done" },
      { label: "Picked Up", time: "Jul 30, 2026", state: "is-done" },
      { label: "In Transit", time: "Jul 30, 2026", state: "is-done" },
      { label: "Out for Delivery", time: "Jul 30, 2026", state: "is-done" },
      { label: "Delivered", time: "Jul 30, 2026", state: "is-done" },
    ],
  },
};

function findShipment(code) {
  return Object.hasOwn(knownShipments, code) ? knownShipments[code] : null;
}

export { findShipment };