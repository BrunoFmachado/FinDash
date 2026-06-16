const TRANSACTION_STATUS_LABELS = {
  planned: "Previsto",
  realized: "Realizado"
};

const transactionState = {
  dateStart: "",
  dateEnd: "",
  type: "",
  status: "",
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

function getTransactionStatus(transaction) {
  return transaction.status === "planned" ? "planned" : "realized";
}

function getTransactionStatusLabel(transaction) {
  return TRANSACTION_STATUS_LABELS[getTransactionStatus(transaction)];
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
    const transactionDate = String(transaction.date || "");
    const matchesStart = !transactionState.dateStart || transactionDate >= transactionState.dateStart;
    const matchesEnd = !transactionState.dateEnd || transactionDate <= transactionState.dateEnd;
    const matchesType = !transactionState.type || transaction.type === transactionState.type;
    const matchesStatus = !transactionState.status || getTransactionStatus(transaction) === transactionState.status;
    const searchableText = `${transaction.title || ""} ${transaction.category || ""} ${transaction.description || ""}`
      .toLocaleLowerCase("pt-BR");
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

    return matchesStart && matchesEnd && matchesType && matchesStatus && matchesSearch;
  });
}

function calculateSummary(transactions) {
  return transactions.reduce((summary, transaction) => {
    const amount = Number(transaction.amount) || 0;
    const status = getTransactionStatus(transaction);
    const isIncome = transaction.type === "income";
    const isExpense = transaction.type === "expense";

    if (isIncome && status === "realized") {
      summary.realizedIncome += amount;
      summary.realizedIncomeCount += 1;
    }

    if (isExpense && status === "realized") {
      summary.realizedExpense += amount;
      summary.realizedExpenseCount += 1;
    }

    if (isIncome && status === "planned") {
      summary.plannedIncome += amount;
      summary.plannedIncomeCount += 1;
    }

    if (isExpense && status === "planned") {
      summary.plannedExpense += amount;
      summary.plannedExpenseCount += 1;
    }

    summary.realizedBalance = summary.realizedIncome - summary.realizedExpense;
    summary.plannedBalance = summary.plannedIncome - summary.plannedExpense;
    summary.planningDifference = summary.realizedBalance - summary.plannedBalance;

    return summary;
  }, {
    realizedIncome: 0,
    realizedExpense: 0,
    realizedBalance: 0,
    realizedIncomeCount: 0,
    realizedExpenseCount: 0,
    plannedIncome: 0,
    plannedExpense: 0,
    plannedBalance: 0,
    plannedIncomeCount: 0,
    plannedExpenseCount: 0,
    planningDifference: 0
  });
}

function renderSummary(transactions) {
  const summary = calculateSummary(transactions);
  const differenceText = summary.planningDifference >= 0
    ? "Realizado acima ou igual ao previsto"
    : "Realizado abaixo do previsto";

  document.getElementById("transactionsIncomeTotal").textContent = formatCurrency(summary.realizedIncome);
  document.getElementById("transactionsExpenseTotal").textContent = formatCurrency(summary.realizedExpense);
  document.getElementById("transactionsBalanceTotal").textContent = formatCurrency(summary.realizedBalance);

  document.getElementById("incomeCount").textContent =
    `${summary.realizedIncomeCount} ${summary.realizedIncomeCount === 1 ? "receita realizada" : "receitas realizadas"}`;

  document.getElementById("expenseCount").textContent =
    `${summary.realizedExpenseCount} ${summary.realizedExpenseCount === 1 ? "saída realizada" : "saídas realizadas"}`;

  document.getElementById("plannedIncomeTotal").textContent = formatCurrency(summary.plannedIncome);
  document.getElementById("plannedExpenseTotal").textContent = formatCurrency(summary.plannedExpense);
  document.getElementById("plannedBalanceTotal").textContent = formatCurrency(summary.plannedBalance);
  document.getElementById("planningDifferenceTotal").textContent = formatCurrency(summary.planningDifference);

  document.getElementById("plannedIncomeCount").textContent =
    `${summary.plannedIncomeCount} ${summary.plannedIncomeCount === 1 ? "receita prevista" : "receitas previstas"}`;

  document.getElementById("plannedExpenseCount").textContent =
    `${summary.plannedExpenseCount} ${summary.plannedExpenseCount === 1 ? "saída prevista" : "saídas previstas"}`;

  document.getElementById("planningDifferenceText").textContent = differenceText;
}

