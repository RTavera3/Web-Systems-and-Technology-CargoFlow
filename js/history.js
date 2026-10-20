/**
 * Shipment History page (pages/history.html).
 *
 * Lists every shipment the user has, active and past, with status, route,
 * pickup date, payment method and cost, and lets them filter by status,
 * search by tracking number or city, and sort by pickup date.
 *
 * There is no backend yet, so the list is built from two sources, the same
 * ones js/trackshipment.js reads:
 *   1. `sampleShipments` below - a few hardcoded past and current shipments
 *      for demos and grading. CF-24810293 matches the sample shipment on the
 *      Track Shipment page, so both pages tell the same story.
 *   2. Bookings saved by js/payment.js through js/storage.js when someone
 *      completes the booking + payment flow.
 *      They always show as "Booking Placed", because nothing has been
 *      picked up yet in this simulation.
 *
 * Both sources are normalized into one shape (see `normalizeBooking`) so a
 * single render function can display them.
 */

import { listBookings } from './api.js';

/**
 * One shipment row, after normalizing either source.
 * @typedef {Object} Shipment
 * @property {string} code         Tracking code, e.g. "CF-24810293".
 * @property {string} from         Pickup city.
 * @property {string} to           Drop-off city.
 * @property {string} pickupDate   Pickup date as "YYYY-MM-DD".
 * @property {string} payment      Payment method shown in the table.
 * @property {number|null} cost    The shipper's share of the trip cost in
 *                                 pesos, or null if not known (bookings
 *                                 saved by payment.js do not store a price).
 * @property {"Booking Placed"|"Picked Up"|"In Transit"|"Out for Delivery"|"Delivered"} status
 * @property {boolean} trackable   True if the Track Shipment page can show
 *                                 this code (the demo code and saved bookings).
 */

/**
 * Hardcoded sample shipments. Only CF-24810293 also exists on the Track
 * Shipment page, so it is the only sample marked `trackable`.
 * @type {Shipment[]}
 */
const sampleShipments = [
  {
    code: "CF-24810293",
    from: "Manila",
    to: "Cebu",
    pickupDate: "2026-09-10",
    payment: "GCash",
    cost: 8450,
    status: "In Transit",
    trackable: true,
  },
  {
    code: "CF-24750118",
    from: "Quezon City",
    to: "Davao",
    pickupDate: "2026-08-28",
    payment: "Credit or debit card",
    cost: 12300,
    status: "Delivered",
    trackable: false,
  },
  {
    code: "CF-24690457",
    from: "Pasig",
    to: "Iloilo",
    pickupDate: "2026-08-12",
    payment: "Cash on pickup",
    cost: 6900,
    status: "Delivered",
    trackable: false,
  },
  {
    code: "CF-24610932",
    from: "Makati",
    to: "Baguio",
    pickupDate: "2026-07-30",
    payment: "GCash",
    cost: 3750,
    status: "Delivered",
    trackable: false,
  },
];

/**
 * CSS class for each status badge. These classes already exist in
 * css/theme.css and are used by the Track Shipment page, so a status looks
 * the same on both pages.
 * @type {Record<Shipment["status"], string>}
 */
const statusBadgeClass = {
  "Booking Placed": "cf-badge-placed",
  "Picked Up": "cf-badge-transit",
  "In Transit": "cf-badge-transit",
  "Out for Delivery": "cf-badge-transit",
  Delivered: "cf-badge-delivered",
};

/**
 * Converts one booking from the server (GET /api/bookings) into a Shipment row.
 *
 * The server saves every field from the booking form, including `code`,
 * `date` and `paymentMethod`. It does not save a price, so `cost` is null
 * and the table shows a dash instead of a made-up number.
 *
 * @param {{code: string, from: string, to: string, date: string, paymentMethod: string}} booking
 * @returns {Shipment}
 */
function normalizeBooking(booking) {
  return {
    code: booking.code,
    from: booking.from,
    to: booking.to,
    pickupDate: booking.date,
    payment: formatPaymentMethod(booking.paymentMethod),
    cost: null,
    status: booking.status || "Booking Placed",
    trackable: true,
  };
}

/**
 * Returns the payment method as a display label. The payment form's options
 * are already readable ("GCash", "Credit or debit card", "Cash on pickup"),
 * so this only guards against an empty value from an older or edited booking.
 * @param {string} method
 * @returns {string}
 */
function formatPaymentMethod(method) {
  return method && method.trim() ? method : "Not provided";
}

/**
 * Loads the saved bookings from the Express server (GET /api/bookings
 * through js/api.js). If the server can't be reached, the page still works
 * and shows only the sample shipments.
 * @returns {Promise<Shipment[]>}
 */
async function getSavedBookings() {
  try {
    const bookings = await listBookings();
    return bookings.map(normalizeBooking);
  } catch (error) {
    console.error('Error loading bookings:', error);
    return [];
  }
}

// Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await
// Waits for the bookings before the page builds the table below.
const savedBookings = await getSavedBookings();

/**
 * Every shipment shown on the page: saved bookings first, then the samples.
 * A saved booking with the same code as a sample replaces that sample, so a
 * code never appears twice.
 * @type {Shipment[]}
 */
const savedCodes = new Set(savedBookings.map((s) => s.code));
const allShipments = [...savedBookings, ...sampleShipments.filter((s) => !savedCodes.has(s.code))];

// --- Page elements ---
const rowsEl = document.getElementById("history-rows");
const emptyEl = document.getElementById("history-empty");
const countEl = document.getElementById("history-count");
const searchEl = document.getElementById("history-search");
const sortEl = document.getElementById("history-sort");
const filterButtons = document.querySelectorAll("#status-filter button");

