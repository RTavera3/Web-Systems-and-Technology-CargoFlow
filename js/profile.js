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

function createCell(text) {
  const cell = document.createElement('td');
  cell.textContent = text || '—';
  return cell;
}

function createTransactionRow(transaction) {
  const row = document.createElement('tr');
  const reference = document.createElement('strong');
  reference.textContent = transaction.id || 'Booking';
  const referenceCell = document.createElement('td');
  referenceCell.append(reference);

  const routeCell = createCell(transaction.route);
  const detailsCell = document.createElement('td');
  detailsCell.textContent = `${transaction.sender || accountProfile.name} → ${transaction.receiver || 'Receiver'}`;
  const cargoCell = document.createElement('td');
  const declaredValue = Number(transaction.declaredValue);
  const formattedValue = Number.isFinite(declaredValue)
    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(declaredValue)
    : 'Value not provided';
  cargoCell.textContent = [
    transaction.cargoDescription,
    transaction.packageCount ? `${transaction.packageCount} package(s)` : '',
    `Declared ${formattedValue}`,
  ].filter(Boolean).join(' · ');

  const date = transaction.shipmentDate
    ? new Date(`${transaction.shipmentDate}T00:00:00`)
    : new Date(transaction.createdAt);
  const dateCell = createCell(Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date));

  const statusCell = document.createElement('td');
  const statusBadge = document.createElement('span');
  statusBadge.className = `transaction-status status-${transaction.status || 'submitted'}`;
  statusBadge.textContent = transaction.status === 'delivered'
    ? 'Delivered'
    : transaction.status === 'cancelled'
      ? 'Cancelled'
      : 'Booking submitted';
  statusCell.append(statusBadge);

  const paymentCell = createCell(
    transaction.paymentStatus === 'paid'
      ? 'Paid'
      : transaction.paymentMethod
        ? `${transaction.paymentMethod} · pending`
        : 'Pending',
  );
  row.append(referenceCell, routeCell, detailsCell, cargoCell, dateCell, statusCell, paymentCell);
  return row;
}

function renderTransactions() {
  const transactions = window.CargoFlowAccount.getTransactions();
  const ongoing = transactions.filter(
    (transaction) => !['delivered', 'cancelled'].includes(transaction.status),
  );
  const past = transactions.filter(
    (transaction) => ['delivered', 'cancelled'].includes(transaction.status),
  );
  document.getElementById('ongoingCount').textContent = ongoing.length;
  document.getElementById('pastCount').textContent = past.length;

  [
    [document.getElementById('ongoingList'), ongoing, 'No ongoing bookings yet. Your submitted bookings will appear here.'],
    [document.getElementById('pastList'), past, 'Completed and cancelled bookings will appear here.'],
  ].forEach(([container, records, emptyMessage]) => {
    container.replaceChildren();
    if (!records.length) {
      const empty = document.createElement('p');
      empty.className = 'transaction-empty';
      empty.textContent = emptyMessage;
      container.append(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'transaction-table';
    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Booking', 'Route', 'Sender → Receiver', 'Cargo details', 'Ship date', 'Status', 'Payment'].forEach((label) => {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      headerRow.append(cell);
    });
    header.append(headerRow);
    const body = document.createElement('tbody');
    records.forEach((transaction) => body.append(createTransactionRow(transaction)));
    table.append(header, body);
    container.append(table);
  });
}

const transactionTabs = [
  [document.getElementById('ongoingTab'), document.getElementById('ongoingTransactions')],
  [document.getElementById('pastTab'), document.getElementById('pastTransactions')],
];
transactionTabs.forEach(([tab]) => {
  tab.addEventListener('click', () => {
    transactionTabs.forEach(([otherTab, panel]) => {
      const selected = otherTab === tab;
      otherTab.setAttribute('aria-selected', String(selected));
      otherTab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    });
  });
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = transactionTabs.findIndex(([item]) => item === tab);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = transactionTabs[(currentIndex + direction + transactionTabs.length) % transactionTabs.length][0];
    next.focus();
    next.click();
  });
});

renderTransactions();
