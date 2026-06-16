function updateGlobalTransactionsBadge() {
  const badge = document.getElementById("transactionsBadge");
  if (!badge) return;

  const transactions = getStorageData(STORAGE_KEYS.transactions);
  badge.textContent = transactions.length;
}

function setupCurrentDateDefaults() {
  const transactionDate = document.getElementById("transactionDate");
  const billDueDate = document.getElementById("billDueDate");
  const goalDeadline = document.getElementById("goalDeadline");

  const today = new Date().toISOString().split("T")[0];

  if (transactionDate && !transactionDate.value) {
    transactionDate.value = today;
  }

  if (billDueDate && !billDueDate.value) {
    billDueDate.value = today;
  }

  if (goalDeadline && !goalDeadline.value) {
    goalDeadline.value = today;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateGlobalTransactionsBadge();
  setupCurrentDateDefaults();
});