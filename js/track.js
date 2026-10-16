/**
 * Homepage mini shipment lookup ("Track your shipment" section).
 *
 * This is a lightweight, hardcoded lookup separate from the full
 * pages/trackshipment.html experience (see js/trackshipment.js). It exists
 * so a visitor can get a quick status without leaving the homepage.
 *
 * No backend: results come from the `shipments` map below. There is no
 * connection to the real bookings saved by js/payment.js into
 * localStorage - that integration only lives on the full Track Shipment
 * page.
 */

/**
 * Sample tracking codes and their canned status text, used only by this
 * homepage widget.
 * @type {Record<string, string>}
 */
const shipments = {
  "CF-10492": "In transit, expected in Cebu on Sep 20",
  "CF-10501": "Delivered on Sep 15",
  "CF-10333": "Picked up, awaiting carrier match",
};

/**
 * Handles the mini tracking form's submit event: looks up the entered
 * code (case-insensitive) in `shipments` and shows the result inline.
 */
document.querySelector(".track-search").addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = event.target.code.value.trim().toUpperCase();
  const result = document.getElementById("track-result");

  if (shipments[code]) {
    result.textContent = shipments[code];
    result.hidden = false;
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/bookings");
    if (response.ok) {
      const bookings = await response.json();
      const match = bookings.find(b => 
        (b.id && b.id.toUpperCase() === code) || 
        (b.trackingCode && b.trackingCode.toUpperCase() === code) ||
        (b.code && b.code.toUpperCase() === code)
      );

      if (match) {
        result.textContent = `Status: ${match.status || 'Booking Placed'} (${match.from || match.origin} → ${match.to || match.destination})`;
      } else {
        result.textContent = "No shipment found for that code.";
      }
    } else {
      result.textContent = "No shipment found for that code.";
    }
  } catch (error) {
    result.textContent = "Unable to connect to server.";
  }
  result.hidden = false;
});