export async function getShipment(code) {
  const response = await fetch(`/api/shipments/${encodeURIComponent(code)}`);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || "Request failed.");
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function saveBookingOnServer(booking) {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || "Request failed.");
    error.status = response.status;
    error.errors = body.errors || [];
    throw error;
  }
  return body;
}
