const STORAGE_KEYS = {
  accounts: "findash_accounts",
  transactions: "findash_transactions",
  goals: "findash_goals",
  bills: "findash_bills"
};

function getStorageData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Erro ao ler localStorage [${key}]`, error);
    return [];
  }
}

function setStorageData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar localStorage [${key}]`, error);
  }
}

function clearStorageData(key) {
  localStorage.removeItem(key);
}
