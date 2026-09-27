/**
 * Booking Details page: a 4-step wizard (Cargo, Addresses, Shipment,
 * Review) collected into one <form method="get" action="payment.html">.
 *
 * This script is organized into these responsibilities, in the order they
 * appear below:
 *   1. Pre-fill step 1 (Cargo) from the URL query string the homepage
 *      quote form submitted, and keep its date/time fields valid.
 *   2. Sync each address card's city/province from the route chosen in
 *      step 1, so "Pick-up city: Manila" also sets the pickup address's
 *      city/province without the user re-selecting it.
 *   3. Sender/Receiver "User ID" auto-fill: looks a typed ID up against
 *      resources/users.json and fills in that person's saved details.
 *   4. Digits-only validation for package count / declared value.
 *   5. Vehicle capacity guidance (warns if cargo weight exceeds the
 *      selected vehicle's limit).
 *   6. Wizard navigation: shows one step at a time, validates the current
 *      step before advancing, and drives the step-indicator circles.
 *   7. A final past-time check right before the step 1 -> 2 transition and
 *      on submit, since the wizard can legitimately sit open past the
 *      originally-chosen pickup time.
 *
 * Nothing here calls a server: the whole flow is client-side, and the
 * "submit" at the end is a GET that carries every field to payment.html
 * as query params (see js/payment.js).
 */

/** Query params carried over from the homepage's "Get a price" form. */
const bookingParams = new URLSearchParams(window.location.search);

/**
 * The step-1 fields that must all be present for the booking summary to
 * be considered valid. If any are missing (e.g. someone opened this page
 * directly instead of via the homepage form), the summary card stays
 * hidden and an "incomplete" warning shows instead.
 * @type {string[]}
 */
const requiredBookingFields = ['from', 'to', 'date', 'time', 'weight', 'type'];

/** @type {boolean} Whether every field in `requiredBookingFields` is present. */
const bookingIsComplete = requiredBookingFields.every(
  (field) => bookingParams.get(field),
);

/** @type {HTMLInputElement} Step 1's pick-up date field. */
const detailDate = document.getElementById('detailDate');
/** @type {HTMLSelectElement} Step 1's pick-up time field (30-minute slots). */
const detailTime = document.getElementById('detailTime');

/**
 * Formats a Date as "YYYY-MM-DD" (local time) for an <input type="date">.
 * @param {Date} date
 * @returns {string}
 */
