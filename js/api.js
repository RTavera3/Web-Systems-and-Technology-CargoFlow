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