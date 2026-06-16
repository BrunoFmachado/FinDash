const DASHBOARD_COLORS = ['#2563eb', '#f59e0b', '#ef4444', '#22c55e', '#14b8a6', '#8b5cf6'];

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function buildDonut(svgId, segments) {
  const svg = document.getElementById(svgId);
  if (!svg) return;

  const cx = 140;
  const cy = 140;
  const r = 110;
  const stroke = 24;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  svg.innerHTML = '';

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', cx);
  track.setAttribute('cy', cy);
  track.setAttribute('r', r);
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke', 'rgba(100, 116, 139, 0.08)');
  track.setAttribute('stroke-width', stroke + 2);
  svg.appendChild(track);

  const validSegments = segments.length ? segments : [{ name: 'Sem dados', percent: 100, color: '#e2e8f0' }];

  validSegments.forEach((seg) => {
    const pct = Math.max(Number(seg.percent || 0), 0) / 100;
    const dash = circ * pct;
    const gap = circ - dash;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', seg.color);
    circle.setAttribute('stroke-width', stroke);
    circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
    circle.setAttribute('stroke-dashoffset', -offset);
    circle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    circle.setAttribute('stroke-linecap', 'round');
    svg.appendChild(circle);

    offset += dash;
  });
}

function buildLegend(containerId, segments) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!segments.length) {
    el.innerHTML = '<span class="muted">Sem dados no perí­odo.</span>';
    return;
  }

  el.innerHTML = segments.map((item) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow-sm);">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:14px; height:14px; border-radius:6px; background:${item.color}; box-shadow: 0 4px 10px ${item.color}66;"></div>
        <span style="font-size:0.9rem; font-weight:600; color:var(--text);">${item.name}</span>
      </div>
      <strong style="color:var(--text); font-size: 1rem;">${item.percent}%</strong>
    </div>
  `).join('');
}

function categorySegments(items) {
  return (items || []).map((item, index) => ({
    name: item.nome,
    percent: item.percent,
    color: DASHBOARD_COLORS[index % DASHBOARD_COLORS.length]
  }));
}

function renderAccountList(accounts) {
  const containers = document.querySelectorAll('#accountDistributionList, #homeAccountSummary');
  containers.forEach((container) => {
    if (!accounts.length) {
      container.innerHTML = '<span class="muted">Nenhuma carteira cadastrada.</span>';
      return;
    }

    container.innerHTML = accounts.slice(0, 4).map((account, index) => `
      <div class="mini-item" style="padding: 12px 0; border-bottom: ${index === Math.min(accounts.length, 4) - 1 ? 'none' : '1px solid var(--border)'};">
        <div>
          <strong style="display: block;">${account.nome}</strong>
          <span class="muted" style="font-size: 0.8rem;">${account.tipo || '-'}</span>
        </div>
        <strong class="masked">${FinDash.formatMoney(account.saldo)}</strong>
      </div>
    `).join('');
  });
}

function renderBars(evolucao) {
  const container = document.getElementById('barsContainer');
  if (!container) return;

  const maior = Math.max(
    1,
    ...evolucao.map((item) => Number(item.receitas || 0)),
    ...evolucao.map((item) => Number(item.despesas || 0))
  );

  container.innerHTML = evolucao.map((item) => {
    const [, mes] = item.mes.split('-');
    const label = new Date(`${item.mes}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const receitaAltura = Math.max((Number(item.receitas || 0) / maior) * 100, 4);
    const despesaAltura = Math.max((Number(item.despesas || 0) / maior) * 100, 4);

    return `
      <div class="bar-col">
        <span class="muted" style="font-size: 0.75rem;">${label || mes}</span>
        <div class="bar-pair">
          <div class="bar" title="Receitas" style="height: ${receitaAltura}%;"></div>
          <div class="bar secondary" title="Despesas" style="height: ${despesaAltura}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderGoalHighlight(goals) {
  const goal = goals[0];
  setText('goalHighlightTitle', goal ? goal.nome : 'Nenhuma meta cadastrada');
  setText('goalHighlightDeadline', goal?.prazo ? FinDash.formatDateBr(goal.prazo) : '-');

  const progress = goal && goal.valorAlvo > 0 ? Math.min((goal.valorAtual / goal.valorAlvo) * 100, 100) : 0;
  setText('goalHighlightProgress', `${progress.toFixed(0)}% concluí­do`);
  setText('goalHighlightAmount', goal ? `${FinDash.formatMoney(goal.valorAtual)} / ${FinDash.formatMoney(goal.valorAlvo)}` : FinDash.formatMoney(0));
  setText('goalHighlightMissing', goal ? FinDash.formatMoney(Math.max(goal.valorAlvo - goal.valorAtual, 0)) : FinDash.formatMoney(0));

  const bar = document.getElementById('goalHighlightBar');
  if (bar) bar.style.width = `${progress}%`;
}

function renderDueBills(vencimentos) {
  const container = document.getElementById('dueBillsList');
  if (!container) return;

  const bills = vencimentos.proximos || [];
  if (!bills.length) {
    container.innerHTML = '<span class="muted">Nenhuma conta pendente.</span>';
    return;
  }

  container.innerHTML = bills.map((bill) => `
    <div class="transaction">
      <div class="transaction-icon transaction-orange">!</div>
      <div style="flex: 1;">
        <strong style="font-size: 0.95rem; display:block;">${bill.descricao}</strong>
        <span class="muted" style="font-size: 0.8rem;">Vence em ${FinDash.formatDateBr(bill.dataVencimento)}</span>
      </div>
      <strong class="masked" style="color: var(--danger);">- ${FinDash.formatMoney(bill.valor)}</strong>
    </div>
  `).join('');
}

function renderRecentTransactions(transacoes) {
  const container = document.getElementById('recentTransactionsList');
  if (!container) return;

  if (!transacoes.length) {
    container.innerHTML = '<span class="muted">Nenhuma transação cadastrada.</span>';
    return;
  }

  container.innerHTML = transacoes.slice(0, 5).map((item) => {
    const isIncome = item.tipo === 'receita';
    return `
      <div class="transaction">
        <div class="transaction-icon ${isIncome ? 'transaction-green' : 'transaction-danger'}">${isIncome ? '+' : '-'}</div>
        <div style="flex: 1;">
          <strong style="font-size: 0.95rem; display:block;">${item.titulo}</strong>
          <span class="muted" style="font-size: 0.8rem;">${item.categoria || '-'} - ${item.conta_nome || '-'}</span>
        </div>
        <strong class="masked" style="color: ${isIncome ? 'var(--success)' : 'var(--danger)'};">${isIncome ? '+' : '-'} ${FinDash.formatMoney(item.valor)}</strong>
      </div>
    `;
  }).join('');
}

function renderDashboard(dados) {
  const despesasSegments = categorySegments(dados.categorias?.despesas || []);
  const receitasSegments = categorySegments(dados.categorias?.receitas || []);

  setText('balanceValue', FinDash.formatMoney(dados.saldoTotal));
  setText('quickIncome', FinDash.formatMoney(dados.mes?.receitas || 0));
  setText('quickExpense', FinDash.formatMoney(dados.mes?.despesas || 0));
  setText('expenseDonutTotal', FinDash.formatMoney(dados.mes?.despesas || 0));
  setText('incomeDonutTotal', FinDash.formatMoney(dados.mes?.receitas || 0));

  setText('overviewNetWorth', FinDash.formatMoney(dados.saldoTotal));
  setText('overviewIncome', FinDash.formatMoney(dados.mes?.receitas || 0));
  setText('overviewExpense', FinDash.formatMoney(dados.mes?.despesas || 0));
  setText('overviewPendingBills', FinDash.formatMoney(dados.vencimentos?.pendente_total || 0));
  setText('overviewPaidBills', FinDash.formatMoney(dados.vencimentos?.pago_total || 0));
  setText('overviewPredicted', FinDash.formatMoney(dados.mes?.previsto?.saldo || 0));
  setText('overviewRealized', FinDash.formatMoney(dados.mes?.realizado?.saldo || 0));

  renderAccountList(dados.contas || []);
  renderBars(dados.evolucao || []);
  renderGoalHighlight(dados.metas || []);
  renderDueBills(dados.vencimentos || {});
  renderRecentTransactions(dados.transacoesRecentes || []);

  buildDonut('donutExpense', despesasSegments);
  buildDonut('donutIncome', receitasSegments);
  buildLegend('expenseLegend', despesasSegments);
  buildLegend('incomeLegend', receitasSegments);

  FinDash.updateTransactionsBadge();
  FinDash.applyMoneyVisibility();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!FinDash.ensureAuth()) return;

  document.getElementById('exportDashboard')?.addEventListener('click', () => {
    FinDash.downloadCsv('/api/transacoes/export/csv');
  });

  FinDash.fetchJson('/api/dashboard')
    .then(renderDashboard)
    .catch((err) => alert(err.message));
});
