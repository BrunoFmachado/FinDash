function seedAccounts() {
  const existingAccounts = getStorageData(STORAGE_KEYS.accounts);

  if (existingAccounts.length > 0) return;

  const accounts = [
    {
      id: generateId("acc"),
      name: "Carteira principal",
      type: "Conta digital",
      initialBalance: 18420.0
    },
    {
      id: generateId("acc"),
      name: "Investimentos",
      type: "Renda fixa",
      initialBalance: 6700.1
    }
  ];

  setStorageData(STORAGE_KEYS.accounts, accounts);
}

function seedTransactions() {
  const existingTransactions = getStorageData(STORAGE_KEYS.transactions);

  if (existingTransactions.length > 0) return;

  const today = new Date();
  const currentDate = today.toISOString().split("T")[0];

  const transactions = [
    {
      id: generateId("trx"),
      type: "expense",
      title: "Supermercado Prime",
      category: "Alimentação",
      amount: 248.9,
      date: currentDate
    },
    {
      id: generateId("trx"),
      type: "income",
      title: "Pagamento cliente",
      category: "Freelance",
      amount: 1350.0,
      date: currentDate
    },
    {
      id: generateId("trx"),
      type: "expense",
      title: "Combustível",
      category: "Transporte",
      amount: 180.0,
      date: currentDate
    }
  ];

  setStorageData(STORAGE_KEYS.transactions, transactions);
}

function seedGoals() {
  const existingGoals = getStorageData(STORAGE_KEYS.goals);

  if (existingGoals.length > 0) return;

  const goals = [
    {
      id: generateId("goal"),
      title: "Reserva de emergência",
      target: 20000,
      current: 15600,
      monthlyContribution: 1900,
      deadline: "2026-12-31"
    }
  ];

  setStorageData(STORAGE_KEYS.goals, goals);
}

function seedBills() {
  const existingBills = getStorageData(STORAGE_KEYS.bills);

  if (existingBills.length > 0) return;

  const bills = [
    {
      id: generateId("bill"),
      title: "Energia elétrica",
      amount: 187.3,
      dueDate: "2026-03-15",
      paid: false
    },
    {
      id: generateId("bill"),
      title: "Aluguel",
      amount: 1450.0,
      dueDate: "2026-03-18",
      paid: false
    }
  ];

  setStorageData(STORAGE_KEYS.bills, bills);
}

function seedInitialData() {
  seedAccounts();
  seedTransactions();
  seedGoals();
  seedBills();
}
