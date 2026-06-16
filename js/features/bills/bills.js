async function carregarVencimentos() {
  const dados = await FinDash.fetchJson('/api/vencimentos');
  renderBillsSummary(dados.resumo || {});
  renderBillsTable(dados.vencimentos || []);
  FinDash.updateTransactionsBadge();
}

function renderBillsSummary(resumo) {
  const pendingTotalElement = document.getElementById('billsPendingTotal');
  const pendingCountElement = document.getElementById('billsPendingCount');
  const paidTotalElement = document.getElementById('billsPaidTotal');
  const paidCountElement = document.getElementById('billsPaidCount');

  if (pendingTotalElement) pendingTotalElement.textContent = FinDash.formatMoney(resumo.pendente_total || 0);
  if (pendingCountElement) pendingCountElement.textContent = String(resumo.pendente_count || 0);
  if (paidTotalElement) paidTotalElement.textContent = FinDash.formatMoney(resumo.pago_total || 0);
  if (paidCountElement) paidCountElement.textContent = String(resumo.pago_count || 0);
}

function createBillRow(bill) {
  return `
    <tr>
      <td>${bill.titulo || '-'}</td>
      <td class="masked">${FinDash.formatMoney(bill.valor)}</td>
      <td>${FinDash.formatDateBr(bill.dataVencimento)}</td>
      <td>${bill.pago ? 'Pago' : 'Pendente'}</td>
      <td>
        <div class="table-actions">
          <button class="table-action-btn" type="button" onclick="toggleBillStatus(${bill.id}, '${bill.pago ? 'pendente' : 'pago'}')">
            ${bill.pago ? 'Marcar pendente' : 'Marcar pago'}
          </button>
          <button class="table-action-btn" type="button" onclick="editBill(${bill.id})">Editar</button>
          <button class="table-action-btn table-action-btn-danger" type="button" onclick="deleteBill(${bill.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `;
}

function renderBillsTable(bills) {
  const tableBody = document.getElementById('billsTableBody');
  const emptyState = document.getElementById('billsEmptyState');

  if (!tableBody || !emptyState) return;

  if (!bills.length) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  tableBody.innerHTML = bills.map(createBillRow).join('');
  emptyState.style.display = 'none';
}

function resetBillFormState() {
  const form = document.getElementById('billForm');
  if (!form) return;

  form.removeAttribute('data-edit-id');
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Salvar vencimento';
}

function fillBillForm(bill) {
  const form = document.getElementById('billForm');
  if (!form) return;

  document.getElementById('billTitle').value = bill.titulo || '';
  document.getElementById('billAmount').value = Number(bill.valor || 0);
  document.getElementById('billDueDate').value = bill.dataVencimento || '';
  document.getElementById('billStatus').value = bill.pago ? 'pago' : 'pendente';

  form.setAttribute('data-edit-id', bill.id);
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Atualizar vencimento';
}

async function handleBillSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const editId = form.getAttribute('data-edit-id');
  const body = {
    descricao: document.getElementById('billTitle').value.trim(),
    valor: Number(document.getElementById('billAmount').value || 0),
    dataVencimento: document.getElementById('billDueDate').value,
    status: document.getElementById('billStatus').value
  };

  try {
    await FinDash.fetchJson(`/api/vencimentos${editId ? `/${editId}` : ''}`, {
      method: editId ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });

    form.reset();
    resetBillFormState();
    FinDash.setupDefaultDates();
    await carregarVencimentos();
    alert(editId ? 'Vencimento atualizado com sucesso.' : 'Vencimento cadastrado com sucesso.');
  } catch (err) {
    alert(err.message);
  }
}

async function toggleBillStatus(id, status) {
  try {
    await FinDash.fetchJson(`/api/vencimentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    await carregarVencimentos();
  } catch (err) {
    alert(err.message);
  }
}

async function editBill(id) {
  try {
    const dados = await FinDash.fetchJson(`/api/vencimentos/${id}`);
    fillBillForm(dados.vencimento);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert(err.message);
  }
}

async function deleteBill(id) {
  if (!confirm('Tem certeza que deseja excluir este vencimento?')) return;

  try {
    await FinDash.fetchJson(`/api/vencimentos/${id}`, { method: 'DELETE' });
    await carregarVencimentos();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!FinDash.ensureAuth()) return;

  const form = document.getElementById('billForm');
  if (form) {
    form.addEventListener('submit', handleBillSubmit);
    form.addEventListener('reset', () => setTimeout(resetBillFormState, 0));
  }

  carregarVencimentos().catch((err) => alert(err.message));
});

window.toggleBillStatus = toggleBillStatus;
window.editBill = editBill;
window.deleteBill = deleteBill;