const formatDateValue = (date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

/**
 * Formats a Date as "HH:MM" (24-hour), matching the time <select>'s
 * option values.
 * @param {Date} date
 * @returns {string}
 */
const formatTimeValue = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Combines the date + time fields into one Date, for past/future checks.
 * @returns {Date|null} null if either field is empty.
 */
const getSelectedDateTime = () => {
  if (!detailDate.value || !detailTime.value) return null;
  const [year, month, day] = detailDate.value.split('-').map(Number);
  const [hours, minutes] = detailTime.value.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Keeps the date/time fields consistent with "now" - same approach as
 * js/quote-form.js on the homepage: clamps the date to today-or-later,
 * and when the date is today, disables every time-slot option earlier
 * than one minute from now (clearing the selection if it just became
 * disabled).
 */
const limitTimeForSelectedDate = () => {
  if (!detailDate || !detailTime) return;

  const todayString = formatDateValue(new Date());
  detailDate.min = todayString;

  if (!detailDate.value || detailDate.value < todayString) {
    detailDate.value = todayString;
  }

  const minTime = detailDate.value === todayString
    ? formatTimeValue(new Date(Date.now() + 60000))
    : '';

  [...detailTime.options].forEach((option) => {
    if (!option.value) return;
    option.disabled = minTime !== '' && option.value < minTime;
  });
  if (detailTime.value && detailTime.selectedOptions[0]?.disabled) {
    detailTime.value = '';
  }
};

/**
 * Maps a city name to its province, used to auto-fill the Province field
 * whenever a City is chosen (in step 1's route or a step-2 address card).
 * Covers both the short city names used in the <select> options and the
 * "___ City" variants that come back from resources/users.json.
 * @type {Record<string, string>}
 */
const cityProvinceMap = {
  Manila: 'Metro Manila',
  Batangas: 'Batangas',
  'Batangas City': 'Batangas',
  Baguio: 'Benguet',
  'Baguio City': 'Benguet',
  Cebu: 'Cebu',
  'Cebu City': 'Cebu',
  Davao: 'Davao del Sur',
  'Davao City': 'Davao del Sur',
  Pampanga: 'Pampanga',
  'San Fernando': 'Pampanga',
};

// Only reveal the "Your Cargo Details" summary once we know step 1's
// fields actually arrived from the homepage form.
document.getElementById('bookingSummary').hidden = !bookingIsComplete;
document.getElementById('bookingIncomplete').hidden = bookingIsComplete;

/**
 * Sets a field's value from a same-named URL query param, if present.
 * Leaves the field untouched (keeping its HTML default value) when the
 * param is absent - this is what lets the demo-friendly defaults baked
 * into the HTML (e.g. sample User IDs, sample shipment details) survive
 * when this page is opened without a full query string.
 * @param {string} id Element id to set.
 * @param {string} name Query param name to read.
 */
const setValue = (id, name) => {
  const value = bookingParams.get(name);
  if (value) {
    document.getElementById(id).value = value;
  }
};

// --- Step 1 (Cargo): pre-fill from the homepage form's query params ---

setValue('detailFrom', 'from');
setValue('detailTo', 'to');
setValue('detailDate', 'date');
setValue('detailTime', 'time');
limitTimeForSelectedDate();
detailDate?.addEventListener('change', limitTimeForSelectedDate);
setValue('detailWeight', 'weight');
setValue('detailType', 'type');
setValue('cargoDescription', 'cargoDescription');
setValue('packageCount', 'packageCount');
setValue('declaredValue', 'declaredValue');
setValue('vehicleType', 'vehicleType');
setValue('specialInstructions', 'specialInstructions');
setValue('senderUserId', 'senderUserId');
setValue('receiverUserId', 'receiverUserId');
setValue('senderName', 'senderName');
setValue('senderContact', 'senderContact');
setValue('pickupAddress', 'pickupAddress');
setValue('pickupZip', 'pickupZip');
setValue('dropoffAddress', 'dropoffAddress');
setValue('receiverName', 'receiverName');
setValue('receiverContact', 'receiverContact');
setValue('dropoffZip', 'dropoffZip');

document.getElementById('detailFragile').checked = bookingParams.has('fragile');
document.getElementById('detailLoading').checked = bookingParams.has('loading');

// --- Step 2 (Addresses): keep city/province in sync with step 1's route ---

/**
 * Looks up a city's province and writes it into both the visible
 * <select> (disabled, display-only) and the hidden input that actually
 * gets submitted for that province.
 * @param {string} cityId Id of the city <select> to read.
 * @param {string} provinceSelectId Id of the disabled province <select> to update.
 * @param {string} provinceInputId Id of the hidden province input to update.
 */
const setProvinceFromCity = (cityId, provinceSelectId, provinceInputId) => {
  const city = document.getElementById(cityId).value;
  const province = cityProvinceMap[city] || '';
  document.getElementById(provinceSelectId).value = province;
  document.getElementById(provinceInputId).value = province;
};

/**
 * Copies the city chosen for a route endpoint (step 1's pick-up/drop-off
 * city) into the matching address card's city <select> and hidden input,
 * so the two stay in agreement without the user re-selecting the city.
 * @param {string} routeCityId Id of step 1's from/to <select>.
 * @param {string} addressCitySelectId Id of the address card's (disabled) city <select>.
 * @param {string} addressCityInputId Id of the address card's hidden city input.
 */
const syncAddressCity = (routeCityId, addressCitySelectId, addressCityInputId) => {
  const city = document.getElementById(routeCityId).value;
  document.getElementById(addressCitySelectId).value = city;
  document.getElementById(addressCityInputId).value = city;
};

document.getElementById('detailFrom').addEventListener('change', () => {
  syncAddressCity('detailFrom', 'pickupCitySelect', 'pickupCity');
  setProvinceFromCity('pickupCitySelect', 'pickupProvinceSelect', 'pickupProvince');
});
document.getElementById('detailTo').addEventListener('change', () => {
  syncAddressCity('detailTo', 'dropoffCitySelect', 'dropoffCity');
  setProvinceFromCity('dropoffCitySelect', 'dropoffProvinceSelect', 'dropoffProvince');
});

// Run once on load too, so a route pre-filled from the URL immediately
// propagates to the address cards instead of waiting for a change event.
syncAddressCity('detailFrom', 'pickupCitySelect', 'pickupCity');
syncAddressCity('detailTo', 'dropoffCitySelect', 'dropoffCity');
setProvinceFromCity('pickupCitySelect', 'pickupProvinceSelect', 'pickupProvince');
setProvinceFromCity('dropoffCitySelect', 'dropoffProvinceSelect', 'dropoffProvince');

// --- Step 2: Sender/Receiver User ID auto-fill ---

/**
 * Adds `value` as a new <option> to `select` if it isn't already one of
 * its options (matched by value or visible text), then selects it. Used
 * so a looked-up user's city (e.g. "Batangas City") can be selected even
 * if the address card's <select> only lists the shorter city names.
 * @param {HTMLSelectElement} select
 * @param {string} value
 */
const addSelectOption = (select, value) => {
  if (!value) return;
  const existingOption = [...select.options].find((option) => option.value === value || option.textContent === value);
  if (!existingOption) select.add(new Option(value, value));
  select.value = value;
};

/**
 * Applies a looked-up user's saved details to one address card (sender or
 * receiver), and reflects whether the lookup succeeded via a custom
 * validity message + status text + `.is-error`/`.user-id-invalid` styling
 * (see the `.user-id-status`/`.user-id-invalid` rules in css/theme.css).
 *
 * @param {string} userIdFieldId Id of the User ID <input> being validated.
 * @param {string} statusId Id of the small status text element next to it.
 * @param {{
 *   name: string, contact: string, address: string, zip: string,
 *   citySelect: string, provinceSelect: string, cityInput: string,
 *   provinceInput: string, routeSelect: string,
 * }} fieldIds Ids of every field this user's details should fill in.
 * @param {{
 *   name: string, contactNumber: string, streetAddress: string,
 *   zipCode: string, city: string, province: string,
 * }|undefined} user The matched user record, or undefined if the ID
 *   wasn't found in resources/users.json.
 */
const fillUserDetails = (userIdFieldId, statusId, fieldIds, user) => {
  const userIdField = document.getElementById(userIdFieldId);
  const status = document.getElementById(statusId);
  const isValid = Boolean(user);
  userIdField.setCustomValidity(isValid ? '' : 'Enter a valid User ID.');
  userIdField.classList.toggle('user-id-invalid', !isValid);
  status.textContent = isValid ? `Details loaded for ${user.name}.` : 'User ID not found.';
  status.classList.toggle('is-error', !isValid);

  if (!user) return;
  document.getElementById(fieldIds.name).value = user.name;
  document.getElementById(fieldIds.contact).value = user.contactNumber;
  document.getElementById(fieldIds.address).value = user.streetAddress;
  document.getElementById(fieldIds.zip).value = user.zipCode;
  addSelectOption(document.getElementById(fieldIds.citySelect), user.city);
  addSelectOption(document.getElementById(fieldIds.provinceSelect), user.province);
  document.getElementById(fieldIds.cityInput).value = user.city;
  document.getElementById(fieldIds.provinceInput).value = user.province;
  // Also push the city back onto step 1's route select, so a user looked
  // up in step 2 keeps the whole form's route in agreement.
  addSelectOption(document.getElementById(fieldIds.routeSelect), user.city);
  document.getElementById(fieldIds.routeSelect).value = user.city;
};

// Load the user directory once, build the shared <datalist> of known IDs,
// and wire up live lookup on both the Sender and Receiver User ID fields.
fetch('../resources/users.json')
  .then((response) => {
    if (!response.ok) throw new Error('Unable to load user records.');
    return response.json();
  })
  .then((users) => {
    const usersById = new Map(users.map((user) => [user.userId.toUpperCase(), user]));
    const userIdOptions = document.getElementById('userIdOptions');
    users.forEach((user) => {
      userIdOptions.append(new Option(`${user.userId} - ${user.name}`, user.userId));
    });

    /**
     * One entry per User ID field: which status element and which set of
     * downstream fields it should fill in on a successful lookup.
     */
    const userFields = [
      {
        userId: 'senderUserId',
        status: 'senderUserIdStatus',
        fields: {
          name: 'senderName', contact: 'senderContact', address: 'pickupAddress', zip: 'pickupZip',
          citySelect: 'pickupCitySelect', provinceSelect: 'pickupProvinceSelect',
          cityInput: 'pickupCity', provinceInput: 'pickupProvince', routeSelect: 'detailFrom',
        },
      },
      {
        userId: 'receiverUserId',
        status: 'receiverUserIdStatus',
        fields: {
          name: 'receiverName', contact: 'receiverContact', address: 'dropoffAddress', zip: 'dropoffZip',
          citySelect: 'dropoffCitySelect', provinceSelect: 'dropoffProvinceSelect',
          cityInput: 'dropoffCity', provinceInput: 'dropoffProvince', routeSelect: 'detailTo',
        },
      },
    ];

    userFields.forEach(({ userId, status, fields }) => {
      const input = document.getElementById(userId);
      /**
       * Normalizes the typed ID to uppercase, looks it up, and applies
       * (or clears) the matching user's details.
       */
      const lookup = () => {
        const value = input.value.trim().toUpperCase();
        input.value = value;
        fillUserDetails(userId, status, fields, usersById.get(value));
      };
      input.addEventListener('input', lookup);
      input.addEventListener('change', lookup);
      // Run immediately if the field already has a value (e.g. pre-filled
      // by the HTML's demo defaults, or restored via `setValue` above).
      if (input.value) lookup();
    });
  })
  .catch(() => {
    // If resources/users.json can't be fetched (e.g. opened the HTML file
    // directly via file:// instead of a local server), tell the user
    // rather than leaving the fields silently non-functional.
    ['senderUserIdStatus', 'receiverUserIdStatus'].forEach((statusId) => {
      document.getElementById(statusId).textContent = 'User records could not be loaded.';
      document.getElementById(statusId).classList.add('is-error');
    });
  });

// --- Step 3 (Shipment): digits-only validation ---

/** @type {HTMLInputElement} Step 3's declared cargo value field. */
const declaredValue = document.getElementById('declaredValue');
/** @type {HTMLInputElement} Step 3's number-of-packages field. */
const packageCount = document.getElementById('packageCount');

/**
 * Sets a custom validity message on a field if it contains anything other
 * than digits (an empty value is left alone - `required` handles that
 * separately). These two fields use `type="text"` with `pattern="[0-9]+"`
 * rather than `type="number"`, so this mirrors that pattern in JS to give
 * a clearer message than the browser's generic "match the pattern" text.
 * @param {HTMLInputElement} field
 */
const validateDigitsOnly = (field) => {
  const hasInvalidCharacters = field.value !== '' && !/^\d+$/.test(field.value);
  field.setCustomValidity(hasInvalidCharacters ? 'Please enter numerical digits only.' : '');
};

setValue('declaredValue', 'declaredValue');
[packageCount, declaredValue].forEach((field) => {
  field.addEventListener('input', () => validateDigitsOnly(field));
  field.addEventListener('change', () => validateDigitsOnly(field));
  validateDigitsOnly(field); // Catch a pre-filled/restored value too.
});

// --- Step 3: vehicle capacity guidance ---

/**
 * Maximum recommended cargo weight (kg) for each vehicle type, used only
 * to show a friendly capacity hint/warning - it does not block submission.
 * @type {Record<string, {maxWeight: number}>}
 */
const vehicleSpecs = {
  Motorcycle: { maxWeight: 20 },
  Van: { maxWeight: 500 },
  'Light truck': { maxWeight: 2000 },
  '6-wheeler truck': { maxWeight: 5000 },
  '10-wheeler truck': { maxWeight: 10000 },
};
/** @type {HTMLSelectElement} Step 3's vehicle type field. */
const vehicleType = document.getElementById('vehicleType');
/** @type {HTMLElement} The capacity guidance text shown below the vehicle field. */
const vehicleGuidance = document.getElementById('vehicleGuidance');

/**
 * Updates the vehicle guidance text based on the selected vehicle and the
 * cargo weight entered back in step 1, warning (and adding the
 * `.vehicle-warning` styling class) if the cargo exceeds that vehicle's
 * recommended capacity.
 */
const updateVehicleGuidance = () => {
  const selectedVehicle = vehicleSpecs[vehicleType.value];
  if (!selectedVehicle) {
    vehicleGuidance.textContent = 'Select a vehicle to see its recommended cargo capacity.';
    return;
  }

  const weight = Number(document.getElementById('detailWeight').value);
  const exceedsWeight = weight > selectedVehicle.maxWeight;

  vehicleGuidance.textContent = `Recommended capacity: up to ${selectedVehicle.maxWeight.toLocaleString()} kg.`;
  if (exceedsWeight) {
    vehicleGuidance.textContent += ' This vehicle may be too small for the entered cargo. Choose a larger vehicle.';
    vehicleGuidance.classList.add('vehicle-warning');
  } else {
    vehicleGuidance.classList.remove('vehicle-warning');
  }
};

vehicleType.addEventListener('change', updateVehicleGuidance);
// Also react to weight/package count changes, since weight (entered in
// step 1) is what the guidance is compared against.
['detailWeight', 'packageCount'].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateVehicleGuidance);
});
updateVehicleGuidance(); // Show correct guidance immediately for a pre-filled vehicle.

