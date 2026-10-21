/**
 * Account Profile page.
 *
 * Shows and edits the shipper's account details. They are saved on the
 * Express server (GET and PUT /api/profile through js/api.js, stored in
 * data/profile.json; there are no real accounts yet, so there is one
 * profile) and reused elsewhere:
 *   - js/booking-details.js fills step 4's "Account Owner Details" with them.
 *   - js/payment.js starts on the preferred payment method.
 * Bookings themselves are listed on pages/history.html, so this page only
 * links there with a count.
 */

import { getProfile, listBookings, saveProfile } from './api.js';

/** @type {HTMLFormElement} */
const profileForm = document.getElementById('profileForm');
/** @type {HTMLElement} "Profile saved" / error line next to the Save button. */
const profileSaveStatus = document.getElementById('profileSaveStatus');
/** @type {HTMLButtonElement} */
const saveButton = profileForm.querySelector('button[type="submit"]');

/** Profile fields edited by the form, matching each control's `name`. */
const profileFields = [
  'name', 'accountType', 'companyName', 'email', 'contact', 'emergencyContact',
  'streetAddress', 'city', 'province', 'zipCode', 'preferredPayment', 'notifications',
];

/**
 * Shows a message on the status line next to the Save button.
 * @param {string} text Empty to clear it.
 * @param {boolean} [isError=false]
 */
const setStatus = (text, isError = false) => {
  profileSaveStatus.textContent = text;
  profileSaveStatus.classList.toggle('text-danger', isError);
};

/**
 * Updates the summary card (avatar initials, name, account type) from a
 * profile.
 * @param {Record<string, string>} details The profile from GET /api/profile.
 */
const renderSummary = (details) => {
  const name = details.name.trim();
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileAccountType').textContent =
    details.accountType === 'Business' && details.companyName
      ? `${details.companyName} · Business`
      : details.accountType;
  document.getElementById('profileAvatar').textContent = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
};

/**
 * Shows "Member since", or "—" before the profile has first been saved.
 * @param {string} memberSince ISO timestamp, or "".
 */
const renderMemberSince = (memberSince) => {
  const date = new Date(memberSince);
  document.getElementById('profileMemberSince').textContent = !memberSince
    ? '—'
    : Number.isNaN(date.getTime())
      ? memberSince
      : new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date);
};

/** Fills the form and summary card from a profile. */
const render = (profile) => {
  profileFields.forEach((field) => {
    profileForm.elements[field].value = profile[field] ?? '';
  });
  document.getElementById('profileUserId').textContent = profile.userId;
  renderMemberSince(profile.memberSince);
  renderSummary(profile);
};

// Bookings are saved on the Express server (GET /api/bookings).
const bookingCountEl = document.getElementById('profileBookingCount');
listBookings()
  .then((bookings) => { bookingCountEl.textContent = String(bookings.length); })
  .catch(() => { bookingCountEl.textContent = '-'; });

// The form can't be saved until the profile has loaded, so a save never
// overwrites the server's profile with the page's placeholder values.
saveButton.disabled = true;
getProfile()
  .then((profile) => {
    render(profile);
    saveButton.disabled = false;
  })
  .catch(() => setStatus('Your profile could not be loaded. Make sure the server is running (npm start).', true));

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!profileForm.checkValidity()) {
    profileForm.classList.add('was-validated');
    setStatus('');
    return;
  }

  const changes = Object.fromEntries(
    profileFields.map((field) => [field, profileForm.elements[field].value.trim()]),
  );
  saveButton.disabled = true;
  setStatus('Saving...');
  try {
    const saved = await saveProfile(changes);
    render(saved);
    setStatus('Profile saved.');
  } catch (error) {
    setStatus(error.status ? error.message : 'Unable to save your profile. Please try again.', true);
  } finally {
    saveButton.disabled = false;
  }
});

// Clear the "saved" message once the form is edited again.
profileForm.addEventListener('input', () => setStatus(''));
