const API = 'http://localhost:3000';

const ACCOUNT_TYPE_LABELS = {
  conta_corrente: 'Conta corrente',
  conta_digital:  'Conta digital',
  cartao_credito: 'Cartão de crédito',
  investimento:   'Investimento',
  carteira:       'Carteira'
};

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

function getAccountTypeLabel(tipo) {
  return ACCOUNT_TYPE_LABELS[tipo] || tipo || 'Não informado';
}

// ── Render ──────────────────────────────────────────────

function renderAccountsSummary(contas) {
  const total = contas.reduce((acc, c) => acc + Number(c.saldo || 0), 0);

  const elTotal = document.getElementById('accountsTotalBalance');
  const elCount = document.getElementById('accountsTotalCount');

  if (elTotal) elTotal.textContent = formatCurrency(total);
  if (elCount) elCount.textContent = String(contas.length);
}

function createAccountRow(conta) {
  return `
    <tr>
      <td>${conta.nome || '-'}</td>
      <td>${getAccountTypeLabel(conta.tipo)}</td>
      <td>${conta.instituicao || '-'}</td>
      <td>${formatCurrency(conta.saldo)}</td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary" type="button" onclick="editAccount(${conta.id})">Editar</button>
          <button class="btn btn-secondary" type="button" onclick="deleteAccount(${conta.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `;
}

function renderAccountsTable(contas) {
  const tableBody  = document.getElementById('accountsTableBody');
  const emptyState = document.getElementById('accountsEmptyState');

  if (!tableBody || !emptyState) return;

  if (contas.length === 0) {
    tableBody.innerHTML      = '';
    emptyState.style.display = 'block';
    return;
  }

  tableBody.innerHTML      = contas.map(createAccountRow).join('');
  emptyState.style.display = 'none';
}

function resetAccountFormState() {
  const form = document.getElementById('accountForm');
  if (!form) return;

  form.removeAttribute('data-edit-id');

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Salvar conta';
}

function fillAccountForm(conta) {
  const form = document.getElementById('accountForm');
  if (!form) return;

  document.getElementById('accountName').value           = conta.nome  || '';
  document.getElementById('accountType').value           = conta.tipo  || '';
  document.getElementById('accountInstitution').value    = conta.instituicao || '';
  document.getElementById('accountInitialBalance').value = Number(conta.saldo || 0);

  form.setAttribute('data-edit-id', conta.id);

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Atualizar conta';
}

// ── API calls ───────────────────────────────────────────

async function carregarContas() {
  try {
    const resposta = await fetch(`${API}/api/contas`, {
      method:  'GET',
      headers: authHeaders()
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      renderAccountsTable(dados.contas);
      renderAccountsSummary(dados.contas);
    } else {
      console.error('Erro ao listar contas:', dados.mensagem);
    }
  } catch (err) {
    console.error('Erro de conexão:', err);
  }
}

async function handleAccountSubmit(event) {
  event.preventDefault();

  const form   = event.currentTarget;
  const editId = form.getAttribute('data-edit-id');

  const nome  = document.getElementById('accountName').value.trim();
  const tipo  = document.getElementById('accountType').value;
  const saldo = Number(document.getElementById('accountInitialBalance').value || 0);
  const instituicao = document.getElementById('accountInstitution').value.trim();

  try {
    const url    = editId ? `${API}/api/contas/${editId}` : `${API}/api/contas`;
    const method = editId ? 'PUT' : 'POST';

    const resposta = await fetch(url, {
      method,
      headers: authHeaders(),
      body:    JSON.stringify({ nome, tipo, saldo, instituicao })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      form.reset();
      resetAccountFormState();
      await carregarContas();
    } else {
      alert(dados.mensagem || 'Erro ao salvar conta.');
    }
  } catch (err) {
    alert('Erro de conexão com o servidor.');
    console.error(err);
  }
}

async function editAccount(id) {
  try {
    const resposta = await fetch(`${API}/api/contas/${id}`, {
      method:  'GET',
      headers: authHeaders()
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      fillAccountForm(dados.conta);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert(dados.mensagem || 'Erro ao buscar conta.');
    }
  } catch (err) {
    alert('Erro de conexão com o servidor.');
  }
}

async function deleteAccount(id) {
  if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

  try {
    const resposta = await fetch(`${API}/api/contas/${id}`, {
      method:  'DELETE',
      headers: authHeaders()
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      await carregarContas();
    } else {
      alert(dados.mensagem || 'Erro ao excluir conta.');
    }
  } catch (err) {
    alert('Erro de conexão com o servidor.');
  }
}

// ── Setup ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../index.html';
    return;
  }

  const form = document.getElementById('accountForm');
  if (form) {
    form.addEventListener('submit', handleAccountSubmit);
    form.addEventListener('reset', () => setTimeout(resetAccountFormState, 0));
  }

  carregarContas();
});

window.editAccount   = editAccount;
window.deleteAccount = deleteAccount;
