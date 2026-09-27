// Track Shipment page — DOM manipulation for the search form.
// Hardcoded sample data for Milestone 1 (no backend yet), plus real
// bookings seeded into localStorage by payment.html under the
// "cargoflow_bookings" key (see js/payment.js).
// Group-agreed default tracking number: CF-24810293

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
