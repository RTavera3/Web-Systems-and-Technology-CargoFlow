/**
 * Account Profile page.
 *
 * Shows and edits the shipper's account details. They are saved through
 * js/storage.js (in this browser only; there are no real accounts) and
 * reused elsewhere:
 *   - js/booking-details.js fills step 4's "Account Owner Details" with them.
 *   - js/payment.js starts on the preferred payment method.
 * Bookings themselves are listed on pages/history.html, so this page only
 * links there with a count.
 */

import { getProfile, listBookings, saveProfile } from './storage.js';

/** @type {HTMLFormElement} */
const profileForm = document.getElementById('profileForm');
/** @type {HTMLElement} "Profile saved" / error line next to the Save button. */
const profileSaveStatus = document.getElementById('profileSaveStatus');

/** Profile fields edited by the form, matching each control's `name`. */
const profileFields = [
  'name', 'accountType', 'companyName', 'email', 'contact', 'emergencyContact',
  'streetAddress', 'city', 'province', 'zipCode', 'preferredPayment', 'notifications',
];

const profile = getProfile();

// Record the first visit as the "member since" date.
if (!profile.memberSince) {
  profile.memberSince = new Date().toISOString();
  saveProfile(profile);
}

/**
 * Updates the summary card (avatar initials, name, account type) from a
 * profile.
 * @param {import('./storage.js').AccountProfile} details
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

profileFields.forEach((field) => {
  profileForm.elements[field].value = profile[field] ?? '';
});
document.getElementById('profileUserId').textContent = profile.userId;
const memberSince = new Date(profile.memberSince);
document.getElementById('profileMemberSince').textContent = Number.isNaN(memberSince.getTime())
  ? profile.memberSince
  : new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(memberSince);
document.getElementById('profileBookingCount').textContent = String(listBookings().length);
renderSummary(profile);

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!profileForm.checkValidity()) {
    profileForm.classList.add('was-validated');
    profileSaveStatus.textContent = '';
    return;
  }
  profileFields.forEach((field) => {
    profile[field] = profileForm.elements[field].value.trim();
  });
  if (saveProfile(profile)) {
    renderSummary(profile);
    profileSaveStatus.textContent = 'Profile saved in this browser.';
    profileSaveStatus.classList.remove('text-danger');
  } else {
    profileSaveStatus.textContent = 'Unable to save your profile in this browser. Please try again.';
    profileSaveStatus.classList.add('text-danger');
  }
});

// Clear the "saved" message once the form is edited again.
profileForm.addEventListener('input', () => {
  profileSaveStatus.textContent = '';
});
