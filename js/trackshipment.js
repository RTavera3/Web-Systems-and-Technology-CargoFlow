/**
 * Track Shipment page.
 *
 * tracking results come from 
 * GET /api/shipments/:code via api.js, 
 * with a fallback to bookings saved in this browser.
 */

import { findBooking } from './storage.js';
import { getShipment } from './api.js';



/**
 * Looks up a tracking code among the bookings saved in this browser by
 * js/payment.js (through js/storage.js). If one is found, it builds the
 * same shape the server returns from GET /api/shipments/:code, so
 * `renderShipment` can display either one.
 *
 * This is only the fallback. The server is asked first, and this runs
 * when the server answers 404 for a code it doesn't know.
 *
 * Because a booking has only just been paid for (never actually picked
 * up), the timeline always shows step 1 ("Order Placed") as done, the
 * scheduled pickup date/time as the next (upcoming) step, and everything
 * after that as "Pending pickup".
 *
 * @param {string} code Tracking code, already trimmed/uppercased.
 * @returns {{
 *   route: string, eta: string, status: string, badgeClass: string,
 *   timeline: {label: string, time: string, state: string}[],
 * }|null} null if no booking with that code has been saved.
 */
function getStoredBooking(code) {
  const booking = findBooking(code);
  if (!booking) return null;

  const placedAt = new Date(booking.createdAt);
  const placedLabel = placedAt.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    route: `${booking.from} → ${booking.to}`,
    eta: `${booking.pickupDate} (pending pickup)`,
    status: "Booking Placed",
    badgeClass: "cf-badge-placed",
    timeline: [
      { label: "Order Placed", time: placedLabel, state: "is-done" },
      { label: "Picked Up", time: `Scheduled ${booking.pickupDate}, ${booking.pickupTime}`, state: "is-upcoming" },
      { label: "In Transit", time: "Pending pickup", state: "is-upcoming" },
      { label: "Out for Delivery", time: "Pending pickup", state: "is-upcoming" },
      { label: "Delivered", time: "Pending pickup", state: "is-upcoming" },
    ],
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
 * Fills in and reveals the shipment summary card + delivery timeline for
 * a found shipment (from the server's response or from `getStoredBooking`).
 *
 * Every value is inserted with `textContent` and `createElement`, never
 * `innerHTML`, so booking data (city names, dates) can't inject HTML
 * into the page.
 */
function renderShipment(code, shipment) {
  summaryCode.textContent = code;
  summaryTrackingId.textContent = code;
  summaryRoute.textContent = shipment.route;
  summaryEta.textContent = shipment.eta;
  summaryBadge.textContent = shipment.status;
  summaryBadge.className = `badge ${shipment.badgeClass} fs-6 mb-3`;

  timelineList.replaceChildren(
    ...shipment.timeline.map((step) => {
      const li = document.createElement("li");
      li.className = `cf-step ${step.state}`;

      const dot = document.createElement("span");
      dot.className = "cf-step-dot";

      const label = document.createElement("p");
      label.className = "cf-step-label";
      label.textContent = step.label;

      const time = document.createElement("p");
      time.className = "cf-step-time";
      time.textContent = step.time;

      li.append(dot, label, time);
      return li;
    }),
  );

  summarySection.hidden = false;
  timelineSection.hidden = false;
  notFoundMessage.hidden = true;
}

/**
 * Handles the tracking search form's submit event.
 *
 * Flow:
 *  1. Empty input -> shows a message, then the button shows “Searching...”, 
 *  getShipment() is called, the result is rendered or an error message is shown, 
 *  and the button is re-enabled.
 */
function showMessage(text) {
  summarySection.hidden = true;
  timelineSection.hidden = true;
  notFoundMessage.hidden = false;
  notFoundMessage.textContent = text;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const enteredCode = trackingInput.value.trim().toUpperCase();

  if (enteredCode === "") {
    showMessage("Please enter a tracking number.");
    return;
  }

  trackButton.disabled = true;
  trackButton.textContent = "Searching...";

  try {
    const shipment = await getShipment(enteredCode);
    renderShipment(enteredCode, shipment);
  } catch (error) {
    // Until bookings are stored on the server, fall back to
    // bookings saved in this browser.
    const booking = error.status === 404 ? getStoredBooking(enteredCode) : null;

    if (booking) {
      renderShipment(enteredCode, booking);
    } else if (error.status === 400 || error.status === 404) {
      showMessage(error.message);
    } else {
      showMessage("Could not reach the server. Please try again.");
    }
  } finally {
    trackButton.disabled = false;
    trackButton.textContent = "Track";
  }
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
