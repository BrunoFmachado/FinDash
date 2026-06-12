const billState = {
  month: "",
  status: ""
};

function getBills() {
  const bills = getStorageData(STORAGE_KEYS.bills);
  return Array.isArray(bills) ? bills : [];
}

function saveBills(bills) {
  setStorageData(STORAGE_KEYS.bills, bills);
}

function getBillTransactions() {
  const transactions = getStorageData(STORAGE_KEYS.transactions);
  return Array.isArray(transactions) ? transactions : [];
}

function saveBillTransactions(transactions) {
  setStorageData(STORAGE_KEYS.transactions, transactions);
}

function escapeBillHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function getBillLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatBillDate(dateString) {
  if (!dateString) return "Data não informada";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function isBillOverdue(bill) {
  return !bill.paid && bill.dueDate < getBillLocalDate();
}

function getBillStatus(bill) {
  if (bill.paid) return "paid";
  return isBillOverdue(bill) ? "overdue" : "pending";
}

function getBillStatusLabel(bill) {
  const status = getBillStatus(bill);
  if (status === "paid") return "Pago";
  if (status === "overdue") return "Atrasado";
  return "Pendente";
}

function getBillAccounts() {
  const accounts = getStorageData(STORAGE_KEYS.accounts);
  return Array.isArray(accounts) ? accounts : [];
}

function getBillAccountName(accountId) {
  if (!accountId) return "Não vinculada";
  const account = getBillAccounts().find((item) => item.id === accountId);
  return account ? account.name : "Conta removida";
}

function populateBillAccounts() {
  const select = document.getElementById("billAccount");
  select.innerHTML = [
    '<option value="">Não vinculada</option>',
    ...getBillAccounts().map((account) => (
      `<option value="${escapeBillHtml(account.id)}">${escapeBillHtml(account.name)}</option>`
    ))
  ].join("");
}

function syncBillTransaction(bill) {
  const transactions = getBillTransactions();
  const transactionIndex = transactions.findIndex((item) => item.billId === bill.id);

  if (!bill.paid) {
    if (transactionIndex >= 0) {
      transactions.splice(transactionIndex, 1);
      saveBillTransactions(transactions);
    }
    return;
  }

  const existingTransaction = transactionIndex >= 0 ? transactions[transactionIndex] : null;
  const transaction = {
    id: existingTransaction?.id || generateId("trx"),
    billId: bill.id,
    type: "expense",
    title: bill.title,
    amount: Number(bill.amount),
    category: bill.category,
    accountId: bill.accountId || "",
    date: bill.paidDate || bill.dueDate,
    description: bill.description
      ? `Vencimento pago: ${bill.description}`
      : "Despesa gerada por vencimento pago.",
    createdAt: existingTransaction?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (transactionIndex >= 0) transactions[transactionIndex] = transaction;
  else transactions.unshift(transaction);
  saveBillTransactions(transactions);
}

function calculateBillSummary(bills) {
  return bills.reduce((summary, bill) => {
    const amount = Number(bill.amount) || 0;
    const status = getBillStatus(bill);

    if (status === "paid") {
      summary.paidTotal += amount;
      summary.paidCount += 1;
    } else {
      summary.pendingTotal += amount;
      summary.pendingCount += 1;
      if (status === "overdue") {
        summary.overdueTotal += amount;
        summary.overdueCount += 1;
      }
    }
    return summary;
  }, {
    pendingTotal: 0,
    pendingCount: 0,
    overdueTotal: 0,
    overdueCount: 0,
    paidTotal: 0,
    paidCount: 0
  });
}

function renderBillSummary(bills) {
  const summary = calculateBillSummary(bills);
  document.getElementById("billsPendingTotal").textContent = formatCurrency(summary.pendingTotal);
  document.getElementById("billsOverdueTotal").textContent = formatCurrency(summary.overdueTotal);
  document.getElementById("billsPaidTotal").textContent = formatCurrency(summary.paidTotal);
  document.getElementById("billsPendingCount").textContent = `${summary.pendingCount} pendentes`;
  document.getElementById("billsOverdueCount").textContent = `${summary.overdueCount} atrasados`;
  document.getElementById("billsPaidCount").textContent = `${summary.paidCount} pagos`;
}

function getFilteredBills() {
  return [...getBills()]
    .filter((bill) => !billState.month || bill.dueDate.startsWith(billState.month))
    .filter((bill) => !billState.status || getBillStatus(bill) === billState.status)
    .sort((a, b) => {
      if (a.paid !== b.paid) return Number(a.paid) - Number(b.paid);
      return String(a.dueDate).localeCompare(String(b.dueDate));
    });
}

function createBillItem(bill) {
  const status = getBillStatus(bill);
  const paymentDate = bill.paid && bill.paidDate
    ? `<span>Pago em ${formatBillDate(bill.paidDate)}</span>`
    : "";

  return `
    <article class="bill-item bill-item-${status}">
      <div class="bill-item-main">
        <strong class="bill-item-title">${escapeBillHtml(bill.title)}</strong>
        <div class="bill-item-meta">
          <span class="bill-status">${getBillStatusLabel(bill)}</span>
          <span>${escapeBillHtml(bill.category)}</span>
          <span>Vence em ${formatBillDate(bill.dueDate)}</span>
          <span>${escapeBillHtml(getBillAccountName(bill.accountId))}</span>
          ${paymentDate}
        </div>
      </div>
      <div class="bill-item-side">
        <strong class="masked">${formatCurrency(bill.amount)}</strong>
        <div class="bill-actions">
          <button class="bill-action" type="button" data-action="toggle" data-id="${escapeBillHtml(bill.id)}">
            ${bill.paid ? "Voltar a pendente" : "Marcar como pago"}
          </button>
          <button class="bill-action" type="button" data-action="edit" data-id="${escapeBillHtml(bill.id)}">Editar</button>
          <button class="bill-action bill-action-danger" type="button" data-action="delete" data-id="${escapeBillHtml(bill.id)}">Excluir</button>
        </div>
      </div>
    </article>
  `;
}

function renderBills() {
  const allBills = getBills();
  const bills = getFilteredBills();
  const list = document.getElementById("billsList");
  const empty = document.getElementById("billsEmptyState");

  renderBillSummary(allBills);
  document.getElementById("transactionsBadge").textContent = String(getBillTransactions().length);
  document.getElementById("billsResultText").textContent =
    `${bills.length} ${bills.length === 1 ? "vencimento encontrado" : "vencimentos encontrados"}.`;

  if (bills.length === 0) {
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  list.innerHTML = bills.map(createBillItem).join("");
  empty.style.display = "none";
}

function updatePaidDateVisibility() {
  const paid = document.getElementById("billStatus").value === "true";
  const input = document.getElementById("billPaidDate");
  document.getElementById("billPaidDateGroup").classList.toggle("hidden", !paid);
  input.required = paid;
  if (paid && !input.value) input.value = getBillLocalDate();
}

function openBillForm(bill = null) {
  const card = document.getElementById("billFormCard");
  const form = document.getElementById("billForm");
  const submitButton = form.querySelector('button[type="submit"]');

  if (bill) {
    form.dataset.editId = bill.id;
    document.getElementById("billTitle").value = bill.title || "";
    document.getElementById("billAmount").value = Number(bill.amount) || "";
    document.getElementById("billDueDate").value = bill.dueDate || "";
    document.getElementById("billCategory").value = bill.category || "";
    document.getElementById("billAccount").value = bill.accountId || "";
    document.getElementById("billStatus").value = String(Boolean(bill.paid));
    document.getElementById("billPaidDate").value = bill.paidDate || "";
    document.getElementById("billDescription").value = bill.description || "";
    document.getElementById("billFormTitle").textContent = "Editar vencimento";
    submitButton.textContent = "Atualizar vencimento";
  } else {
    form.reset();
    delete form.dataset.editId;
    document.getElementById("billDueDate").value = getBillLocalDate();
    document.getElementById("billFormTitle").textContent = "Cadastrar vencimento";
    submitButton.textContent = "Salvar vencimento";
  }

  updatePaidDateVisibility();
  card.classList.add("is-open");
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeBillForm() {
  const form = document.getElementById("billForm");
  form.reset();
  delete form.dataset.editId;
  document.getElementById("billFormCard").classList.remove("is-open");
}

function handleBillSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const editId = form.dataset.editId;
  const amount = Number(document.getElementById("billAmount").value);
  if (!Number.isFinite(amount) || amount <= 0) return;

  const oldBill = editId ? getBills().find((item) => item.id === editId) : null;
  const paid = document.getElementById("billStatus").value === "true";
  const bill = {
    id: editId || generateId("bill"),
    title: document.getElementById("billTitle").value.trim(),
    amount,
    dueDate: document.getElementById("billDueDate").value,
    category: document.getElementById("billCategory").value.trim(),
    accountId: document.getElementById("billAccount").value,
    paid,
    paidDate: paid ? document.getElementById("billPaidDate").value : "",
    description: document.getElementById("billDescription").value.trim(),
    createdAt: oldBill?.createdAt || Date.now(),
    updatedAt: Date.now()
  };
  const bills = getBills();
  saveBills(editId
    ? bills.map((item) => item.id === editId ? bill : item)
    : [bill, ...bills]);
  syncBillTransaction(bill);
  closeBillForm();
  renderBills();
}

function toggleBillStatus(id) {
  const bill = getBills().find((item) => item.id === id);
  if (!bill) return;
  const updatedBill = {
    ...bill,
    paid: !bill.paid,
    paidDate: bill.paid ? "" : getBillLocalDate(),
    updatedAt: Date.now()
  };
  saveBills(getBills().map((item) => item.id === id ? updatedBill : item));
  syncBillTransaction(updatedBill);
  renderBills();
}

function deleteBill(id) {
  const bill = getBills().find((item) => item.id === id);
  if (!bill || !window.confirm(`Excluir o vencimento "${bill.title}"?`)) return;
  saveBills(getBills().filter((item) => item.id !== id));
  saveBillTransactions(getBillTransactions().filter((item) => item.billId !== id));
  renderBills();
}

function setupBillFilters() {
  const month = document.getElementById("billFilterMonth");
  const status = document.getElementById("billFilterStatus");
  month.addEventListener("change", () => {
    billState.month = month.value;
    renderBills();
  });
  status.addEventListener("change", () => {
    billState.status = status.value;
    renderBills();
  });
  document.getElementById("clearBillFilters").addEventListener("click", () => {
    billState.month = "";
    billState.status = "";
    month.value = "";
    status.value = "";
    renderBills();
  });
}

function setupBillBalanceToggle() {
  const button = document.getElementById("toggleBalance");
  button.addEventListener("click", () => {
    const hidden = document.getElementById("appBody").classList.toggle("hide-balance");
    button.textContent = hidden ? "○" : "◉";
    button.title = hidden ? "Mostrar valores" : "Ocultar valores";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateBillAccounts();
  document.getElementById("billForm").addEventListener("submit", handleBillSubmit);
  document.getElementById("billStatus").addEventListener("change", updatePaidDateVisibility);
  document.getElementById("openBillForm").addEventListener("click", () => openBillForm());
  document.getElementById("fab").addEventListener("click", () => openBillForm());
  document.getElementById("closeBillForm").addEventListener("click", closeBillForm);
  document.getElementById("billsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const bill = getBills().find((item) => item.id === button.dataset.id);
    if (button.dataset.action === "toggle") toggleBillStatus(button.dataset.id);
    if (button.dataset.action === "edit" && bill) openBillForm(bill);
    if (button.dataset.action === "delete") deleteBill(button.dataset.id);
  });
  setupBillFilters();
  setupBillBalanceToggle();
  document.getElementById("billDueDate").value = getBillLocalDate();
  updatePaidDateVisibility();
  renderBills();
});
