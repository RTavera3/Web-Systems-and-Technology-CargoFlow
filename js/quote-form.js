// Homepage "Get a price" quote form — keeps the pick-up date/time fields
// in sync (no past dates or times) and validates the selected date/time is
// still in the future before letting the form submit.

const pickupDate = document.querySelector('input[name="date"]');
const pickupTime = document.querySelector('select[name="time"]');

const formatDateValue = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

const formatTimeValue = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getSelectedDateTime = () => {
  if (!pickupDate.value || !pickupTime.value) return null;
  const [year, month, day] = pickupDate.value.split('-').map(Number);
  const [hours, minutes] = pickupTime.value.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

const limitTimeForSelectedDate = () => {
  if (!pickupDate || !pickupTime) return;

  const todayString = formatDateValue(new Date());
  pickupDate.min = todayString;

  if (!pickupDate.value || pickupDate.value < todayString) {
    pickupDate.value = todayString;
  }

  const selectedDate = pickupDate.value;
  const minTime = selectedDate === todayString
    ? formatTimeValue(new Date(Date.now() + 60000))
    : '';

  [...pickupTime.options].forEach((option) => {
    if (!option.value) return;
    option.disabled = minTime !== '' && option.value < minTime;
  });
  if (pickupTime.value && pickupTime.selectedOptions[0]?.disabled) {
    pickupTime.value = '';
  }
};

const updateTimeValidity = (showPopup = false) => {
  if (!pickupDate || !pickupTime) return;
  limitTimeForSelectedDate();
  const now = new Date();
  const selectedDateTime = getSelectedDateTime();
  const hasPastDateTime = selectedDateTime && selectedDateTime <= now;
  const hasInvalidTime = Boolean(hasPastDateTime);
  pickupTime.setCustomValidity(hasInvalidTime ? 'Please choose a current or future pick-up time.' : '');
  pickupTime.classList.toggle('time-invalid', hasInvalidTime);
  if (showPopup && hasInvalidTime) pickupTime.reportValidity();
};

if (pickupDate && pickupTime) {
  pickupDate.addEventListener('change', () => updateTimeValidity(true));
  pickupTime.addEventListener('input', () => updateTimeValidity(false));
  pickupTime.addEventListener('change', () => updateTimeValidity(true));
  document.getElementById('quote').addEventListener('submit', updateTimeValidity);
  updateTimeValidity();
}
