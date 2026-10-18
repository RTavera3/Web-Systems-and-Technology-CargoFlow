/**
 * Payment page.
 *
 * There is no session or database, so this page is driven by the URL's
 * query string, which booking-details.html's form
 * (method="get") populates when the booking wizard is submitted - see
 * js/booking-details.js. This script:
 *
 *   1. Reads every booking detail back out of the URL and renders the
 *      read-only "Detailed Booking Summary" card.
 *   2. Shows/hides the GCash vs. card detail fields based on the chosen
 *      payment method, and enables only the relevant ones (so a hidden
 *      field's `required` attribute never blocks submission).
 *   3. On successful "payment", generates a booking reference code, sends
 *      the booking to POST /api/bookings to be checked and saved, and
 *      saves it through js/storage.js so pages/trackshipment.html
 *      and pages/history.html can show it later.
 */

import { getProfile, saveBooking } from './storage.js';
import { saveBookingOnServer } from './api.js';

/** Parses the booking details carried over in the URL's query string. */
const paymentParams = new URLSearchParams(window.location.search);

/**
 * Every field booking-details.html's form is expected to submit. If any
 * of these is missing, the booking is treated as incomplete and the
 * payment form is hidden in favor of an "incomplete" warning (this
 * happens if someone opens payment.html directly instead of going
 * through the booking wizard).
 * @type {string[]}
 */
const requiredBookingDetails = [
  'from', 'to', 'date', 'time', 'weight', 'type',
  'senderName', 'senderContact', 'pickupAddress', 'pickupCity',
  'pickupProvince', 'pickupZip', 'receiverName', 'receiverContact',
  'dropoffAddress', 'dropoffCity', 'dropoffProvince', 'dropoffZip',
  'cargoDescription', 'packageCount', 'declaredValue', 'vehicleType',
  'customerName', 'customerContact', 'customerAddress', 'customerCity',
  'customerProvince', 'customerZip',
];

/** @type {boolean} Whether every field in `requiredBookingDetails` is present. */
const bookingIsComplete = requiredBookingDetails.every(
  (field) => paymentParams.get(field),
);

/**
 * Reads a query param, falling back to a placeholder for display.
 * @param {string} name
 * @returns {string} The param's value, or "Not provided" if absent.
 */
const paymentValue = (name) => paymentParams.get(name) || 'Not provided';

/**
 * Sets an element's displayed text to a query param's value (or the
 * "Not provided" placeholder).
 * @param {string} id Element id to update.
 * @param {string} name Query param name to read.
 */
const setPaymentValue = (id, name) => {
  document.getElementById(id).textContent = paymentValue(name);
};

// --- Render the read-only "Detailed Booking Summary" card ---

setPaymentValue('paymentFrom', 'from');
setPaymentValue('paymentTo', 'to');
setPaymentValue('paymentDate', 'date');
setPaymentValue('paymentTime', 'time');
setPaymentValue('paymentDescription', 'cargoDescription');
setPaymentValue('paymentWeight', 'weight');
setPaymentValue('paymentPackages', 'packageCount');
setPaymentValue('paymentType', 'type');
// Declared value gets currency formatting instead of the raw number string.
document.getElementById('paymentValue').textContent = paymentParams.has('declaredValue')
  ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(paymentParams.get('declaredValue')))
  : 'Not provided';
setPaymentValue('paymentVehicle', 'vehicleType');
setPaymentValue('paymentSender', 'senderName');
setPaymentValue('paymentSenderContact', 'senderContact');
setPaymentValue('paymentPickupAddress', 'pickupAddress');
setPaymentValue('paymentPickupZip', 'pickupZip');
setPaymentValue('paymentReceiver', 'receiverName');
setPaymentValue('paymentReceiverContact', 'receiverContact');
setPaymentValue('paymentDropoffAddress', 'dropoffAddress');
setPaymentValue('paymentDropoffZip', 'dropoffZip');
setPaymentValue('paymentOwner', 'customerName');
setPaymentValue('paymentOwnerContact', 'customerContact');
setPaymentValue('paymentOwnerAddress', 'customerAddress');
setPaymentValue('paymentOwnerZip', 'customerZip');
setPaymentValue('paymentInstructions', 'specialInstructions');
// City/Province are combined into one "City / Province" line each.
document.getElementById('paymentPickupLocation').textContent =
  `${paymentValue('pickupCity')} / ${paymentValue('pickupProvince')}`;
document.getElementById('paymentDropoffLocation').textContent =
  `${paymentValue('dropoffCity')} / ${paymentValue('dropoffProvince')}`;
document.getElementById('paymentOwnerLocation').textContent =
  `${paymentValue('customerCity')} / ${paymentValue('customerProvince')}`;
// "Additional Requests" is built from two optional boolean flags rather
// than a single field, since the booking form uses two checkboxes.
const handling = [];
if (paymentParams.has('fragile')) handling.push('Handle with care');
if (paymentParams.has('loading')) handling.push('Need help loading');
document.getElementById('paymentHandling').textContent = handling.join(', ') || 'None';

