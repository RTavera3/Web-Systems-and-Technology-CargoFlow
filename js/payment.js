// Payment page — renders the booking summary from the URL query params
// carried over from booking-details.html, toggles the payment-method-
// specific fields, and generates a booking reference code seeded into
// localStorage on successful "payment".

const paymentParams = new URLSearchParams(window.location.search);
const requiredBookingDetails = [
  'from', 'to', 'date', 'time', 'weight', 'type',
  'senderName', 'senderContact', 'pickupAddress', 'pickupCity',
  'pickupProvince', 'pickupZip', 'receiverName', 'receiverContact',
  'dropoffAddress', 'dropoffCity', 'dropoffProvince', 'dropoffZip',
  'cargoDescription', 'packageCount', 'declaredValue', 'vehicleType',
  'customerName', 'customerContact', 'customerAddress', 'customerCity',
  'customerProvince', 'customerZip',
];
const bookingIsComplete = requiredBookingDetails.every(
  (field) => paymentParams.get(field),
);
const paymentValue = (name) => paymentParams.get(name) || 'Not provided';
const setPaymentValue = (id, name) => {
  document.getElementById(id).textContent = paymentValue(name);
};

setPaymentValue('paymentFrom', 'from');
setPaymentValue('paymentTo', 'to');
setPaymentValue('paymentDate', 'date');
setPaymentValue('paymentTime', 'time');
setPaymentValue('paymentDescription', 'cargoDescription');
setPaymentValue('paymentWeight', 'weight');
setPaymentValue('paymentPackages', 'packageCount');
setPaymentValue('paymentType', 'type');
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
document.getElementById('paymentPickupLocation').textContent =
  `${paymentValue('pickupCity')} / ${paymentValue('pickupProvince')}`;
document.getElementById('paymentDropoffLocation').textContent =
  `${paymentValue('dropoffCity')} / ${paymentValue('dropoffProvince')}`;
document.getElementById('paymentOwnerLocation').textContent =
  `${paymentValue('customerCity')} / ${paymentValue('customerProvince')}`;
const handling = [];
if (paymentParams.has('fragile')) handling.push('Handle with care');
if (paymentParams.has('loading')) handling.push('Need help loading');
document.getElementById('paymentHandling').textContent = handling.join(', ') || 'None';

document.getElementById('paymentForm').hidden = !bookingIsComplete;
document.getElementById('paymentIncomplete').hidden = bookingIsComplete;

const paymentMethod = document.querySelector('[name="paymentMethod"]');
const paymentMethodDetails = {
  GCash: document.getElementById('gcashDetails'),
  'Credit or debit card': document.getElementById('cardDetails'),
};
const gcashQrCode = document.getElementById('gcashQrCode');
const gcashPaymentData = 'CargoFlow Company | GCash payment';
gcashQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(gcashPaymentData)}`;
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

paymentMethod.addEventListener('change', updatePaymentFields);
updatePaymentFields();

const generateBookingCode = () => {
  const digits = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
  return `CF-${digits}`;
};

const saveBooking = (code) => {
  const bookings = JSON.parse(localStorage.getItem('cargoflow_bookings') || '{}');
  bookings[code] = {
    from: paymentValue('from'),
    to: paymentValue('to'),
    pickupDate: paymentValue('date'),
    pickupTime: paymentValue('time'),
    paymentMethod: paymentMethod.value,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem('cargoflow_bookings', JSON.stringify(bookings));
};

const paymentFormEl = document.getElementById('paymentForm');
paymentFormEl.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!paymentFormEl.checkValidity()) {
    paymentFormEl.classList.add('was-validated');
    return;
  }
  const bookingCode = generateBookingCode();
  saveBooking(bookingCode);
  document.getElementById('paymentBookingCode').textContent = bookingCode;
  document.getElementById('paymentSuccess').hidden = false;
});
