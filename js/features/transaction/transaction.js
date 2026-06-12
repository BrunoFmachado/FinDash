const transactionState = {
  month: "",
  type: "",
  search: ""
};

function getTransactions() {
  const transactions = getStorageData(STORAGE_KEYS.transactions);
  return Array.isArray(transactions) ? transactions : [];
}

function saveTransactions(transactions) {
  setStorageData(STORAGE_KEYS.transactions, transactions);
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatTransactionDate(dateString) {
  if (!dateString) return "Data não informada";
  return parseLocalDate(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function getAccounts() {
  const accounts = getStorageData(STORAGE_KEYS.accounts);
  return Array.isArray(accounts) ? accounts : [];
}

function getAccountName(accountId) {
  if (!accountId) return "Não vinculada";
  const account = getAccounts().find((item) => item.id === accountId);
  return account ? account.name : "Conta removida";
}

function populateTransactionAccounts() {
  const select = document.getElementById("transactionAccount");
  const accounts = getAccounts();

  select.innerHTML = [
    '<option value="">Não vinculada</option>',
    ...accounts.map((account) => (
      `<option value="${escapeHtml(account.id)}">${escapeHtml(account.name)}</option>`
    ))
  ].join("");
}

function sortTransactions(transactions) {
  return [...transactions].sort((a, b) => {
    const dateComparison = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateComparison !== 0) return dateComparison;
    return Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });
}

function getFilteredTransactions() {
  const normalizedSearch = transactionState.search.trim().toLocaleLowerCase("pt-BR");

  return sortTransactions(getTransactions()).filter((transaction) => {
    const matchesMonth = !transactionState.month
      || String(transaction.date || "").startsWith(transactionState.month);
    const matchesType = !transactionState.type || transaction.type === transactionState.type;
    const searchableText = `${transaction.title || ""} ${transaction.category || ""} ${transaction.description || ""}`
      .toLocaleLowerCase("pt-BR");
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

    return matchesMonth && matchesType && matchesSearch;
  });
}

function calculateSummary(transactions) {
  return transactions.reduce((summary, transaction) => {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      summary.income += amount;
      summary.incomeCount += 1;
    } else if (transaction.type === "expense") {
      summary.expense += amount;
      summary.expenseCount += 1;
    }

    summary.balance = summary.income - summary.expense;
    return summary;
  }, {
    income: 0,
    expense: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0
  });
}

function renderSummary(transactions) {
  const summary = calculateSummary(transactions);
  document.getElementById("transactionsIncomeTotal").textContent = formatCurrency(summary.income);
  document.getElementById("transactionsExpenseTotal").textContent = formatCurrency(summary.expense);
  document.getElementById("transactionsBalanceTotal").textContent = formatCurrency(summary.balance);
  document.getElementById("incomeCount").textContent = `${summary.incomeCount} ${summary.incomeCount === 1 ? "receita" : "receitas"}`;
  document.getElementById("expenseCount").textContent = `${summary.expenseCount} ${summary.expenseCount === 1 ? "despesa" : "despesas"}`;
}

function createTransactionItem(transaction) {
  const isIncome = transaction.type === "income";
  const amountPrefix = isIncome ? "+" : "-";
  const typeClass = isIncome ? "income" : "expense";
  const icon = isIncome ? "↑" : "↓";
  const description = transaction.description
    ? `<span title="${escapeHtml(transaction.description)}">${escapeHtml(transaction.description)}</span>`
    : "";

  return `
    <article class="transaction-item transaction-item-${typeClass}">
      <div class="transaction-icon" aria-hidden="true">${icon}</div>
      <div>
        <strong class="transaction-item-title">${escapeHtml(transaction.title)}</strong>
        <div class="transaction-item-meta">
          <span class="transaction-tag">${escapeHtml(transaction.category)}</span>
          <span>${escapeHtml(getAccountName(transaction.accountId))}</span>
          ${description}
        </div>
      </div>
      <div class="transaction-item-value">
        <strong class="masked">${amountPrefix} ${formatCurrency(transaction.amount)}</strong>
        <div class="transaction-actions">
          <button class="transaction-action" type="button" data-action="edit" data-id="${escapeHtml(transaction.id)}">Editar</button>
          <button class="transaction-action transaction-action-danger" type="button" data-action="delete" data-id="${escapeHtml(transaction.id)}">Excluir</button>
        </div>
      </div>
    </article>
  `;
}

function groupTransactionsByDate(transactions) {
  return transactions.reduce((groups, transaction) => {
    const date = transaction.date || "";
    if (!groups[date]) groups[date] = [];
    groups[date].push(transaction);
    return groups;
  }, {});
}

function renderTransactions() {
  const transactions = getFilteredTransactions();
  const list = document.getElementById("transactionsList");
  const emptyState = document.getElementById("transactionsEmptyState");
  const resultText = document.getElementById("historyResultText");

  renderSummary(transactions);
  document.getElementById("transactionsBadge").textContent = String(getTransactions().length);
  resultText.textContent = `${transactions.length} ${transactions.length === 1 ? "movimentação encontrada" : "movimentações encontradas"}.`;

  if (transactions.length === 0) {
    list.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  const groups = groupTransactionsByDate(transactions);
  list.innerHTML = Object.entries(groups).map(([date, items]) => `
    <section class="transaction-date-group">
      <div class="transaction-date-label">${escapeHtml(formatTransactionDate(date))}</div>
      ${items.map(createTransactionItem).join("")}
    </section>
  `).join("");
  emptyState.style.display = "none";
}

function openTransactionForm(transaction = null) {
  const card = document.getElementById("transactionFormCard");
  const form = document.getElementById("transactionForm");
  const title = document.getElementById("transactionFormTitle");
  const submitButton = form.querySelector('button[type="submit"]');

  if (transaction) {
    form.dataset.editId = transaction.id;
    document.getElementById("transactionType").value = transaction.type || "";
    document.getElementById("transactionAmount").value = Number(transaction.amount) || "";
    document.getElementById("transactionTitle").value = transaction.title || "";
    document.getElementById("transactionCategory").value = transaction.category || "";
    document.getElementById("transactionDate").value = transaction.date || "";
    document.getElementById("transactionAccount").value = transaction.accountId || "";
    document.getElementById("transactionDescription").value = transaction.description || "";
    title.textContent = "Editar transação";
    submitButton.textContent = "Atualizar transação";
  } else {
    form.reset();
    delete form.dataset.editId;
    document.getElementById("transactionDate").value = getLocalDateValue();
    title.textContent = "Registrar transação";
    submitButton.textContent = "Salvar transação";
  }

  card.classList.add("is-open");
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeTransactionForm() {
  const form = document.getElementById("transactionForm");
  form.reset();
  delete form.dataset.editId;
  document.getElementById("transactionFormCard").classList.remove("is-open");
}

function handleTransactionSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const editId = form.dataset.editId;
  const amount = Number(document.getElementById("transactionAmount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    document.getElementById("transactionAmount").focus();
    return;
  }

  const existing = editId
    ? getTransactions().find((transaction) => transaction.id === editId)
    : null;
  const transaction = {
    id: editId || generateId("trx"),
    type: document.getElementById("transactionType").value,
    amount,
    title: document.getElementById("transactionTitle").value.trim(),
    category: document.getElementById("transactionCategory").value.trim(),
    date: document.getElementById("transactionDate").value,
    accountId: document.getElementById("transactionAccount").value,
    description: document.getElementById("transactionDescription").value.trim(),
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  const transactions = getTransactions();
  const updatedTransactions = editId
    ? transactions.map((item) => item.id === editId ? transaction : item)
    : [transaction, ...transactions];

  saveTransactions(updatedTransactions);
  closeTransactionForm();
  renderTransactions();
}

function editTransaction(id) {
  const transaction = getTransactions().find((item) => item.id === id);
  if (transaction) openTransactionForm(transaction);
}

function deleteTransaction(id) {
  const transaction = getTransactions().find((item) => item.id === id);
  if (!transaction) return;

  const confirmed = window.confirm(`Excluir a transação "${transaction.title}"?`);
  if (!confirmed) return;

  saveTransactions(getTransactions().filter((item) => item.id !== id));
  renderTransactions();
}

function exportTransactionsCsv() {
  const transactions = getFilteredTransactions();
  if (transactions.length === 0) {
    window.alert("Não há transações para exportar com os filtros atuais.");
    return;
  }

  const rows = [
    ["Tipo", "Descrição", "Categoria", "Conta", "Data", "Valor", "Observação"],
    ...transactions.map((transaction) => [
      transaction.type === "income" ? "Receita" : "Despesa",
      transaction.title,
      transaction.category,
      getAccountName(transaction.accountId),
      transaction.date,
      Number(transaction.amount).toFixed(2).replace(".", ","),
      transaction.description || ""
    ])
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `findash-transacoes-${getLocalDateValue()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function setupFilters() {
  const monthInput = document.getElementById("filterMonth");
  const typeInput = document.getElementById("filterType");
  const searchInput = document.getElementById("filterSearch");

  monthInput.addEventListener("change", () => {
    transactionState.month = monthInput.value;
    renderTransactions();
  });
  typeInput.addEventListener("change", () => {
    transactionState.type = typeInput.value;
    renderTransactions();
  });
  searchInput.addEventListener("input", () => {
    transactionState.search = searchInput.value;
    renderTransactions();
  });
  document.getElementById("transactionFilterForm").addEventListener("submit", (event) => event.preventDefault());
  document.getElementById("clearFilters").addEventListener("click", () => {
    transactionState.month = "";
    transactionState.type = "";
    transactionState.search = "";
    monthInput.value = "";
    typeInput.value = "";
    searchInput.value = "";
    renderTransactions();
  });
}

function setupBalanceToggle() {
  const button = document.getElementById("toggleBalance");
  button.addEventListener("click", () => {
    const hidden = document.getElementById("appBody").classList.toggle("hide-balance");
    button.textContent = hidden ? "○" : "◉";
    button.title = hidden ? "Mostrar valores" : "Ocultar valores";
    button.setAttribute("aria-label", button.title);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateTransactionAccounts();
  document.getElementById("transactionForm").addEventListener("submit", handleTransactionSubmit);
  document.getElementById("openTransactionForm").addEventListener("click", () => openTransactionForm());
  document.getElementById("fab").addEventListener("click", () => openTransactionForm());
  document.getElementById("closeTransactionForm").addEventListener("click", closeTransactionForm);
  document.getElementById("exportTransactions").addEventListener("click", exportTransactionsCsv);
  document.getElementById("transactionsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "edit") editTransaction(button.dataset.id);
    if (button.dataset.action === "delete") deleteTransaction(button.dataset.id);
  });

  setupFilters();
  setupBalanceToggle();
  document.getElementById("transactionDate").value = getLocalDateValue();
  renderTransactions();
});
