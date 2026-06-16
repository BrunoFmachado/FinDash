(function () {
  const API = 'http://localhost:3000';
  const MONEY_VISIBILITY_KEY = 'findash_hide_values';

  function getToken() {
    return localStorage.getItem('token');
  }

  function getUsuario() {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
      return null;
    }
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    };
  }

  function ensureAuth() {
    if (!getToken() || !getUsuario()) {
      window.location.href = '../index.html';
      return false;
    }

    return true;
  }

  async function fetchJson(path, options = {}) {
    const resposta = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {})
      }
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      const erro = new Error(dados.mensagem || 'Erro ao processar solicitaÃ§Ã£o.');
      erro.status = resposta.status;
      throw erro;
    }

    return dados;
  }

  function formatMoney(value) {
    if (typeof window.formatCurrency === 'function') return window.formatCurrency(value);
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDateBr(value) {
    if (typeof window.formatDate === 'function') return window.formatDate(value);
    if (!value) return '';
    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
  }

  function setProfile() {
    const usuario = getUsuario();
    if (!usuario) return;

    const partes = String(usuario.nome || '').trim().split(' ').filter(Boolean);
    const primeiroNome = partes[0] || 'UsuÃ¡rio';
    const iniciais = partes.slice(0, 2).map((parte) => parte[0].toUpperCase()).join('');

    document.querySelectorAll('#profileName').forEach((el) => { el.textContent = primeiroNome; });
    document.querySelectorAll('#profileAvatar').forEach((el) => { el.textContent = iniciais || '--'; });
  }

 function applyMoneyVisibility() {
  const eyeOpen = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;

  const eyeClosed = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-5.94"/>
      <path d="M1 1l22 22"/>
      <path d="M9.53 9.53A3 3 0 0 0 14.47 14.47"/>
    </svg>`;

  const hidden = localStorage.getItem(MONEY_VISIBILITY_KEY) === 'true';

  const body = document.getElementById('appBody') || document.body;
  body.classList.toggle('hide-balance', hidden);

  const eye = document.getElementById('eyeContainer');

  if (eye) {
    eye.innerHTML = hidden ? eyeClosed : eyeOpen;
  }
}
  function setupMoneyToggle() {
    applyMoneyVisibility();

    document.querySelectorAll('#toggleBalance').forEach((button) => {
      if (button.dataset.boundVisibility === 'true') return;
      button.dataset.boundVisibility = 'true';
      button.addEventListener('click', () => {
        const hidden = localStorage.getItem(MONEY_VISIBILITY_KEY) === 'true';
        localStorage.setItem(MONEY_VISIBILITY_KEY, String(!hidden));
        applyMoneyVisibility();
      });
    });
  }

  async function updateTransactionsBadge() {
    const badges = document.querySelectorAll('#transactionsBadge, #txBadge');
    if (!badges.length || !getToken()) return;

    try {
      const dados = await fetchJson('/api/transacoes');
      badges.forEach((badge) => { badge.textContent = String(dados.resumo?.total || dados.transacoes?.length || 0); });
    } catch {
      badges.forEach((badge) => { badge.textContent = '0'; });
    }
  }

  function setupDefaultDates() {
    const today = new Date().toISOString().slice(0, 10);
    ['transactionDate', 'billDueDate', 'goalDeadline'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = today;
    });
  }

  function downloadCsv(path = '/api/transacoes/export/csv') {
    const token = getToken();
    if (!token) return;

    const url = `${API}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    fetch(url, { headers: authHeaders() })
      .then((res) => res.blob())
      .then((blob) => {
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = 'findash-financeiro.csv';
        link.click();
        URL.revokeObjectURL(href);
      })
      .catch(() => alert('Erro ao exportar dados.'));
  }

  window.FinDash = {
    API,
    getToken,
    getUsuario,
    authHeaders,
    ensureAuth,
    fetchJson,
    formatMoney,
    formatDateBr,
    setProfile,
    setupMoneyToggle,
    applyMoneyVisibility,
    updateTransactionsBadge,
    setupDefaultDates,
    downloadCsv
  };

  document.addEventListener('DOMContentLoaded', () => {
    setProfile();
    setupMoneyToggle();
    setupDefaultDates();
  });
})();
