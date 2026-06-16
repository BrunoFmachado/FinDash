const financeData = {
  app: {
    brandName: "FinDash",
    brandSubtitle: "controle financeiro",
    sidebarTitle: "Planejamento inteligente",
    sidebarText: "Organize despesas, acompanhe metas e veja sua evolução mensal em tempo real.",
    profileName: "Bruno",
    profileAvatar: "BM",
    profilePlan: "Conta Premium",
    transactionsBadge: 12
  },

  overview: {
    heroLabel: "● visão consolidada do mês",
    balance: 27460.90,
    growthText: "+12,4% comparado ao mês anterior",
    updatedText: "Atualizado agora",
    quickIncome: 9540,
    quickExpense: 4870,
    quickInvestment: 2100
  },

  summary: {
    incomeMonth: 5505.50,
    incomeTrend: "▲ 8,2%",
    incomeGoal: 7000,
    incomeStatus: "Bom ritmo",

    expenseMonth: 4024.00,
    expenseTrend: "● controle ativo",
    expenseType: "Fixas + variáveis",
    expenseStatus: "- R$ 680,00 ontem"
  },

  expensesByCategory: [
    { name: "Moradia", percent: 42, colorClass: "#8b5cf6" },
    { name: "Cartão", percent: 25, colorClass: "#f97316" },
    { name: "Lazer", percent: 18, colorClass: "#ef4444" },
    { name: "Outros", percent: 15, colorClass: "#22c55e" }
  ],

  incomesByCategory: [
    { name: "Salário", percent: 56, colorClass: "#06b6d4" },
    { name: "Freelance", percent: 27, colorClass: "#fbbf24" },
    { name: "Rendimentos", percent: 17, colorClass: "#22c55e" }
  ],

  monthlyChart: [
    { month: "Jan", income: 78, expense: 52 },
    { month: "Fev", income: 88, expense: 60 },
    { month: "Mar", income: 70, expense: 54 },
    { month: "Abr", income: 92, expense: 62 },
    { month: "Mai", income: 81, expense: 56 },
    { month: "Jun", income: 97, expense: 66 }
  ],

  goal: {
    title: "Meta de reserva de emergência",
    subtitle: "Objetivo até dezembro",
    current: 15600,
    target: 20000,
    monthlyContribution: 1900
  },

  transactions: [
    {
      icon: "🛒",
      iconClass: "transaction-blue",
      title: "Supermercado Prime",
      description: "Hoje, 14:20 • Alimentação",
      value: -248.90
    },
    {
      icon: "💼",
      iconClass: "transaction-green",
      title: "Pagamento cliente",
      description: "Hoje, 10:45 • Freelance",
      value: 1350.00
    },
    {
      icon: "🚗",
      iconClass: "transaction-orange",
      title: "Combustível",
      description: "Ontem, 18:10 • Transporte",
      value: -180.00
    }
  ],

  accounts: [
    {
      title: "Carteira principal",
      subtitle: "Banco digital",
      value: 18420.00,
      progress: 84
    },
    {
      title: "Investimentos",
      subtitle: "Renda fixa + fundos",
      value: 6700.10,
      progress: 71
    }
  ],

  bills: [
    {
      icon: "⚡",
      iconClass: "transaction-danger",
      title: "Energia elétrica",
      description: "Vence em 2 dias",
      value: 187.30
    },
    {
      icon: "🏠",
      iconClass: "transaction-blue",
      title: "Aluguel",
      description: "Vence em 5 dias",
      value: 1450.00
    }
  ]
};

function formatCurrency(value) {
  const safeValue = Number(value) || 0;
  return safeValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setWidth(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.style.width = value;
  }
}

function createLegendHTML(items) {
  return items
    .map(
      (item) => `
        <div class="legend-item">
          <div class="legend-label">
            <span class="dot" style="background:${item.colorClass}"></span>
            ${item.name}
          </div>
          <strong>${item.percent}%</strong>
        </div>
      `
    )
    .join("");
}

function createBarChartHTML(items) {
  return items
    .map(
      (item) => `
        <div class="bar-col">
          <div class="bar-pair">
            <div class="bar income-bar" style="height: ${item.income}%;"></div>
            <div class="bar secondary expense-bar" style="height: ${item.expense}%;"></div>
          </div>
          <span class="bar-label">${item.month}</span>
        </div>
      `
    )
    .join("");
}

function createTransactionListHTML(items, showSignal = true) {
  return items
    .map((item) => {
      const isPositive = item.value >= 0;
      const signal = isPositive ? "+ " : "- ";
      const valueClass = isPositive ? "positive" : "negative";

      return `
        <div class="transaction">
          <div class="transaction-icon ${item.iconClass || "transaction-blue"}">
            ${item.icon || "💸"}
          </div>

          <div class="t-info" style="flex: 1;">
            <h4 style="margin-bottom:4px; font-size:0.95rem;">
              ${item.title || ""}
            </h4>
            <span style="font-size:0.84rem; color:var(--muted);">
              ${item.description || item.subtitle || ""}
            </span>
          </div>

          <div class="t-value masked ${showSignal ? valueClass : ""}">
            ${showSignal ? signal : ""}${formatCurrency(Math.abs(item.value || 0))}
          </div>
        </div>
      `;
    })
    .join("");
}