// --- Wizard navigation (steps 1-4) ---

/** @type {HTMLFormElement} The single form spanning all 4 wizard steps. */
const detailsForm = document.querySelector('.details-form');
/** @type {HTMLElement[]} Each step's wrapper `<div class="booking-step" data-step="N">`. */
const bookingSteps = [...document.querySelectorAll('.booking-step')];
/** @type {HTMLElement[]} The 4 numbered-circle indicators above the form. */
const stepIndicators = [...document.querySelectorAll('[data-step-indicator]')];
/** @type {number} 1-indexed number of the currently visible step. */
let activeStep = 1;

// Remember which controls started out disabled (the address cards' city
// <select>s are always disabled, kept in sync via JS instead of being
// user-editable) so future logic could distinguish "disabled by design"
// from "disabled because its step is hidden", if ever needed.
bookingSteps.forEach((step) => {
  step.querySelectorAll('input, select, textarea').forEach((control) => {
    control.dataset.initiallyDisabled = control.disabled ? 'true' : 'false';
  });
});

/**
 * Shows only the requested step (hiding the rest), updates which
 * step-indicator circle is "active" (current) vs. "complete" (already
 * passed), and scrolls back to the top of the page - so advancing to a
 * new step always starts the user at its top instead of wherever they
 * were scrolled to on the previous step.
 * @param {number} stepNumber 1-indexed step to show.
 */