// Only show the payment form once we know the booking is actually complete.
document.getElementById('paymentForm').hidden = !bookingIsComplete;
document.getElementById('paymentIncomplete').hidden = bookingIsComplete;

// --- Payment method selection (GCash / card / cash on pickup) ---

/** @type {HTMLSelectElement} The payment method dropdown. */
const paymentMethod = document.querySelector('[name="paymentMethod"]');

/**
 * Maps a payment method's option value to the <fieldset> of detail
 * inputs that should be shown/enabled when it's selected. "Cash on
 * pickup" has no fieldset of its own (see `cashPaymentNote` below).
 * @type {Record<string, HTMLElement>}
 */
const paymentMethodDetails = {
  GCash: document.getElementById('gcashDetails'),
  'Credit or debit card': document.getElementById('cardDetails'),
};

/** @type {HTMLImageElement} The scannable GCash payment QR code. */
const gcashQrCode = document.getElementById('gcashQrCode');
const gcashPaymentData = 'CargoFlow Company | GCash payment';
// Generated via a free public QR code API - there is no real GCash
// merchant account behind this, it's a stand-in for the demo.
gcashQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(gcashPaymentData)}`;

/**
 * Shows the detail fieldset matching the currently selected payment
 * method (hiding the others), and toggles each fieldset's inputs between
 * disabled/not-required (hidden method) and enabled/required (selected
 * method) so a hidden method's fields never block form submission.
 * Also shows the "pay on pickup" note only for that method, since it has
 * no input fields of its own.
 */
const updatePaymentFields = () => {
  Object.entries(paymentMethodDetails).forEach(([method, details]) => {
    const isSelected = paymentMethod.value === method;
    details.hidden = !isSelected;
    details.querySelectorAll('input').forEach((input) => {
      input.disabled = !isSelected;
      input.required = isSelected;
    });
  });
  document.getElementById('cashPaymentNote').hidden = paymentMethod.value !== 'Cash on pickup';
};

// Start on the preferred payment method from the account profile, if any.
const { preferredPayment } = getProfile();
if (preferredPayment && [...paymentMethod.options].some((option) => option.value === preferredPayment)) {
  paymentMethod.value = preferredPayment;
}

paymentMethod.addEventListener('change', updatePaymentFields);
updatePaymentFields(); // Apply once for whichever method is pre-selected on load.

// --- Booking confirmation: generate a code and save the booking ---

/**
 * Generates a booking reference code in the same "CF-########" shape as
 * the site's one hardcoded sample tracking number, using 8 random digits.
 * Not guaranteed unique against past bookings, but collisions are
 * astronomically unlikely for a class-project demo (1 in 100 million).
 * @returns {string} e.g. "CF-04829371"
 */
const generateBookingCode = () => {
  const digits = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
  return `CF-${digits}`;
};

/**
 * The fields of this booking that are saved. Only the fields the Track
 * Shipment and My Shipments pages use are kept, not the whole summary.
 * @returns {Object}
 */
const bookingToSave = () => ({
  from: paymentValue('from'),
  to: paymentValue('to'),
  pickupDate: paymentValue('date'),
  pickupTime: paymentValue('time'),
  paymentMethod: paymentMethod.value,
  weight: paymentParams.get('weight'),
  cargoType: paymentParams.get('type'),
  vehicleType: paymentParams.get('vehicleType'),
  declaredValue: paymentParams.get('declaredValue'),
});

/** @type {HTMLElement} Shows why the server turned the booking down. */
const paymentErrorEl = document.getElementById('paymentError');

/** @type {HTMLFormElement} The payment method + detail fields form. */
const paymentFormEl = document.getElementById('paymentForm');

/**
 * Handles the payment form's submit event. There is no real payment
 * processor, so a "successful" submission just means every visible,
 * required field passed validation - at that point we generate a booking
 * code, persist it, display it, and show the success message.
 */
paymentFormEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!paymentFormEl.checkValidity()) {
    paymentFormEl.classList.add('was-validated');
    return;
  }
  const submitButton = paymentFormEl.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  paymentErrorEl.hidden = true;

  const bookingCode = generateBookingCode();
  const booking = bookingToSave();
  try {
    // The server checks the booking again (lib/bookings.js) and saves it.
    await saveBookingOnServer({ code: bookingCode, ...booking });
  } catch (error) {
    // A 400 means the booking itself is wrong (e.g. the pickup time has
    // passed while this page was open): show why and don't confirm it.
    // With no status the server couldn't be reached, so the booking is
    // still kept in this browser below, like before.
    if (error.status !== undefined) {
      paymentErrorEl.textContent = error.status === 400
        ? `${error.message} Go back to the booking details to fix it.`
        : 'Could not save the booking. Please try again.';
      paymentErrorEl.hidden = false;
      submitButton.disabled = false;
      return;
    }
  }
  // Track Shipment and My Shipments still read bookings from this browser.
  saveBooking(bookingCode, booking);
  document.getElementById('paymentBookingCode').textContent = bookingCode;
  document.getElementById('paymentSuccess').hidden = false;
});