function createTransactionItem(transaction) {
  const isIncome = transaction.type === "income";
  const amountPrefix = isIncome ? "+" : "-";
  const typeClass = isIncome ? "income" : "expense";
  const icon = isIncome ? "↑" : "↓";
  const status = getTransactionStatus(transaction);

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
          <span class="transaction-tag">${escapeHtml(TRANSACTION_STATUS_LABELS[status])}</span>
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

  resultText.textContent =
    `${transactions.length} ${transactions.length === 1 ? "movimentação encontrada" : "movimentações encontradas"}.`;

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

function updateTransactionFormCopy(defaultType = "") {
  const title = document.getElementById("transactionFormTitle");
  const submitButton = document.querySelector('#transactionForm button[type="submit"]');

  if (defaultType === "income") {
    title.textContent = "Cadastrar receita";
    submitButton.textContent = "Salvar receita";
    return;
  }

  if (defaultType === "expense") {
    title.textContent = "Registrar saída financeira";
    submitButton.textContent = "Salvar saída";
    return;
  }

  title.textContent = "Registrar transação";
  submitButton.textContent = "Salvar transação";
}

function openTransactionForm(transaction = null, defaultType = "") {
  const card = document.getElementById("transactionFormCard");
  const form = document.getElementById("transactionForm");

  if (transaction) {
    form.dataset.editId = transaction.id;

    document.getElementById("transactionType").value = transaction.type || "";
    document.getElementById("transactionStatus").value = getTransactionStatus(transaction);
    document.getElementById("transactionAmount").value = Number(transaction.amount) || "";
    document.getElementById("transactionTitle").value = transaction.title || "";
    document.getElementById("transactionCategory").value = transaction.category || "";
    document.getElementById("transactionDate").value = transaction.date || "";
    document.getElementById("transactionAccount").value = transaction.accountId || "";
    document.getElementById("transactionDescription").value = transaction.description || "";

    document.getElementById("transactionFormTitle").textContent = "Editar transação";
    form.querySelector('button[type="submit"]').textContent = "Atualizar transação";
  } else {
    form.reset();
    delete form.dataset.editId;

    document.getElementById("transactionType").value = defaultType;
    document.getElementById("transactionStatus").value = "realized";
    document.getElementById("transactionDate").value = getLocalDateValue();

    updateTransactionFormCopy(defaultType);
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
    status: document.getElementById("transactionStatus").value,
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

  if (transaction) {
    openTransactionForm(transaction);
  }
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
    window.alert("Não há informações financeiras para exportar com os filtros atuais.");
    return;
  }

  const rows = [
    ["Tipo", "Situação", "Descrição", "Categoria", "Conta", "Data", "Valor", "Observação"],
    ...transactions.map((transaction) => [
      transaction.type === "income" ? "Receita" : "Saída financeira",
      getTransactionStatusLabel(transaction),
      transaction.title,
      transaction.category,
      getAccountName(transaction.accountId),
      transaction.date,
      Number(transaction.amount).toFixed(2).replace(".", ","),
      transaction.description || ""
    ])
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `findash-informacoes-financeiras-${getLocalDateValue()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function setupFilters() {
  const dateStartInput = document.getElementById("filterDateStart");
  const dateEndInput = document.getElementById("filterDateEnd");
  const typeInput = document.getElementById("filterType");
  const statusInput = document.getElementById("filterStatus");
  const searchInput = document.getElementById("filterSearch");

  dateStartInput.addEventListener("change", () => {
    transactionState.dateStart = dateStartInput.value;

    if (dateEndInput.value && dateStartInput.value > dateEndInput.value) {
      dateEndInput.value = dateStartInput.value;
      transactionState.dateEnd = dateStartInput.value;
    }

    renderTransactions();
  });

  dateEndInput.addEventListener("change", () => {
    transactionState.dateEnd = dateEndInput.value;

    if (dateStartInput.value && dateEndInput.value < dateStartInput.value) {
      dateStartInput.value = dateEndInput.value;
      transactionState.dateStart = dateEndInput.value;
    }

    renderTransactions();
  });

  typeInput.addEventListener("change", () => {
    transactionState.type = typeInput.value;
    renderTransactions();
  });

  statusInput.addEventListener("change", () => {
    transactionState.status = statusInput.value;
    renderTransactions();
  });

  searchInput.addEventListener("input", () => {
    transactionState.search = searchInput.value;
    renderTransactions();
  });

  document.getElementById("transactionFilterForm").addEventListener("submit", (event) => {
    event.preventDefault();
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    transactionState.dateStart = "";
    transactionState.dateEnd = "";
    transactionState.type = "";
    transactionState.status = "";
    transactionState.search = "";

    dateStartInput.value = "";
    dateEndInput.value = "";
    typeInput.value = "";
    statusInput.value = "";
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
  document.getElementById("openIncomeForm").addEventListener("click", () => openTransactionForm(null, "income"));
  document.getElementById("openExpenseForm").addEventListener("click", () => openTransactionForm(null, "expense"));
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