const profileForm = document.getElementById('profileForm');
const profileSaveStatus = document.getElementById('profileSaveStatus');
const profileFields = [
  'name',
  'accountType',
  'companyName',
  'email',
  'contact',
  'streetAddress',
  'city',
  'province',
  'zipCode',
  'emergencyContact',
  'preferredPayment',
  'notifications',
];
const accountProfile = window.CargoFlowAccount.getProfile();
if (!accountProfile.memberSince) {
  accountProfile.memberSince = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date());
  window.CargoFlowAccount.saveProfile(accountProfile);
}

profileFields.forEach((name) => {
  profileForm.elements[name].value = accountProfile[name] || '';
});
document.getElementById('profileUserId').textContent = accountProfile.userId;
document.getElementById('profileMemberSince').textContent = accountProfile.memberSince;

function updateProfileIdentity(profile) {
  const name = profile.name.trim();
  document.getElementById('profileTitle').textContent = name;
  document.getElementById('profileAccountType').textContent =
    profile.accountType === 'Business' && profile.companyName
      ? `${profile.companyName} · Business`
      : profile.accountType;
  document.getElementById('profileAvatar').textContent = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

updateProfileIdentity(accountProfile);

profileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const updatedProfile = { ...accountProfile };
  profileFields.forEach((name) => {
    updatedProfile[name] = profileForm.elements[name].value.trim();
  });
  try {
    window.CargoFlowAccount.saveProfile(updatedProfile);
    Object.assign(accountProfile, updatedProfile);
    updateProfileIdentity(accountProfile);
    profileSaveStatus.textContent = 'Profile saved in this browser.';
    profileSaveStatus.removeAttribute('data-error');
  } catch (error) {
    console.error('Unable to save account profile:', error);
    profileSaveStatus.textContent = 'Unable to save your profile in this browser. Please try again.';
    profileSaveStatus.dataset.error = 'true';
  }
});
