// Track Shipment page — DOM manipulation for the search form.
// Hardcoded sample data for Milestone 1 (no backend yet).
// Group-agreed default tracking number: CF-24810293

const knownShipments = {
  "CF-24810293": {
    route: "Manila &rarr; Cebu",
    eta: "Sept 15, 2026",
    status: "In Transit",
  },
};

const form = document.getElementById("track-form");
const summarySection = document.getElementById("summary");
const timelineSection = document.getElementById("timeline");
const notFoundMessage = document.getElementById("track-not-found");
const summaryCode = document.getElementById("summary-code");
const summaryTrackingId = document.getElementById("summary-tracking-id");
const trackingInput = document.getElementById("trackingNumber");
const trackButton = form.querySelector("button[type='submit']");

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
    const shipment = knownShipments[enteredCode];

    if (shipment) {
      summaryCode.textContent = enteredCode;
      summaryTrackingId.textContent = enteredCode;
      summarySection.hidden = false;
      timelineSection.hidden = false;
      notFoundMessage.hidden = true;
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