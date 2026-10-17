/**
 * Track Shipment page.
 *
 * There is no backend, so tracking results come from two sources, checked
 * in order:
 *   1. `knownShipments` below - one hardcoded sample shipment
 *      (CF-24810293) with a full fake "in transit" timeline, used for demos
 *      and grading.
 *   2. Bookings saved by js/payment.js through js/storage.js when someone
 *      completes the booking + payment flow.
 *      These always render as "Booking Placed" (nothing has actually been
 *      picked up yet in this simulation).
 *
 * Both sources are normalized into the same shape (see `renderShipment`)
 * so one render function can display either.
 */

import { findBooking } from './storage.js';

// will add the API_BASE_URL constant to point to the Express server for fetching messages and bookings
const API_BASE_URL = 'http://localhost:3000';

/**
 * The one hardcoded demo shipment, keyed by tracking code.
 * @type {Record<string, {
 *   route: string,
 *   eta: string,
 *   status: string,
 *   badgeClass: string,
 *   timeline: {label: string, time: string, state: string}[],
 * }>}
 */
const knownShipments = {
  "CF-24810293": {
    route: "Manila &rarr; Cebu",
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

/**
 * Looks up a tracking code from the Express server (/api/bookings), and if found,
 * builds the same "shipment" shape that `knownShipments` entries use.
 * Falls back to local storage if the server is unreachable.
 *
 * @param {string} code Tracking code, already trimmed/uppercased.
 * @returns {Promise<Object|null>}
 */
async function getStoredBooking(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings`);
    if (!response.ok) throw new Error('Failed to fetch bookings from server.');
    
    const bookings = await response.json();
    const booking = bookings.find((b) => {
      const bCode = (b.id || b.code || b.trackingCode || '').toUpperCase();
      return bCode === code;
    });

    if (!booking) return null;

    const placedAt = new Date(booking.createdAt || Date.now());
    const placedLabel = placedAt.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const fromCity = booking.from || booking.origin || 'Not provided';
    const toCity = booking.to || booking.destination || 'Not provided';
    const pickupDate = booking.pickupDate || booking.date || 'Not provided';
    const pickupTime = booking.pickupTime || booking.time || '';

    return {
      route: `${fromCity} &rarr; ${toCity}`,
      eta: `${pickupDate} (pending pickup)`,
      status: booking.status || "Booking Placed",
      badgeClass: booking.status === "In Transit" ? "cf-badge-transit" : "cf-badge-placed",
      timeline: [
        { label: "Order Placed", time: placedLabel, state: "is-done" },
        { label: "Picked Up", time: `Scheduled ${pickupDate}${pickupTime ? ', ' + pickupTime : ''}`, state: "is-upcoming" },
        { label: "In Transit", time: "Pending pickup", state: "is-upcoming" },
        { label: "Out for Delivery", time: "Pending pickup", state: "is-upcoming" },
        { label: "Delivered", time: "Pending pickup", state: "is-upcoming" },
      ],
    };
  } catch (error) {
    console.warn('Could not fetch booking from server; falling back to local storage.', error);
    
    // Fallback to local storage
    const localBooking = findBooking(code);
    if (!localBooking) return null;

    const placedAt = new Date(localBooking.createdAt);
    const placedLabel = placedAt.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      route: `${localBooking.from} &rarr; ${localBooking.to}`,
      eta: `${localBooking.pickupDate} (pending pickup)`,
      status: "Booking Placed",
      badgeClass: "cf-badge-placed",
      timeline: [
        { label: "Order Placed", time: placedLabel, state: "is-done" },
        { label: "Picked Up", time: `Scheduled ${localBooking.pickupDate}, ${localBooking.pickupTime}`, state: "is-upcoming" },
        { label: "In Transit", time: "Pending pickup", state: "is-upcoming" },
        { label: "Out for Delivery", time: "Pending pickup", state: "is-upcoming" },
        { label: "Delivered", time: "Pending pickup", state: "is-upcoming" },
      ],
    };
  }
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
 * Fills in and reveals the shipment summary card + delivery timeline for
 * a found shipment (from either `knownShipments` or `getStoredBooking`).
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
 *   3. Look the code up in `knownShipments` first, then in saved bookings
 *      via `getStoredBooking`. If found, render it; otherwise show the
 *      "not found" message with a hint toward the sample code.
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

  setTimeout(async () => {
    const shipment = knownShipments[enteredCode] || await getStoredBooking(enteredCode);

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
