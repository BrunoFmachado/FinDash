function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function getCurrentMonthYear() {
  const now = new Date();

  return {
    month: now.getMonth(),
    year: now.getFullYear()
  };
}

function isSameMonth(dateString, month, year) {
  const date = new Date(dateString);
  return date.getMonth() === month && date.getFullYear() === year;
}
