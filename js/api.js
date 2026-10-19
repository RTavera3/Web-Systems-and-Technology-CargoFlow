/**
 * js/api.js
 *
 * The browser's calls to the Express API. The pages are served by the same
 * Express server (server.js), so every URL is relative: it works on any
 * host and port, not only localhost:3000.
 *
 * Each call resolves with the JSON body, or throws an Error with the
 * server's message, its HTTP `status` (undefined when the server could not
 * be reached) and, for a rejected booking, the `errors` list.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 */

async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || "Request failed.");
    error.status = response.status;
    error.errors = body.errors || [];
    throw error;
  }
  return body;
}

/** GET /api/shipments/:code - one shipment's tracking details. */
export function getShipment(code) {
  return request(`/api/shipments/${encodeURIComponent(code)}`);
}

/** GET /api/bookings - every saved booking (summary fields only). */
export function listBookings() {
  return request("/api/bookings");
}

/** POST /api/bookings - resolves with { message, data: the saved booking }. */
export function createBooking(booking) {
  return request("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
}