function createAccountsHTML(items) {
  return items
    .map(
      (item) => `
        <div class="transaction" style="flex-direction: column; align-items: stretch; gap: 8px;">
          <div style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div>
              <strong style="display:block;">${item.title || ""}</strong>
              <span style="font-size:0.84rem; color:var(--muted);">
                ${item.subtitle || ""}
              </span>
            </div>

            <strong class="masked">${formatCurrency(item.value)}</strong>
          </div>

          <div class="progress">
            <span style="width: ${item.progress || 0}%;"></span>
          </div>
        </div>
      `
    )
    .join("");
}

function renderProfile() {
  setText("user-name", financeData.app.profileName);
  setText("user-initials", financeData.app.profileAvatar);
  setText("user-initials-profile", financeData.app.profileAvatar);
  setText("user-plan", financeData.app.profilePlan);
  setText("nav-badge-transactions", financeData.app.transactionsBadge);
}

function renderOverview() {
  setText("val-saldo-geral", formatCurrency(financeData.overview.balance));
  setText("val-crescimento-saldo", financeData.overview.growthText);
  setText("val-data-atualizacao", financeData.overview.updatedText);
  setText("val-resumo-receitas", formatCurrency(financeData.overview.quickIncome));
  setText("val-resumo-despesas", formatCurrency(financeData.overview.quickExpense));
  setText("val-resumo-investimentos", formatCurrency(financeData.overview.quickInvestment));
}

function renderSummary() {
  setText("val-card-receitas", formatCurrency(financeData.summary.incomeMonth));
  setText("val-pill-receita-crescimento", financeData.summary.incomeTrend);
  setText(
    "val-meta-mensal-receita",
    `Meta mensal: ${formatCurrency(financeData.summary.incomeGoal)}`
  );
  setText("val-status-receita", financeData.summary.incomeStatus);

  setText("val-card-despesas", formatCurrency(financeData.summary.expenseMonth));
  setText("val-gasto-ontem", financeData.summary.expenseStatus);
}

function renderDonuts() {
  setText("val-grafico-despesas-total", formatCurrency(financeData.summary.expenseMonth));
  setText("val-grafico-receitas-total", formatCurrency(financeData.summary.incomeMonth));

  const expenseLegend = document.getElementById("legenda-despesas");
  const incomeLegend = document.getElementById("legenda-receitas");

  if (expenseLegend) {
    expenseLegend.innerHTML = createLegendHTML(financeData.expensesByCategory);
  }

  if (incomeLegend) {
    incomeLegend.innerHTML = createLegendHTML(financeData.incomesByCategory);
  }
}

function renderBarChart() {
  const barsContainer = document.getElementById("grafico-barras-container");
  if (barsContainer) {
    barsContainer.innerHTML = createBarChartHTML(financeData.monthlyChart);
  }
}

function renderGoal() {
  const goal = financeData.goal;
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const remaining = Math.max(goal.target - goal.current, 0);

  setText("val-meta-titulo", goal.title);
  setText("val-meta-subtitulo", goal.subtitle);
  setText("val-meta-porcentagem", `${progress.toFixed(0)}% concluído`);
  setText(
    "val-meta-valores",
    `${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}`
  );
  setText("val-meta-aporte", formatCurrency(goal.monthlyContribution));
  setText("val-meta-falta", formatCurrency(remaining));
  setWidth("val-meta-barra-progresso", `${progress}%`);
}

function renderTransactions() {
  const transacoesContainer = document.getElementById("container-transacoes");
  if (transacoesContainer) {
    transacoesContainer.innerHTML = createTransactionListHTML(
      financeData.transactions,
      true
    );
  }
}

function renderBills() {
  const vencimentosContainer = document.getElementById("container-vencimentos");
  if (vencimentosContainer) {
    vencimentosContainer.innerHTML = createTransactionListHTML(
      financeData.bills,
      false
    );
  }
}

function renderAccounts() {
  const contasContainer = document.getElementById("container-contas");
  if (contasContainer) {
    contasContainer.innerHTML = createAccountsHTML(financeData.accounts);
  }
}

function renderDashboard() {
  renderProfile();
  renderOverview();
  renderSummary();
  renderDonuts();
  renderBarChart();
  renderGoal();
  renderTransactions();
  renderBills();
  renderAccounts();
}

function setupToggleBalance() {
  const app = document.getElementById("app");
  const toggleBalance = document.getElementById("toggleBalance");

  if (!app || !toggleBalance) return;

  toggleBalance.addEventListener("click", () => {
    app.classList.toggle("hide-balance");
    toggleBalance.textContent = app.classList.contains("hide-balance") ? "🙈" : "👁️";
  });
}

function setupNavItems() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((btn) => {
        btn.classList.remove("active");
      });
      item.classList.add("active");
    });
  });
}

function setupFab() {
  const fab = document.querySelector(".fab");
  if (!fab) return;

  fab.addEventListener("click", () => {
    alert("Modal de nova transação será aberto aqui!");
  });
}

function init() {
  renderDashboard();
  setupToggleBalance();
  setupNavItems();
  setupFab();
}

document.addEventListener("DOMContentLoaded", init);