const setActiveStep = (stepNumber) => {
  activeStep = stepNumber;
  bookingSteps.forEach((step) => {
    const isActive = Number(step.dataset.step) === activeStep;
    step.hidden = !isActive;
  });
  stepIndicators.forEach((indicator) => {
    const indicatorStep = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle('is-active', indicatorStep === activeStep);
    indicator.classList.toggle('is-complete', indicatorStep < activeStep);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Checks every input/select/textarea within the currently active step
 * against HTML5 constraint validation (`required`, `pattern`, custom
 * validity messages set elsewhere in this file, etc.). Fields in other
 * (hidden) steps are not checked, so the user only has to fix what's
 * actually in front of them.
 * @returns {boolean} true if the whole active step is valid.
 */
const validateActiveStep = () => {
  const currentStep = bookingSteps[activeStep - 1];
  const controls = [...currentStep.querySelectorAll('input, select, textarea')];
  const invalidControl = controls.find((control) => !control.checkValidity());
  if (invalidControl) invalidControl.reportValidity();
  return !invalidControl;
};

// "Next" buttons: re-check the pickup time (only meaningful when leaving
// step 1), validate everything on the current step, and advance.
detailsForm.querySelectorAll('.step-next').forEach((button) => {
  button.addEventListener('click', () => {
    if (activeStep === 1) enforceCurrentTime();
    if (validateActiveStep() && activeStep < bookingSteps.length) {
      setActiveStep(activeStep + 1);
    }
  });
});

// "Back" buttons: no validation needed going backwards.
detailsForm.querySelectorAll('.step-back').forEach((button) => {
  button.addEventListener('click', () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  });
});

/**
 * Re-validates that the selected pickup date+time hasn't slipped into the
 * past since it was chosen (the wizard can sit open for a while across
 * multiple steps), setting a custom validity message and the
 * `.time-invalid` styling class on the time field if so.
 * @param {boolean} [showPopup=false] When true and the time is now
 *   invalid, immediately shows the browser's native validation bubble.
 */
const enforceCurrentTime = (showPopup = false) => {
  limitTimeForSelectedDate();
  const now = new Date();
  const selectedDateTime = getSelectedDateTime();
  const hasPastDateTime = selectedDateTime && selectedDateTime <= now;
  const hasInvalidTime = Boolean(hasPastDateTime);
  detailTime.setCustomValidity(hasInvalidTime ? 'Please choose a current or future pick-up time.' : '');
  detailTime.classList.toggle('time-invalid', hasInvalidTime);
  if (showPopup && hasInvalidTime) detailTime.reportValidity();
};

detailDate?.addEventListener('change', () => enforceCurrentTime(true));
detailTime?.addEventListener('input', () => enforceCurrentTime(false));
detailTime?.addEventListener('change', () => enforceCurrentTime(true));

// Final safety net on actual form submission (step 4's "Confirm and Pay"):
// re-check the time one last time, and block submission if the active
// step (step 4) somehow still has an invalid field.
detailsForm.addEventListener('submit', (event) => {
  enforceCurrentTime();
  if (!validateActiveStep()) event.preventDefault();
});

detailsForm.querySelector('button[type="submit"]').addEventListener('click', enforceCurrentTime);

// Run once on load: make sure the time is valid immediately, and start
// the wizard on step 1 regardless of what might be in the DOM already.
enforceCurrentTime();
setActiveStep(1);
