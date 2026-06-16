async function carregarMetas() {
  const dados = await FinDash.fetchJson('/api/metas');
  renderGoalsSummary(dados.resumo || {});
  renderGoalsList(dados.metas || []);
  FinDash.updateTransactionsBadge();
}

function renderGoalsSummary(resumo) {
  const countElement = document.getElementById('goalsCount');
  const totalElement = document.getElementById('goalsCurrentTotal');
  const targetElement = document.getElementById('goalsTargetTotal');

  if (countElement) countElement.textContent = String(resumo.total || 0);
  if (totalElement) totalElement.textContent = FinDash.formatMoney(resumo.atual_total || 0);
  if (targetElement) targetElement.textContent = FinDash.formatMoney(resumo.alvo_total || 0);
}

function createGoalCard(goal) {
  const target = Number(goal.valorAlvo || 0);
  const current = Number(goal.valorAtual || 0);
  const monthlyContribution = Number(goal.aporteMensal || 0);
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);

  return `
    <div class="transaction" style="flex-direction: column; align-items: stretch; gap: 12px;">
      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <strong style="display:block; margin-bottom:4px;">${goal.nome || '-'}</strong>
          <span style="font-size:0.84rem; color:var(--muted);">Prazo: ${FinDash.formatDateBr(goal.prazo)}</span>
        </div>
        <strong>${progress.toFixed(0)}%</strong>
      </div>

      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; font-size:0.88rem;">
        <span>Atual: <strong class="masked">${FinDash.formatMoney(current)}</strong></span>
        <span>Meta: <strong class="masked">${FinDash.formatMoney(target)}</strong></span>
      </div>

      <div class="progress"><span style="width:${progress}%;"></span></div>

      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; font-size:0.84rem; color:var(--muted);">
        <span>Aporte mensal: <strong class="masked">${FinDash.formatMoney(monthlyContribution)}</strong></span>
        <span>Faltam: <strong class="masked">${FinDash.formatMoney(remaining)}</strong></span>
      </div>

      <div class="table-actions">
        <button class="table-action-btn" type="button" onclick="editGoal(${goal.id})">Editar</button>
        <button class="table-action-btn table-action-btn-danger" type="button" onclick="deleteGoal(${goal.id})">Excluir</button>
      </div>
    </div>
  `;
}

function renderGoalsList(goals) {
  const goalsList = document.getElementById('goalsList');
  const emptyState = document.getElementById('goalsEmptyState');

  if (!goalsList || !emptyState) return;

  if (!goals.length) {
    goalsList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  goalsList.innerHTML = goals.map(createGoalCard).join('');
  emptyState.style.display = 'none';
}

function resetGoalFormState() {
  const form = document.getElementById('goalForm');
  if (!form) return;

  form.removeAttribute('data-edit-id');
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Salvar meta';
}

function fillGoalForm(goal) {
  const form = document.getElementById('goalForm');
  if (!form) return;

  document.getElementById('goalTitle').value = goal.nome || '';
  document.getElementById('goalTarget').value = Number(goal.valorAlvo || 0);
  document.getElementById('goalCurrent').value = Number(goal.valorAtual || 0);
  document.getElementById('goalMonthlyContribution').value = Number(goal.aporteMensal || 0);
  document.getElementById('goalDeadline').value = goal.prazo || '';

  form.setAttribute('data-edit-id', goal.id);
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Atualizar meta';
}

async function handleGoalSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const editId = form.getAttribute('data-edit-id');
  const body = {
    nome: document.getElementById('goalTitle').value.trim(),
    valorAlvo: Number(document.getElementById('goalTarget').value || 0),
    valorAtual: Number(document.getElementById('goalCurrent').value || 0),
    aporteMensal: Number(document.getElementById('goalMonthlyContribution').value || 0),
    prazo: document.getElementById('goalDeadline').value
  };

  try {
    await FinDash.fetchJson(`/api/metas${editId ? `/${editId}` : ''}`, {
      method: editId ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });

    form.reset();
    resetGoalFormState();
    FinDash.setupDefaultDates();
    await carregarMetas();
    alert(editId ? 'Meta atualizada com sucesso.' : 'Meta cadastrada com sucesso.');
  } catch (err) {
    alert(err.message);
  }
}

async function editGoal(id) {
  try {
    const dados = await FinDash.fetchJson(`/api/metas/${id}`);
    fillGoalForm(dados.meta);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert(err.message);
  }
}

async function deleteGoal(id) {
  if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

  try {
    await FinDash.fetchJson(`/api/metas/${id}`, { method: 'DELETE' });
    await carregarMetas();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!FinDash.ensureAuth()) return;

  const form = document.getElementById('goalForm');
  if (form) {
    form.addEventListener('submit', handleGoalSubmit);
    form.addEventListener('reset', () => setTimeout(resetGoalFormState, 0));
  }

  carregarMetas().catch((err) => alert(err.message));
});

window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
