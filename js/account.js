(function () {
  const profileKey = 'cargoFlowAccountProfile';
  const transactionsKey = 'cargoFlowTransactions';
  const defaultProfile = {
    userId: 'FC00001',
    name: 'Juan Dela Cruz',
    accountType: 'Individual shipper',
    companyName: '',
    email: '',
    contact: '0999-123-4567',
    streetAddress: '123 Rizal Street, Barangay 143',
    city: 'Quezon City',
    province: 'Metro Manila',
    zipCode: '1100',
    emergencyContact: '',
    preferredPayment: '',
    notifications: 'Email and SMS',
    memberSince: '',
  };

  function readJson(key, fallback) {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error(`Unable to read ${key} from browser storage:`, error);
      return fallback;
    }
  }

  function getProfile() {
    return { ...defaultProfile, ...readJson(profileKey, {}) };
  }

  function saveProfile(profile) {
    localStorage.setItem(profileKey, JSON.stringify(profile));
  }

  function getTransactions() {
    const transactions = readJson(transactionsKey, []);
    if (!Array.isArray(transactions)) {
      console.error('Stored CargoFlow transaction history is not a list.');
      return [];
    }
    return transactions;
  }

  function addTransaction(transaction) {
    const transactions = getTransactions();
    transactions.unshift(transaction);
    localStorage.setItem(transactionsKey, JSON.stringify(transactions));
  }

  window.CargoFlowAccount = {
    addTransaction,
    getProfile,
    getTransactions,
    saveProfile,
  };
})();
