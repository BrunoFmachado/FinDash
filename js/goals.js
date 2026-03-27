function getGoals() {
  return getStorageData(STORAGE_KEYS.goals);
}

function saveGoals(goals) {
  setStorageData(STORAGE_KEYS.goals, goals);
}

function calculateGoalsSummary(goals) {
  return {
    totalGoals: goals.length,
    totalCurrent: goals.reduce((total, item) => total + Number(item.current || 0), 0)
  };
}

function renderGoalsSummary(goals) {
  const summary = calculateGoalsSummary(goals);

  const countElement = document.getElementById("goalsCount");
  const totalElement = document.getElementById("goalsCurrentTotal");

  if (countElement) countElement.textContent = String(summary.totalGoals);
  if (totalElement) totalElement.textContent = formatCurrency(summary.totalCurrent);
}

function createGoalCard(goal) {
  const target = Number(goal.target || 0);
  const current = Number(goal.current || 0);
  const monthlyContribution = Number(goal.monthlyContribution || 0);
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const remaining = Math.max(target - current, 0);

  return `
    <div class="transaction" style="flex-direction: column; align-items: stretch; gap: 12px;">
      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <div>
          <strong style="display:block; margin-bottom:4px;">${goal.title || "-"}</strong>
          <span style="font-size:0.84rem; color:var(--muted);">
            Prazo: ${formatDate(goal.deadline)}
          </span>
        </div>

        <strong>${progress.toFixed(0)}%</strong>
      </div>

      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; font-size:0.88rem;">
        <span>Atual: <strong>${formatCurrency(current)}</strong></span>
        <span>Meta: <strong>${formatCurrency(target)}</strong></span>
      </div>

      <div class="progress">
        <span style="width:${progress}%;"></span>
      </div>

      <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; font-size:0.84rem; color:var(--muted);">
        <span>Aporte mensal: <strong>${formatCurrency(monthlyContribution)}</strong></span>
        <span>Faltam: <strong>${formatCurrency(remaining)}</strong></span>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-secondary" type="button" onclick="editGoal('${goal.id}')">
          Editar
        </button>
        <button class="btn btn-secondary" type="button" onclick="deleteGoal('${goal.id}')">
          Excluir
        </button>
      </div>
    </div>
  `;
}

function renderGoalsList(goals) {
  const goalsList = document.getElementById("goalsList");
  const emptyState = document.getElementById("goalsEmptyState");

  if (!goalsList || !emptyState) return;

  if (goals.length === 0) {
    goalsList.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  goalsList.innerHTML = goals.map(createGoalCard).join("");
  emptyState.style.display = "none";
}

function renderGoalsPage() {
  const goals = getGoals();
  renderGoalsSummary(goals);
  renderGoalsList(goals);
  updateTransactionsBadge();
}

function resetGoalFormState() {
  const form = document.getElementById("goalForm");
  if (!form) return;

  form.removeAttribute("data-edit-id");

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Salvar meta";
  }
}

function fillGoalForm(goal) {
  const form = document.getElementById("goalForm");
  if (!form) return;

  document.getElementById("goalTitle").value = goal.title || "";
  document.getElementById("goalTarget").value = Number(goal.target || 0);
  document.getElementById("goalCurrent").value = Number(goal.current || 0);
  document.getElementById("goalMonthlyContribution").value = Number(goal.monthlyContribution || 0);
  document.getElementById("goalDeadline").value = goal.deadline || "";

  form.setAttribute("data-edit-id", goal.id);

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Atualizar meta";
  }
}

function handleGoalSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const editId = form.getAttribute("data-edit-id");

  const goal = {
    id: editId || generateId("goal"),
    title: document.getElementById("goalTitle").value.trim(),
    target: Number(document.getElementById("goalTarget").value || 0),
    current: Number(document.getElementById("goalCurrent").value || 0),
    monthlyContribution: Number(document.getElementById("goalMonthlyContribution").value || 0),
    deadline: document.getElementById("goalDeadline").value
  };

  const goals = getGoals();

  if (editId) {
    const updatedGoals = goals.map((item) => {
      return item.id === editId ? goal : item;
    });

    saveGoals(updatedGoals);
  } else {
    saveGoals([goal, ...goals]);
  }

  form.reset();
  resetGoalFormState();
  renderGoalsPage();
}

function setupGoalForm() {
  const form = document.getElementById("goalForm");
  if (!form) return;

  form.addEventListener("submit", handleGoalSubmit);
  form.addEventListener("reset", () => {
    setTimeout(() => {
      resetGoalFormState();
    }, 0);
  });
}

function editGoal(goalId) {
  const goals = getGoals();
  const goal = goals.find((item) => item.id === goalId);

  if (!goal) return;

  fillGoalForm(goal);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteGoal(goalId) {
  const goals = getGoals();
  const updatedGoals = goals.filter((item) => item.id !== goalId);

  saveGoals(updatedGoals);
  renderGoalsPage();
}

function updateTransactionsBadge() {
  const badge = document.getElementById("transactionsBadge");
  if (!badge) return;

  const transactions = getStorageData(STORAGE_KEYS.transactions);
  badge.textContent = transactions.length;
}

document.addEventListener("DOMContentLoaded", () => {
  setupGoalForm();
  renderGoalsPage();
});

window.editGoal = editGoal;
window.deleteGoal = deleteGoal;