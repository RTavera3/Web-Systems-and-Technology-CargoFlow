// Booking Details wizard — pre-fills from the homepage's query params,
// keeps pick-up date/time valid, syncs pickup/drop-off city+province,
// looks up sender/receiver User IDs against resources/users.json, checks
// declared value/package count are digits-only, shows vehicle capacity
// guidance, and drives the 4-step wizard navigation.

const bookingParams = new URLSearchParams(window.location.search);
const requiredBookingFields = ['from', 'to', 'date', 'time', 'weight', 'type'];
const bookingIsComplete = requiredBookingFields.every(
  (field) => bookingParams.get(field),
);
const detailDate = document.getElementById('detailDate');
const detailTime = document.getElementById('detailTime');
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
  if (!detailDate.value || !detailTime.value) return null;
  const [year, month, day] = detailDate.value.split('-').map(Number);
  const [hours, minutes] = detailTime.value.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};
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

document.getElementById('bookingSummary').hidden = !bookingIsComplete;
document.getElementById('bookingIncomplete').hidden = bookingIsComplete;

const setValue = (id, name) => {
  const value = bookingParams.get(name);
  if (value) {
    document.getElementById(id).value = value;
  }
};

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

const setProvinceFromCity = (cityId, provinceSelectId, provinceInputId) => {
  const city = document.getElementById(cityId).value;
  const province = cityProvinceMap[city] || '';
  document.getElementById(provinceSelectId).value = province;
  document.getElementById(provinceInputId).value = province;
};

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

syncAddressCity('detailFrom', 'pickupCitySelect', 'pickupCity');
syncAddressCity('detailTo', 'dropoffCitySelect', 'dropoffCity');
setProvinceFromCity('pickupCitySelect', 'pickupProvinceSelect', 'pickupProvince');
setProvinceFromCity('dropoffCitySelect', 'dropoffProvinceSelect', 'dropoffProvince');

const addSelectOption = (select, value) => {
  if (!value) return;
  const existingOption = [...select.options].find((option) => option.value === value || option.textContent === value);
  if (!existingOption) select.add(new Option(value, value));
  select.value = value;
};

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
  addSelectOption(document.getElementById(fieldIds.routeSelect), user.city);
  document.getElementById(fieldIds.routeSelect).value = user.city;
};

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
      const lookup = () => {
        const value = input.value.trim().toUpperCase();
        input.value = value;
        fillUserDetails(userId, status, fields, usersById.get(value));
      };
      input.addEventListener('input', lookup);
      input.addEventListener('change', lookup);
      if (input.value) lookup();
    });
  })
  .catch(() => {
    ['senderUserIdStatus', 'receiverUserIdStatus'].forEach((statusId) => {
      document.getElementById(statusId).textContent = 'User records could not be loaded.';
      document.getElementById(statusId).classList.add('is-error');
    });
  });

const declaredValue = document.getElementById('declaredValue');
const packageCount = document.getElementById('packageCount');
const validateDigitsOnly = (field) => {
  const hasInvalidCharacters = field.value !== '' && !/^\d+$/.test(field.value);
  field.setCustomValidity(hasInvalidCharacters ? 'Please enter numerical digits only.' : '');
};

setValue('declaredValue', 'declaredValue');
[packageCount, declaredValue].forEach((field) => {
  field.addEventListener('input', () => validateDigitsOnly(field));
  field.addEventListener('change', () => validateDigitsOnly(field));
  validateDigitsOnly(field);
});

const vehicleSpecs = {
  Motorcycle: { maxWeight: 20 },
  Van: { maxWeight: 500 },
  'Light truck': { maxWeight: 2000 },
  '6-wheeler truck': { maxWeight: 5000 },
  '10-wheeler truck': { maxWeight: 10000 },
};
const vehicleType = document.getElementById('vehicleType');
const vehicleGuidance = document.getElementById('vehicleGuidance');
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
['detailWeight', 'packageCount'].forEach((id) => {
  document.getElementById(id).addEventListener('input', updateVehicleGuidance);
});
updateVehicleGuidance();

const detailsForm = document.querySelector('.details-form');
const bookingSteps = [...document.querySelectorAll('.booking-step')];
const stepIndicators = [...document.querySelectorAll('[data-step-indicator]')];
let activeStep = 1;

bookingSteps.forEach((step) => {
  step.querySelectorAll('input, select, textarea').forEach((control) => {
    control.dataset.initiallyDisabled = control.disabled ? 'true' : 'false';
  });
});

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

const validateActiveStep = () => {
  const currentStep = bookingSteps[activeStep - 1];
  const controls = [...currentStep.querySelectorAll('input, select, textarea')];
  const invalidControl = controls.find((control) => !control.checkValidity());
  if (invalidControl) invalidControl.reportValidity();
  return !invalidControl;
};

detailsForm.querySelectorAll('.step-next').forEach((button) => {
  button.addEventListener('click', () => {
    if (activeStep === 1) enforceCurrentTime();
    if (validateActiveStep() && activeStep < bookingSteps.length) {
      setActiveStep(activeStep + 1);
    }
  });
});

detailsForm.querySelectorAll('.step-back').forEach((button) => {
  button.addEventListener('click', () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  });
});

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

detailsForm.addEventListener('submit', (event) => {
  enforceCurrentTime();
  if (!validateActiveStep()) event.preventDefault();
});

detailsForm.querySelector('button[type="submit"]').addEventListener('click', enforceCurrentTime);

enforceCurrentTime();
setActiveStep(1);
