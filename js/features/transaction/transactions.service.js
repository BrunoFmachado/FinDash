const TransactionsService = {
  async list(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    const response = await fetch(`/api/transactions?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar transações.");
    }

    return result.data;
  },

  async create(transaction) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(transaction)
    });

    return response.json();
  },

  async update(transaction) {
    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(transaction)
    });

    return response.json();
  },

  async delete(id) {
    const response = await fetch(`/api/transactions/${id}`, {
      method: "DELETE"
    });

    return response.json();
  },

  exportCsv() {
    window.location.href = "/api/transactions/export";
  }
};