/**
 * Shipment History page (pages/history.html).
 *
 * Lists every shipment the user has, active and past, with status, route,
 * pickup date, payment method and cost, and lets them filter by status,
 * search by tracking number or city, and sort by pickup date.
 *
 * Every page that summarizes transactions uses js/transaction-data.js
 * (saved bookings from GET /api/bookings plus the shared demo records),
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
 * @property {"Booking Placed"|"Picked Up"|"In Transit"|"Out for Delivery"|"Delivered"} status
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
  "Picked Up": "cf-badge-transit",
  "In Transit": "cf-badge-transit",
  "Out for Delivery": "cf-badge-transit",
  Delivered: "cf-badge-delivered",
};

// Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await
// Waits for the bookings before the page builds the table below.
let allShipments = await getTransactionRecords();

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
 * @param {number} index
 * @returns {HTMLTableRowElement[]}
 */
function buildRow(shipment, index) {
  const row = document.createElement("tr");
  const detailsId = `history-details-${index}`;
  row.tabIndex = 0;
  row.setAttribute("aria-expanded", "false");
  row.setAttribute("aria-controls", detailsId);
  row.setAttribute("aria-label", `Shipment ${shipment.code}; select to view booking details`);
  row.className = "history-booking-row";

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
  codeCell.dataset.label = "Tracking ID";

  const routeCell = document.createElement("td");
  routeCell.textContent = `${shipment.from} → ${shipment.to}`;
  routeCell.dataset.label = "Route";

  const dateCell = document.createElement("td");
  dateCell.textContent = formatDate(shipment.pickupDate);
  dateCell.dataset.label = "Pickup date";

  const paymentCell = document.createElement("td");
  paymentCell.textContent = shipment.payment;
  paymentCell.dataset.label = "Payment";

  const costCell = document.createElement("td");
  costCell.textContent = formatPeso(shipment.cost);
  costCell.dataset.label = "Your share";
  if (shipment.cost === null) {
    costCell.title = "Price not saved for this booking";
  }

  const statusCell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = `badge ${statusBadgeClass[shipment.status]}`;
  badge.textContent = shipment.status;
  statusCell.appendChild(badge);
  statusCell.dataset.label = "Status";

  const detailsRow = document.createElement("tr");
  detailsRow.className = "history-details-row";
  detailsRow.id = detailsId;
  detailsRow.hidden = true;
  const detailsCell = document.createElement("td");
  detailsCell.colSpan = 7;
  const detailsPanel = document.createElement("div");
  detailsPanel.className = "history-details-panel";
  const detailsHeading = document.createElement("h3");
  detailsHeading.className = "h6 fw-bold mb-2";
  detailsHeading.textContent = "Booking details";
  const detailsText = document.createElement("p");
  detailsText.className = "mb-0";
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
        (booking.pickupTime || booking.time) && `Pickup time: ${booking.pickupTime || booking.time}`,
        booking.customerName && `Account owner: ${booking.customerName}`,
        booking.customerContact && `Owner contact: ${booking.customerContact}`,
        booking.customerAddress && `Owner address: ${booking.customerAddress}, ${booking.customerCity} ${booking.customerProvince} ${booking.customerZip}`,
        booking.specialInstructions && `Notes: ${booking.specialInstructions}`,
        booking.fragile && "Handle with care",
        booking.loading && "Help loading requested",
      ].filter(Boolean).join(" · ") || "No additional booking details."
    : "Sample shipment; no extra booking details available.";
  detailsPanel.append(detailsHeading, detailsText);
  detailsCell.appendChild(detailsPanel);
  detailsRow.appendChild(detailsCell);

  const messagesCell = document.createElement("td");
  const messagesLink = document.createElement("a");
  messagesLink.href = `messages.html?conversation=${encodeURIComponent(shipment.code)}`;
  messagesLink.className = "history-message-link";
  messagesLink.setAttribute("aria-label", `Open messages for ${shipment.code}`);
  messagesLink.title = "Open messages";
  const messageIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  messageIcon.setAttribute("viewBox", "0 0 24 24");
  messageIcon.setAttribute("aria-hidden", "true");
  messageIcon.setAttribute("focusable", "false");
  const messageBubble = document.createElementNS("http://www.w3.org/2000/svg", "path");
  messageBubble.setAttribute("d", "M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.5a2.5 2.5 0 0 1 0-2Z");
  const messageLines = document.createElementNS("http://www.w3.org/2000/svg", "path");
  messageLines.setAttribute("d", "M8 8h8M8 11.5h5");
  messageIcon.append(messageBubble, messageLines);
  messagesLink.appendChild(messageIcon);
  messagesCell.appendChild(messagesLink);
  messagesCell.dataset.label = "Messages";

  row.append(codeCell, routeCell, dateCell, paymentCell, costCell, statusCell, messagesCell);
  return [row, detailsRow];
}

function toggleBookingDetails(row) {
  const isExpanded = row.getAttribute("aria-expanded") === "true";
  rowsEl.querySelectorAll(".history-booking-row[aria-expanded='true']").forEach((expandedRow) => {
    expandedRow.setAttribute("aria-expanded", "false");
    expandedRow.nextElementSibling.hidden = true;
  });

  if (!isExpanded) {
    row.setAttribute("aria-expanded", "true");
    row.nextElementSibling.hidden = false;
  }
}

rowsEl.addEventListener("click", (event) => {
  const row = event.target.closest(".history-booking-row");
  if (!row || event.target.closest("a, button")) return;
  toggleBookingDetails(row);
});

rowsEl.addEventListener("keydown", (event) => {
  const row = event.target.closest(".history-booking-row");
  if (!row || event.target.closest("a, button")) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggleBookingDetails(row);
});

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

  rowsEl.replaceChildren(...visible.flatMap(buildRow));
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

async function refreshTransactions() {
  allShipments = await getTransactionRecords();
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
