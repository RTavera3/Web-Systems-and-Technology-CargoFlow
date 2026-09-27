/**
 * Homepage "Get a price" quote form.
 *
 * Handles the pick-up date and time fields: keeps the date input from
 * accepting a past day, keeps the time <select> from offering an
 * already-passed slot when the date is today, and does a final check on
 * submit so a slot that became invalid while the page sat open (e.g. the
 * user picked "today" and then waited) can't slip through.
 *
 * The time field is a <select> of fixed 30-minute slots (see index.html)
 * rather than a native <input type="time">, so "disabling the past" means
 * disabling individual <option> elements - a native time input's `.min`
 * attribute doesn't apply here.
 */

/** @type {HTMLInputElement} The pick-up date field (type="date"). */
const pickupDate = document.querySelector('input[name="date"]');

/** @type {HTMLSelectElement} The pick-up time field (30-minute slots). */
const pickupTime = document.querySelector('select[name="time"]');

/**
 * Formats a Date as the "YYYY-MM-DD" string an <input type="date"> expects,
 * using the browser's local timezone (not UTC).
 * @param {Date} date
 * @returns {string}
 */
const formatDateValue = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

/**
 * Formats a Date as an "HH:MM" (24-hour) string matching the value of the
 * time <select>'s options.
 * @param {Date} date
 * @returns {string}
 */
const formatTimeValue = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Combines the current date + time field values into a single Date object,
 * for comparing against "now".
 * @returns {Date|null} null if either field is empty.
 */
const getSelectedDateTime = () => {
  if (!pickupDate.value || !pickupTime.value) return null;
  const [year, month, day] = pickupDate.value.split('-').map(Number);
  const [hours, minutes] = pickupTime.value.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Keeps the date/time fields consistent with "now":
 *   - Sets the date field's `min` to today, and snaps its value up to
 *     today if it was left blank or somehow ended up in the past.
 *   - If the selected date is today, disables every time-slot option
 *     earlier than one minute from now (so nothing already-passed can be
 *     picked); if the date is in the future, re-enables all slots.
 *   - If the currently selected time slot just became disabled by the
 *     above, clears the selection back to the placeholder so the user
 *     must actively re-pick a valid time.
 */
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

/**
 * Re-runs `limitTimeForSelectedDate` and then checks whether the currently
 * selected date+time has already passed, setting a custom validity message
 * on the time field so the browser's native "please fill out this field"
 * / invalid-field UI reports it correctly.
 *
 * @param {boolean} [showPopup=false] When true and the time is invalid,
 *   immediately shows the browser's native validation bubble
 *   (`reportValidity()`) instead of waiting for form submission. Used on
 *   `change` events (a deliberate pick) but not on every `input` keystroke.
 */
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

// Wire everything up, and run one pass immediately so the fields are
// already in a valid state on page load (e.g. after a back-navigation
// that restored a stale date).
if (pickupDate && pickupTime) {
  pickupDate.addEventListener('change', () => updateTimeValidity(true));
  pickupTime.addEventListener('input', () => updateTimeValidity(false));
  pickupTime.addEventListener('change', () => updateTimeValidity(true));
  document.getElementById('quote').addEventListener('submit', updateTimeValidity);
  updateTimeValidity();
}
