function getBills() {
  return getStorageData(STORAGE_KEYS.bills);
}

function saveBills(bills) {
  setStorageData(STORAGE_KEYS.bills, bills);
}

function calculateBillsSummary(bills) {
  const pendingBills = bills.filter((item) => !item.paid);

  return {
    pendingTotal: pendingBills.reduce((total, item) => total + Number(item.amount || 0), 0),
    pendingCount: pendingBills.length
  };
}

function renderBillsSummary(bills) {
  const summary = calculateBillsSummary(bills);

  const pendingTotalElement = document.getElementById("billsPendingTotal");
  const pendingCountElement = document.getElementById("billsPendingCount");

  if (pendingTotalElement) {
    pendingTotalElement.textContent = formatCurrency(summary.pendingTotal);
  }

  if (pendingCountElement) {
    pendingCountElement.textContent = String(summary.pendingCount);
  }
}

function createBillRow(bill) {
  return `
    <tr>
      <td>${bill.title || "-"}</td>
      <td>${formatCurrency(bill.amount)}</td>
      <td>${formatDate(bill.dueDate)}</td>
      <td>${bill.paid ? "Pago" : "Pendente"}</td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary" type="button" onclick="toggleBillStatus('${bill.id}')">
            ${bill.paid ? "Marcar pendente" : "Marcar pago"}
          </button>
          <button class="btn btn-secondary" type="button" onclick="editBill('${bill.id}')">
            Editar
          </button>
          <button class="btn btn-secondary" type="button" onclick="deleteBill('${bill.id}')">
            Excluir
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderBillsTable(bills) {
  const tableBody = document.getElementById("billsTableBody");
  const emptyState = document.getElementById("billsEmptyState");

  if (!tableBody || !emptyState) return;

  if (bills.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  tableBody.innerHTML = bills.map(createBillRow).join("");
  emptyState.style.display = "none";
}

function renderBillsPage() {
  const bills = getBills();
  renderBillsSummary(bills);
  renderBillsTable(bills);
  updateTransactionsBadge();
}

function resetBillFormState() {
  const form = document.getElementById("billForm");
  if (!form) return;

  form.removeAttribute("data-edit-id");

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Salvar vencimento";
  }
}

function fillBillForm(bill) {
  const form = document.getElementById("billForm");
  if (!form) return;

  document.getElementById("billTitle").value = bill.title || "";
  document.getElementById("billAmount").value = Number(bill.amount || 0);
  document.getElementById("billDueDate").value = bill.dueDate || "";
  document.getElementById("billStatus").value = String(Boolean(bill.paid));

  form.setAttribute("data-edit-id", bill.id);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Atualizar vencimento";
  }
}

function handleBillSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const editId = form.getAttribute("data-edit-id");

  const bill = {
    id: editId || generateId("bill"),
    title: document.getElementById("billTitle").value.trim(),
    amount: Number(document.getElementById("billAmount").value || 0),
    dueDate: document.getElementById("billDueDate").value,
    paid: document.getElementById("billStatus").value === "true"
  };

  const bills = getBills();

  if (editId) {
    const updatedBills = bills.map((item) => {
      return item.id === editId ? bill : item;
    });

    saveBills(updatedBills);
  } else {
    saveBills([bill, ...bills]);
  }

  form.reset();
  resetBillFormState();
  renderBillsPage();
}

function setupBillForm() {
  const form = document.getElementById("billForm");
  if (!form) return;

  form.addEventListener("submit", handleBillSubmit);
  form.addEventListener("reset", () => {
    setTimeout(() => {
      resetBillFormState();
    }, 0);
  });
}

function toggleBillStatus(billId) {
  const bills = getBills().map((item) => {
    if (item.id === billId) {
      return {
        ...item,
        paid: !item.paid
      };
    }

    return item;
  });

  saveBills(bills);
  renderBillsPage();
}

function editBill(billId) {
  const bills = getBills();
  const bill = bills.find((item) => item.id === billId);

  if (!bill) return;

  fillBillForm(bill);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteBill(billId) {
  const bills = getBills();
  const updatedBills = bills.filter((item) => item.id !== billId);

  saveBills(updatedBills);
  renderBillsPage();
}

function updateTransactionsBadge() {
  const badge = document.getElementById("transactionsBadge");
  if (!badge) return;

  const transactions = getStorageData(STORAGE_KEYS.transactions);
  badge.textContent = transactions.length;
}

document.addEventListener("DOMContentLoaded", () => {
  setupBillForm();
  renderBillsPage();
});

window.toggleBillStatus = toggleBillStatus;
window.editBill = editBill;
window.deleteBill = deleteBill;