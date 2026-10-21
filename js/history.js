/**
 * Shipment History page (pages/history.html).
 *
 * Lists every shipment the user has, active and past, with status, route,
 * pickup date, payment method and cost, and lets them filter by status,
 * search by tracking number or city, and sort by pickup date.
 *
 * Every page that summarizes transactions uses js/transaction-data.js,
 * keeping the transaction count and conversation list in sync.
 */

import { getTransactionRecords } from './transaction-data.js';

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
 * @property {"Booking Placed"|"In Transit"|"Delivered"} status
 * @property {boolean} trackable   True if the Track Shipment page can show
 *                                 this code (the demo code and saved bookings).
 * @property {Object|null} booking Full booking details for saved shipments.
 */

/**
 * CSS class for each status badge. These classes already exist in
 * css/theme.css and are used by the Track Shipment page, so a status looks
 * the same on both pages.
 * @type {Record<Shipment["status"], string>}
 */
const statusBadgeClass = {
  "Booking Placed": "cf-badge-placed",
  "In Transit": "cf-badge-transit",
  Delivered: "cf-badge-delivered",
};

let allShipments = getTransactionRecords();

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
    costCell.title = "Price not saved for bookings made on this device";
  }

  const statusCell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `badge ${statusBadgeClass[shipment.status]}`;
  badge.textContent = shipment.status;
  statusCell.appendChild(badge);

  const detailsCell = document.createElement("td");
  const details = document.createElement("details");
  const detailsSummary = document.createElement("summary");
  const detailsText = document.createElement("p");
  detailsSummary.textContent = "View details";
  const booking = shipment.booking;
  detailsText.textContent = booking
    ? [
        booking.cargoDescription,
        booking.weight && `${booking.weight} kg`,
        booking.packageCount && `${booking.packageCount} package(s)`,
        booking.cargoType,
        booking.vehicleType,
        booking.senderName && `Sender: ${booking.senderName}`,
        booking.senderUserId && `Sender ID: ${booking.senderUserId}`,
        booking.senderContact && `Sender contact: ${booking.senderContact}`,
        booking.pickupAddress && `Pickup: ${booking.pickupAddress}, ${booking.pickupCity} ${booking.pickupProvince} ${booking.pickupZip}`,
        booking.receiverName && `Receiver: ${booking.receiverName}`,
        booking.receiverUserId && `Receiver ID: ${booking.receiverUserId}`,
        booking.receiverContact && `Receiver contact: ${booking.receiverContact}`,
        booking.dropoffAddress && `Drop-off: ${booking.dropoffAddress}, ${booking.dropoffCity} ${booking.dropoffProvince} ${booking.dropoffZip}`,
        booking.pickupTime && `Pickup time: ${booking.pickupTime}`,
        booking.customerName && `Account owner: ${booking.customerName}`,
        booking.customerContact && `Owner contact: ${booking.customerContact}`,
        booking.customerAddress && `Owner address: ${booking.customerAddress}, ${booking.customerCity} ${booking.customerProvince} ${booking.customerZip}`,
        booking.specialInstructions && `Notes: ${booking.specialInstructions}`,
        booking.fragile && "Handle with care",
        booking.loading && "Help loading requested",
      ].filter(Boolean).join(" · ") || "No additional booking details."
    : "Sample shipment; no extra booking details available.";
  details.append(detailsSummary, detailsText);
  detailsCell.appendChild(details);

  const messagesCell = document.createElement("td");
  const messagesLink = document.createElement("a");
  messagesLink.href = `messages.html?conversation=${encodeURIComponent(shipment.code)}`;
  messagesLink.className = "fw-semibold";
  messagesLink.textContent = "Open messages";
  messagesLink.setAttribute("aria-label", `Open messages for ${shipment.code}`);
  messagesCell.appendChild(messagesLink);

  row.append(codeCell, routeCell, dateCell, paymentCell, costCell, statusCell, detailsCell, messagesCell);
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

function refreshTransactions() {
  allShipments = getTransactionRecords();
  renderStats();
  render();
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
window.addEventListener("storage", (event) => {
  if (event.key === "cargoflow_bookings") refreshTransactions();
});
window.addEventListener("pageshow", refreshTransactions);

renderStats();
render();
