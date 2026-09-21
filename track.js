const shipments = {
  "CF-10492": "In transit, expected in Cebu on Sep 20",
  "CF-10501": "Delivered on Sep 15",
  "CF-10333": "Picked up, awaiting carrier match",
};

document.querySelector(".track-search").addEventListener("submit", (event) => {
  event.preventDefault();
  const code = event.target.code.value.trim().toUpperCase();
  const result = document.getElementById("track-result");
  result.textContent = shipments[code] || "No shipment found for that code.";
  result.hidden = false;
});

document.getElementById("connect-carrier-btn").addEventListener("click", () => {
  window.location.href = "messages.html";
});
