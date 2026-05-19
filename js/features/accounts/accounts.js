const ACCOUNT_TYPE_LABELS = {
  conta_corrente: "Conta corrente",
  conta_digital: "Conta digital",
  cartao_credito: "Cartão de crédito",
  investimento: "Investimento",
  carteira: "Carteira"
};

function getAccounts() {
  return getStorageData(STORAGE_KEYS.accounts);
}

function saveAccounts(accounts) {
  setStorageData(STORAGE_KEYS.accounts, accounts);
}

function getAccountTypeLabel(type) {
  return ACCOUNT_TYPE_LABELS[type] || type || "Não informado";
}

function calculateAccountsTotalBalance(accounts) {
  return accounts.reduce((total, account) => {
    return total + Number(account.initialBalance || 0);
  }, 0);
}

function renderAccountsSummary(accounts) {
  const totalBalance = calculateAccountsTotalBalance(accounts);

  const totalBalanceElement = document.getElementById("accountsTotalBalance");
  const totalCountElement = document.getElementById("accountsTotalCount");

  if (totalBalanceElement) {
    totalBalanceElement.textContent = formatCurrency(totalBalance);
  }

  if (totalCountElement) {
    totalCountElement.textContent = String(accounts.length);
  }
}

function createAccountRow(account) {
  const institution = account.institution || "-";

  return `
    <tr>
      <td>${account.name || "-"}</td>
      <td>${getAccountTypeLabel(account.type)}</td>
      <td>${institution}</td>
      <td>${formatCurrency(account.initialBalance)}</td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary" type="button" onclick="editAccount('${account.id}')">
            Editar
          </button>
          <button class="btn btn-secondary" type="button" onclick="deleteAccount('${account.id}')">
            Excluir
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderAccountsTable(accounts) {
  const tableBody = document.getElementById("accountsTableBody");
  const emptyState = document.getElementById("accountsEmptyState");

  if (!tableBody || !emptyState) return;

  if (accounts.length === 0) {
    tableBody.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  tableBody.innerHTML = accounts.map(createAccountRow).join("");
  emptyState.style.display = "none";
}

function renderAccountsPage() {
  const accounts = getAccounts();
  renderAccountsSummary(accounts);
  renderAccountsTable(accounts);
  updateTransactionsBadge();
}

function resetAccountFormState() {
  const form = document.getElementById("accountForm");
  if (!form) return;

  form.removeAttribute("data-edit-id");
  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.textContent = "Salvar conta";
  }
}

function fillAccountForm(account) {
  const form = document.getElementById("accountForm");
  if (!form) return;

  document.getElementById("accountName").value = account.name || "";
  document.getElementById("accountType").value = account.type || "";
  document.getElementById("accountInstitution").value = account.institution || "";
  document.getElementById("accountInitialBalance").value = Number(account.initialBalance || 0);

  form.setAttribute("data-edit-id", account.id);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Atualizar conta";
  }
}

function handleAccountSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const editId = form.getAttribute("data-edit-id");

  const account = {
    id: editId || generateId("acc"),
    name: document.getElementById("accountName").value.trim(),
    type: document.getElementById("accountType").value,
    institution: document.getElementById("accountInstitution").value.trim(),
    initialBalance: Number(document.getElementById("accountInitialBalance").value || 0)
  };

  const accounts = getAccounts();

  if (editId) {
    const updatedAccounts = accounts.map((item) => {
      return item.id === editId ? account : item;
    });

    saveAccounts(updatedAccounts);
  } else {
    saveAccounts([account, ...accounts]);
  }

  form.reset();
  resetAccountFormState();
  renderAccountsPage();
}

function setupAccountForm() {
  const form = document.getElementById("accountForm");
  if (!form) return;

  form.addEventListener("submit", handleAccountSubmit);
  form.addEventListener("reset", () => {
    setTimeout(() => {
      resetAccountFormState();
    }, 0);
  });
}

function editAccount(accountId) {
  const accounts = getAccounts();
  const account = accounts.find((item) => item.id === accountId);

  if (!account) return;

  fillAccountForm(account);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteAccount(accountId) {
  const accounts = getAccounts();
  const updatedAccounts = accounts.filter((item) => item.id !== accountId);

  saveAccounts(updatedAccounts);
  renderAccountsPage();
}

function updateTransactionsBadge() {
  const badge = document.getElementById("transactionsBadge");
  if (!badge) return;

  const transactions = getStorageData(STORAGE_KEYS.transactions);
  badge.textContent = transactions.length;
}

document.addEventListener("DOMContentLoaded", () => {
  setupAccountForm();
  renderAccountsPage();
});

window.editAccount = editAccount;
window.deleteAccount = deleteAccount;