const TRANSACTION_TYPE_LABELS = {
  receita: 'Receita',
  despesa: 'Despesa'
};

function getTransactionTypeLabel(tipo) {
  return TRANSACTION_TYPE_LABELS[tipo] || tipo || '-';
}

async function carregarContasTransacao() {
  const select = document.getElementById('transactionAccount');
  if (!select) return;

  try {
    const dados = await FinDash.fetchJson('/api/contas');
    select.innerHTML = `
      <option value="">Selecione uma conta</option>
      ${dados.contas.map((conta) => `<option value="${conta.id}">${conta.nome}</option>`).join('')}
    `;
  } catch (err) {
    console.error(err);
  }
}

function filtrosTransacao() {
  const params = new URLSearchParams();
  const tipo = document.getElementById('filterType')?.value;
  const inicio = document.getElementById('filterDateStart')?.value;
  const fim = document.getElementById('filterDateEnd')?.value;
  const mes = document.getElementById('filterMonth')?.value;

  if (tipo && tipo !== 'todos') params.set('tipo', tipo);
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  if (mes) params.set('mes', mes);

  return params.toString();
}

async function carregarTransacoes() {
  const query = filtrosTransacao();
  const dados = await FinDash.fetchJson(`/api/transacoes${query ? `?${query}` : ''}`);
  renderTransactionSummary(dados.resumo || {});
  renderTransactionsTable(dados.transacoes || []);
  FinDash.updateTransactionsBadge();
}

function renderTransactionSummary(resumo) {
  const incomeElement = document.getElementById('transactionsIncomeTotal');
  const expenseElement = document.getElementById('transactionsExpenseTotal');
  const balanceElement = document.getElementById('transactionsBalanceTotal');
  const predictedElement = document.getElementById('transactionsPredictedBalance');

  if (incomeElement) incomeElement.textContent = FinDash.formatMoney(resumo.receitas || 0);
  if (expenseElement) expenseElement.textContent = FinDash.formatMoney(resumo.despesas || 0);
  if (balanceElement) balanceElement.textContent = FinDash.formatMoney(resumo.saldo || 0);
  if (predictedElement) {
    predictedElement.textContent = FinDash.formatMoney((resumo.receitas_previstas || 0) - (resumo.despesas_previstas || 0));
  }
}

function createTransactionRow(transacao) {
  const sinal = transacao.tipo === 'receita' ? '+' : '-';
  const color = transacao.tipo === 'receita' ? 'var(--success)' : 'var(--danger)';

  return `
    <tr>
      <td>${getTransactionTypeLabel(transacao.tipo)}</td>
      <td>${transacao.titulo || '-'}</td>
      <td>${transacao.categoria || '-'}</td>
      <td>${transacao.conta_nome || '-'}</td>
      <td>${FinDash.formatDateBr(transacao.data)}</td>
      <td>${transacao.status || '-'}</td>
      <td class="masked">${FinDash.formatMoney(transacao.valor_previsto)}</td>
      <td class="masked" style="color:${color}; font-weight:800;">${sinal} ${FinDash.formatMoney(transacao.valor)}</td>
      <td>
        <div class="table-actions">
          <button class="table-action-btn" type="button" onclick="editTransaction(${transacao.id})">Editar</button>
          <button class="table-action-btn table-action-btn-danger" type="button" onclick="deleteTransaction(${transacao.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `;
}

function renderTransactionsTable(transacoes) {
  const tableBody = document.getElementById('transactionsTableBody');
  const emptyState = document.getElementById('transactionsEmptyState');

  if (!tableBody || !emptyState) return;

  if (!transacoes.length) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  tableBody.innerHTML = transacoes.map(createTransactionRow).join('');
  emptyState.style.display = 'none';
}

function resetTransactionFormState() {
  const form = document.getElementById('transactionForm');
  if (!form) return;

  form.removeAttribute('data-edit-id');
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Salvar transaÃ§Ã£o';
}

function fillTransactionForm(transacao) {
  const form = document.getElementById('transactionForm');
  if (!form) return;

  document.getElementById('transactionType').value = transacao.tipo || '';
  document.getElementById('transactionTitle').value = transacao.titulo || '';
  document.getElementById('transactionAmount').value = Number(transacao.valor || 0);
  document.getElementById('transactionPredicted').value = Number(transacao.valor_previsto || transacao.valor || 0);
  document.getElementById('transactionCategory').value = transacao.categoria || '';
  document.getElementById('transactionAccount').value = transacao.conta_id || '';
  document.getElementById('transactionDate').value = transacao.data || '';
  document.getElementById('transactionStatus').value = transacao.status || 'realizado';
  document.getElementById('transactionDescription').value = transacao.descricao || '';

  form.setAttribute('data-edit-id', transacao.id);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Atualizar transaÃ§Ã£o';
}

async function handleTransactionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const editId = form.getAttribute('data-edit-id');
  const body = {
    tipo: document.getElementById('transactionType').value,
    titulo: document.getElementById('transactionTitle').value.trim(),
    valor: Number(document.getElementById('transactionAmount').value || 0),
    valor_previsto: Number(document.getElementById('transactionPredicted').value || document.getElementById('transactionAmount').value || 0),
    categoria: document.getElementById('transactionCategory').value.trim(),
    conta_id: document.getElementById('transactionAccount').value,
    data: document.getElementById('transactionDate').value,
    status: document.getElementById('transactionStatus').value,
    descricao: document.getElementById('transactionDescription').value.trim()
  };

  try {
    await FinDash.fetchJson(`/api/transacoes${editId ? `/${editId}` : ''}`, {
      method: editId ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });

    form.reset();
    resetTransactionFormState();
    FinDash.setupDefaultDates();
    await carregarTransacoes();
    alert(editId ? 'TransaÃ§Ã£o atualizada com sucesso.' : 'TransaÃ§Ã£o cadastrada com sucesso.');
  } catch (err) {
    alert(err.message);
  }
}

async function editTransaction(id) {
  try {
    const dados = await FinDash.fetchJson(`/api/transacoes/${id}`);
    fillTransactionForm(dados.transacao);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert(err.message);
  }
}

async function deleteTransaction(id) {
  if (!confirm('Tem certeza que deseja excluir esta transaÃ§Ã£o?')) return;

  try {
    await FinDash.fetchJson(`/api/transacoes/${id}`, { method: 'DELETE' });
    await carregarTransacoes();
  } catch (err) {
    alert(err.message);
  }
}

function setupTransactionForm() {
  const form = document.getElementById('transactionForm');
  if (!form) return;

  form.addEventListener('submit', handleTransactionSubmit);
  form.addEventListener('reset', () => setTimeout(resetTransactionFormState, 0));
}

function setupTransactionFilters() {
  const filterForm = document.getElementById('transactionFilterForm');
  if (!filterForm) return;

  filterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    carregarTransacoes().catch((err) => alert(err.message));
  });

  filterForm.addEventListener('reset', () => {
    setTimeout(() => carregarTransacoes().catch((err) => alert(err.message)), 0);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!FinDash.ensureAuth()) return;

  carregarContasTransacao();
  setupTransactionForm();
  setupTransactionFilters();

  document.getElementById('exportTransactions')?.addEventListener('click', () => {
    const query = filtrosTransacao();
    FinDash.downloadCsv(`/api/transacoes/export/csv${query ? `?${query}` : ''}`);
  });

  carregarTransacoes().catch((err) => alert(err.message));
});

window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