/** The status chosen in the filter buttons: "all" or one exact status. */
let activeStatus = "all";

/**
 * Formats a peso amount with a peso sign and thousands separators,
 * e.g. 12300 -> "₱12,300". Returns a dash when the amount is unknown.
 * @param {number|null} amount
 * @returns {string}
 */
function formatPeso(amount) {
  return amount === null ? "—" : `₱${amount.toLocaleString("en-PH")}`;
}

/**
 * Formats a "YYYY-MM-DD" date as "Sep 10, 2026". The date is built from
 * its parts (not `new Date("2026-09-10")`), because that form is read as
 * UTC midnight and can show the previous day in some time zones. Anything
 * that is not a valid date (e.g. "Not provided") is returned unchanged.
 * @param {string} value
 * @returns {string}
 */
function formatDate(value) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!parts) return value || "Not provided";
  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Turns a pickup date into a number for sorting, or null when the booking
 * has no valid date (payment.js saves "Not provided" if the date is missing).
 * @param {string} value
 * @returns {number|null}
 */
function sortKey(value) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * Compares two shipments by pickup date for Array.sort(). Shipments without
 * a valid date always go LAST, in both sort orders, so an incomplete
 * booking never jumps to the top of the list.
 * @param {Shipment} a
 * @param {Shipment} b
 * @param {"newest"|"oldest"} order
 * @returns {number} negative if a comes first, positive if b comes first.
 */
function compareByDate(a, b, order) {
  const ka = sortKey(a.pickupDate);
  const kb = sortKey(b.pickupDate);
  if (ka === null && kb === null) return 0;
  if (ka === null) return 1;
  if (kb === null) return -1;
  return order === "oldest" ? ka - kb : kb - ka;
}

/**
 * Builds one table row. Every value is written with `textContent`, never
 * `innerHTML`, because city names come from what the user typed in the
 * booking form - this keeps any HTML they typed from running on the page.
 * @param {Shipment} shipment
 * @returns {HTMLTableRowElement}
 */
function buildRow(shipment) {
  const row = document.createElement("tr");

  // Tracking ID: a link to the Track Shipment page when that page can show
  // this code, plain bold text otherwise (older sample shipments).
  const codeCell = document.createElement("td");
  if (shipment.trackable) {
    const link = document.createElement("a");
    link.href = `trackshipment.html?code=${encodeURIComponent(shipment.code)}`;
    link.className = "fw-semibold";
    link.textContent = shipment.code;
    link.setAttribute("aria-label", `Track shipment ${shipment.code}`);
    codeCell.appendChild(link);
  } else {
    const strong = document.createElement("strong");
    strong.textContent = shipment.code;
    codeCell.appendChild(strong);
  }

  const routeCell = document.createElement("td");
  routeCell.textContent = `${shipment.from} → ${shipment.to}`;

  const dateCell = document.createElement("td");
  dateCell.textContent = formatDate(shipment.pickupDate);

  const paymentCell = document.createElement("td");
  paymentCell.textContent = shipment.payment;

  const costCell = document.createElement("td");
  costCell.className = "text-end";
  costCell.textContent = formatPeso(shipment.cost);
  if (shipment.cost === null) {
    costCell.title = "Price not saved for this booking";
  }

  const statusCell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `badge ${statusBadgeClass[shipment.status]}`;
  badge.textContent = shipment.status;
  statusCell.appendChild(badge);

  row.append(codeCell, routeCell, dateCell, paymentCell, costCell, statusCell);
  return row;
}

/**
 * Applies the status filter, the search text and the sort order, then
 * redraws the table, the result count and the empty-state message.
 * Runs once on load and again whenever a filter changes.
 */
function render() {
  const query = searchEl.value.trim().toLowerCase();

  const visible = allShipments
    .filter((s) => activeStatus === "all" || s.status === activeStatus)
    .filter(
      (s) =>
        query === "" ||
        s.code.toLowerCase().includes(query) ||
        s.from.toLowerCase().includes(query) ||
        s.to.toLowerCase().includes(query),
    )
    .sort((a, b) => compareByDate(a, b, sortEl.value));

  rowsEl.replaceChildren(...visible.map(buildRow));
  emptyEl.hidden = visible.length > 0;
  countEl.textContent = `Showing ${visible.length} of ${allShipments.length} shipment${allShipments.length === 1 ? "" : "s"}`;
}

/**
 * Fills the four summary cards. They always describe ALL shipments, not
 * the filtered list, so they work as a fixed overview. "Active" means not
 * yet delivered; the total cost adds up only shipments with a known price.
 */
function renderStats() {
  const delivered = allShipments.filter((s) => s.status === "Delivered").length;
  const spent = allShipments.reduce((sum, s) => sum + (s.cost ?? 0), 0);

  document.getElementById("stat-total").textContent = allShipments.length;
  document.getElementById("stat-active").textContent = allShipments.length - delivered;
  document.getElementById("stat-delivered").textContent = delivered;
  document.getElementById("stat-spent").textContent = formatPeso(spent);
}

/**
 * Status filter buttons: mark the clicked one active (and update
 * aria-pressed for screen readers), then redraw the table.
 */
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.status;
    filterButtons.forEach((b) => {
      const isActive = b === button;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });
    render();
  });
});

// Redraw while typing in the search box and when the sort order changes.
searchEl.addEventListener("input", render);
sortEl.addEventListener("change", render);

renderStats();
render();
