/**
 * Track Shipment page.
 *
 * Shipment tracking uses the same transaction records as history and profile,
 * so every listed tracking code reports its current saved/demo status.
 */

import { getTransactionRecords } from './transaction-data.js';

const statusBadgeClasses = {
  "Booking Placed": "cf-badge-placed",
  "In Transit": "cf-badge-transit",
  Delivered: "cf-badge-delivered",
};

function formatPickupDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value || "Date not provided"
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function getShipment(code) {
  const record = getTransactionRecords().find((shipment) => shipment.code === code);
  if (!record) return null;

  const status = statusBadgeClasses[record.status] ? record.status : "Booking Placed";
  const bookingPlaced = status === "Booking Placed";
  const inTransit = status === "In Transit";
  const pickupDate = formatPickupDate(record.pickupDate);
  const timeline = [
    { label: "Order Placed", time: pickupDate, state: "is-done" },
    {
      label: "Picked Up",
      time: bookingPlaced ? `Scheduled ${pickupDate}${record.booking?.pickupTime ? `, ${record.booking.pickupTime}` : ""}` : pickupDate,
      state: bookingPlaced ? "is-upcoming" : "is-done",
    },
    {
      label: "In Transit",
      time: bookingPlaced ? "Pending pickup" : inTransit ? "Current shipment status" : pickupDate,
      state: bookingPlaced ? "is-upcoming" : inTransit ? "is-current" : "is-done",
    },
    {
      label: "Out for Delivery",
      time: bookingPlaced ? "Pending pickup" : inTransit ? `Estimated ${formatPickupDate(record.eta || record.pickupDate)}` : pickupDate,
      state: bookingPlaced || inTransit ? "is-upcoming" : "is-done",
    },
    {
      label: "Delivered",
      time: bookingPlaced ? "Pending pickup" : inTransit ? `Estimated ${formatPickupDate(record.eta || record.pickupDate)}` : pickupDate,
      state: bookingPlaced || inTransit ? "is-upcoming" : "is-done",
    },
  ];

  return {
    route: `${record.from} &rarr; ${record.to}`,
    eta: status === "Delivered"
      ? "Delivered"
      : bookingPlaced
        ? `${pickupDate} (pending pickup)`
        : record.eta ? formatPickupDate(record.eta) : "In transit",
    status,
    badgeClass: statusBadgeClasses[status],
    timeline,
  };
}

const form = document.getElementById("track-form");
const summarySection = document.getElementById("summary");
const timelineSection = document.getElementById("timeline");
const notFoundMessage = document.getElementById("track-not-found");
const summaryCode = document.getElementById("summary-code");
const summaryTrackingId = document.getElementById("summary-tracking-id");
const summaryRoute = document.getElementById("summary-route");
const summaryEta = document.getElementById("summary-eta");
const summaryBadge = document.getElementById("summary-badge");
const timelineList = document.getElementById("timeline-list");
const trackingInput = document.getElementById("trackingNumber");
const trackButton = form.querySelector("button[type='submit']");

/**
 * Fills in and reveals the shipment summary card + delivery timeline.
 *
 * `summaryRoute` is set with `innerHTML` (not `textContent`) because the
 * route string contains an `&rarr;` HTML entity for the arrow between
 * cities; the timeline `<li>` markup is rebuilt from scratch every call so
 * it always matches the given shipment's own step count/labels/state,
 * rather than trying to patch the 5 sample `<li>`s already in the HTML.
 *
 * @param {string} code The tracking code, used for display only.
 * @param {{
 *   route: string, eta: string, status: string, badgeClass: string,
 *   timeline: {label: string, time: string, state: string}[],
 * }} shipment
 */
function renderShipment(code, shipment) {
  summaryCode.textContent = code;
  summaryTrackingId.textContent = code;
  summaryRoute.innerHTML = shipment.route;
  summaryEta.textContent = shipment.eta;
  summaryBadge.textContent = shipment.status;
  summaryBadge.className = `badge ${shipment.badgeClass} fs-6 mb-3`;

  timelineList.innerHTML = shipment.timeline
    .map(
      (step) => `
        <li class="cf-step ${step.state}">
          <span class="cf-step-dot"></span>
          <p class="cf-step-label">${step.label}</p>
          <p class="cf-step-time">${step.time}</p>
        </li>`,
    )
    .join("");

  summarySection.hidden = false;
  timelineSection.hidden = false;
  notFoundMessage.hidden = true;
}

/**
 * Handles the tracking search form's submit event.
 *
 * Flow:
 *   1. Empty input -> show a "please enter a code" message and stop.
 *   2. Otherwise, disable the button and show "Searching..." for 600ms
 *      (a fake delay purely for the feel of a real lookup - there is no
 *      actual network request).
 *   3. Look the code up in the shared transaction records. If found, render it;
 *      otherwise show the "not found" message with a hint toward the sample code.
 *   4. Re-enable the button either way.
 */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const enteredCode = trackingInput.value.trim().toUpperCase();

  // Empty input — show a distinct message, skip the fake "search"
  if (enteredCode === "") {
    summarySection.hidden = true;
    timelineSection.hidden = true;
    notFoundMessage.hidden = false;
    notFoundMessage.textContent = "Please enter a tracking number.";
    return;
  }

  // Brief fake loading state for realism
  trackButton.disabled = true;
  trackButton.textContent = "Searching...";

  setTimeout(() => {
    const shipment = getShipment(enteredCode);

    if (shipment) {
      renderShipment(enteredCode, shipment);
    } else {
      summarySection.hidden = true;
      timelineSection.hidden = true;
      notFoundMessage.hidden = false;
      notFoundMessage.innerHTML =
        'No shipment found for that tracking number. Try <strong>CF-24810293</strong> for a sample result.';
    }

    trackButton.disabled = false;
    trackButton.textContent = "Track";
  }, 600);
});

/**
 * Opening this page with a tracking code in the address, for example
 * trackshipment.html?code=CF-24810293 (the links on the Shipment History
 * page), fills the code into the search box and runs the search
 * immediately, so the user does not have to type it again.
 * requestSubmit() fires the same submit handler as clicking "Track".
 */
const codeFromUrl = new URLSearchParams(window.location.search).get("code");
if (codeFromUrl) {
  trackingInput.value = codeFromUrl;
  form.requestSubmit();
}
