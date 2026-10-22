/**
 * Homepage mini shipment lookup ("Track your shipment" section).
 *
 * A quick status check without leaving the homepage. It asks the same
 * Express route as the full Track Shipment page (GET /api/shipments/:code
 * through js/api.js), so it finds the demo shipment and every saved
 * booking. pages/trackshipment.html shows the whole timeline.
 */

import { getShipment } from './api.js';

/** @type {HTMLFormElement} The mini tracking form. */
const trackForm = document.querySelector('.track-search');
/** @type {HTMLElement} Where the result is shown. */
const trackResult = document.getElementById('track-result');

/**
 * Looks the entered code up and shows its route, status and ETA inline.
 * textContent, not innerHTML, so booking data can't inject HTML.
 */
trackForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const code = trackForm.code.value.trim().toUpperCase();
  trackResult.hidden = false;
  if (!code) {
    trackResult.textContent = 'Enter a tracking code, e.g. CF-24810293.';
    return;
  }

  trackResult.textContent = 'Looking up your shipment...';
  try {
    const shipment = await getShipment(code);
    trackResult.textContent = `${shipment.route}: ${shipment.status}. ETA ${shipment.eta}.`;
  } catch (error) {
    trackResult.textContent = error.status
      ? error.message
      : 'Tracking is unavailable right now. Please try again.';
  }
});
