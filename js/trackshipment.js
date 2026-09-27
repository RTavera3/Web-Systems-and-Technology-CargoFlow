/**
 * Track Shipment page.
 *
 * There is no backend, so tracking results come from two sources, checked
 * in order:
 *   1. `knownShipments` below - one hardcoded sample shipment
 *      (CF-24810293) with a full fake "in transit" timeline, used for demos
 *      and grading.
 *   2. `localStorage["cargoflow_bookings"]` - real bookings seeded by
 *      js/payment.js when someone completes the booking + payment flow.
 *      These always render as "Booking Placed" (nothing has actually been
 *      picked up yet in this simulation).
 *
 * Both sources are normalized into the same shape (see `renderShipment`)
 * so one render function can display either.
 */

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
 * Looks up a tracking code among the real bookings saved by
 * js/payment.js, and if found, builds the same "shipment" shape that
 * `knownShipments` entries use so `renderShipment` can display it.
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
 * }|null} null if no booking with that code exists in localStorage.
 */
function getStoredBooking(code) {
  const bookings = JSON.parse(localStorage.getItem("cargoflow_bookings") || "{}");
  const booking = bookings[code];
  if (!booking) return null;

  const placedAt = new Date(booking.createdAt);
  const placedLabel = placedAt.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    route: `${booking.from} &rarr; ${booking.to}`,
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
 *   3. Look the code up in `knownShipments` first, then in localStorage
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

  setTimeout(() => {
    const shipment = knownShipments[enteredCode] || getStoredBooking(enteredCode);

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
