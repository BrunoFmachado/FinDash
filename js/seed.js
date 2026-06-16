function getTransactions() {
  return getStorageData(STORAGE_KEYS.transactions);
}

function saveTransactions(transactions) {
  setStorageData(STORAGE_KEYS.transactions, transactions);
}

function getAccounts() {
  return getStorageData(STORAGE_KEYS.accounts);
}

function getTransactionTypeLabel(type) {
  return type === "income" ? "Receita" : "Despesa";
}

function calculateTransactionSummary(transactions) {
  const incomeTotal = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const expenseTotal = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  return {
    incomeTotal,
    expenseTotal,
    balanceTotal: incomeTotal - expenseTotal
  };
}

function renderTransactionSummary(transactions) {
  const summary = calculateTransactionSummary(transactions);

  const incomeElement = document.getElementById("transactionsIncomeTotal");
  const expenseElement = document.getElementById("transactionsExpenseTotal");
  const balanceElement = document.getElementById("transactionsBalanceTotal");

  if (incomeElement) incomeElement.textContent = formatCurrency(summary.incomeTotal);
  if (expenseElement) expenseElement.textContent = formatCurrency(summary.expenseTotal);
  if (balanceElement) balanceElement.textContent = formatCurrency(summary.balanceTotal);
}

function populateTransactionAccounts() {
  const accountSelect = document.getElementById("transactionAccount");
  if (!accountSelect) return;

  const accounts = getAccounts();

  accountSelect.innerHTML = `
    <option value="">Selecione uma conta</option>
    ${accounts
      .map((account) => `<option value="${account.id}">${account.name}</option>`)
      .join("")}
  `;
}

function getAccountNameById(accountId) {
  const accounts = getAccounts();
  const account = accounts.find((item) => item.id === accountId);
  return account ? account.name : "-";
}

function createTransactionRow(transaction) {
  return `
    <tr>
      <td>${getTransactionTypeLabel(transaction.type)}</td>
      <td>${transaction.title || "-"}</td>
      <td>${transaction.category || "-"}</td>
      <td>${getAccountNameById(transaction.accountId)}</td>
      <td>${formatDate(transaction.date)}</td>
      <td>${formatCurrency(transaction.amount)}</td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary" type="button" onclick="editTransaction('${transaction.id}')">
            Editar
          </button>
          <button class="btn btn-secondary" type="button" onclick="deleteTransaction('${transaction.id}')">
            Excluir
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderTransactionsTable(transactions) {
  const tableBody = document.getElementById("transactionsTableBody");
  const emptyState = document.getElementById("transactionsEmptyState");

  if (!tableBody || !emptyState) return;

  if (transactions.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  tableBody.innerHTML = transactions.map(createTransactionRow).join("");
  emptyState.style.display = "none";
}

function renderTransactionsPage(transactions = getTransactions()) {
  renderTransactionSummary(transactions);
  renderTransactionsTable(transactions);
  updateTransactionsBadge();
}

function resetTransactionFormState() {
  const form = document.getElementById("transactionForm");
  if (!form) return;

  form.removeAttribute("data-edit-id");

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Salvar transação";
  }
}

function fillTransactionForm(transaction) {
  const form = document.getElementById("transactionForm");
  if (!form) return;

  document.getElementById("transactionType").value = transaction.type || "";
  document.getElementById("transactionTitle").value = transaction.title || "";
  document.getElementById("transactionAmount").value = Number(transaction.amount || 0);
  document.getElementById("transactionCategory").value = transaction.category || "";
  document.getElementById("transactionAccount").value = transaction.accountId || "";
  document.getElementById("transactionDate").value = transaction.date || "";
  document.getElementById("transactionDescription").value = transaction.description || "";

  form.setAttribute("data-edit-id", transaction.id);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Atualizar transação";
  }
}

function handleTransactionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const editId = form.getAttribute("data-edit-id");

  const transaction = {
    id: editId || generateId("trx"),
    type: document.getElementById("transactionType").value,
    title: document.getElementById("transactionTitle").value.trim(),
    amount: Number(document.getElementById("transactionAmount").value || 0),
    category: document.getElementById("transactionCategory").value.trim(),
    accountId: document.getElementById("transactionAccount").value,
    date: document.getElementById("transactionDate").value,
    description: document.getElementById("transactionDescription").value.trim()
  };

  const transactions = getTransactions();

  if (editId) {
    const updatedTransactions = transactions.map((item) => {
      return item.id === editId ? transaction : item;
    });

    saveTransactions(updatedTransactions);
  } else {
    saveTransactions([transaction, ...transactions]);
  }

  form.reset();
  resetTransactionFormState();
  renderTransactionsPage();
}

function applyTransactionFilters(event) {
  event.preventDefault();

  const type = document.getElementById("filterType").value;
  const category = document.getElementById("filterCategory").value.trim().toLowerCase();
  const dateStart = document.getElementById("filterDateStart").value;
  const dateEnd = document.getElementById("filterDateEnd").value;

  let filteredTransactions = getTransactions();

  if (type) {
    filteredTransactions = filteredTransactions.filter((item) => item.type === type);
  }

  if (category) {
    filteredTransactions = filteredTransactions.filter((item) =>
      String(item.category || "").toLowerCase().includes(category)
    );
  }

  if (dateStart) {
    filteredTransactions = filteredTransactions.filter((item) => item.date >= dateStart);
  }

  if (dateEnd) {
    filteredTransactions = filteredTransactions.filter((item) => item.date <= dateEnd);
  }

  renderTransactionsPage(filteredTransactions);
}

function setupTransactionForm() {
  const form = document.getElementById("transactionForm");
  if (!form) return;

  form.addEventListener("submit", handleTransactionSubmit);
  form.addEventListener("reset", () => {
    setTimeout(() => {
      resetTransactionFormState();
    }, 0);
  });
}

function setupTransactionFilters() {
  const filterForm = document.getElementById("transactionFilterForm");
  if (!filterForm) return;

  filterForm.addEventListener("submit", applyTransactionFilters);
  filterForm.addEventListener("reset", () => {
    setTimeout(() => {
      renderTransactionsPage();
    }, 0);
  });
}

function editTransaction(transactionId) {
  const transactions = getTransactions();
  const transaction = transactions.find((item) => item.id === transactionId);

  if (!transaction) return;

  fillTransactionForm(transaction);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTransaction(transactionId) {
  const transactions = getTransactions();
  const updatedTransactions = transactions.filter((item) => item.id !== transactionId);

  saveTransactions(updatedTransactions);
  renderTransactionsPage();
}

function updateTransactionsBadge() {
  const badge = document.getElementById("transactionsBadge");
  if (!badge) return;

  badge.textContent = getTransactions().length;
}

document.addEventListener("DOMContentLoaded", () => {
  populateTransactionAccounts();
  setupTransactionForm();
  setupTransactionFilters();
  renderTransactionsPage();
});

window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;