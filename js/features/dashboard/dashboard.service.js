const db = require('../../../db');

function numero(valor) {
  return Number(valor || 0);
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

async function contas(usuario_id) {
  const [rows] = await db.query(
    `SELECT id, nome, tipo, saldo, instituicao
       FROM conta
      WHERE usuario_id = ?
      ORDER BY saldo DESC, id DESC`,
    [usuario_id]
  );

  return rows.map((row) => ({
    ...row,
    saldo: numero(row.saldo)
  }));
}

async function transacoesMes(usuario_id) {
  const { start, end } = monthRange();
  const [rows] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN tipo = 'receita' AND status = 'realizado' THEN valor ELSE 0 END), 0) AS receitas,
       COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'realizado' THEN valor ELSE 0 END), 0) AS despesas,
       COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_previsto ELSE 0 END), 0) AS receitas_previstas,
       COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_previsto ELSE 0 END), 0) AS despesas_previstas,
       COUNT(*) AS total
       FROM transacao
      WHERE usuario_id = ? AND data BETWEEN ? AND ?`,
    [usuario_id, start, end]
  );

  const row = rows[0] || {};
  return {
    receitas: numero(row.receitas),
    despesas: numero(row.despesas),
    receitas_previstas: numero(row.receitas_previstas),
    despesas_previstas: numero(row.despesas_previstas),
    total: numero(row.total)
  };
}

async function transacoesRecentes(usuario_id) {
  const [rows] = await db.query(
    `SELECT t.id, t.tipo, t.titulo, t.valor, t.valor_previsto, t.data, t.categoria,
            t.status, c.nome AS conta_nome
       FROM transacao t
       JOIN conta c ON c.id = t.conta_id
      WHERE t.usuario_id = ?
      ORDER BY t.data DESC, t.id DESC
      LIMIT 6`,
    [usuario_id]
  );

  return rows.map((row) => ({
    ...row,
    valor: numero(row.valor),
    valor_previsto: numero(row.valor_previsto),
    data: row.data ? row.data.toISOString?.().slice(0, 10) || String(row.data).slice(0, 10) : ''
  }));
}

async function categorias(usuario_id, tipo) {
  const { start, end } = monthRange();
  const [rows] = await db.query(
    `SELECT COALESCE(categoria, 'Sem categoria') AS nome, COALESCE(SUM(valor), 0) AS total
       FROM transacao
      WHERE usuario_id = ? AND tipo = ? AND status = 'realizado' AND data BETWEEN ? AND ?
      GROUP BY COALESCE(categoria, 'Sem categoria')
      ORDER BY total DESC`,
    [usuario_id, tipo, start, end]
  );

  const total = rows.reduce((acc, item) => acc + numero(item.total), 0);
  return rows.map((row) => ({
    nome: row.nome,
    total: numero(row.total),
    percent: total > 0 ? Math.round((numero(row.total) / total) * 100) : 0
  }));
}

async function vencimentos(usuario_id) {
  const [rows] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) AS pendente_total,
       COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) AS pago_total,
       SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) AS pendente_count,
       SUM(CASE WHEN status = 'pago' THEN 1 ELSE 0 END) AS pago_count
       FROM vencimento
      WHERE usuario_id = ?`,
    [usuario_id]
  );

  const [proximos] = await db.query(
    `SELECT id, descricao, valor, dataVencimento, status
       FROM vencimento
      WHERE usuario_id = ? AND status = 'pendente'
      ORDER BY dataVencimento ASC
      LIMIT 4`,
    [usuario_id]
  );

  const row = rows[0] || {};
  return {
    pendente_total: numero(row.pendente_total),
    pago_total: numero(row.pago_total),
    pendente_count: numero(row.pendente_count),
    pago_count: numero(row.pago_count),
    proximos: proximos.map((item) => ({
      ...item,
      valor: numero(item.valor),
      dataVencimento: item.dataVencimento ? item.dataVencimento.toISOString?.().slice(0, 10) || String(item.dataVencimento).slice(0, 10) : ''
    }))
  };
}

async function metas(usuario_id) {
  const [rows] = await db.query(
    `SELECT id, nome, valorAlvo, valorAtual, prazo
       FROM meta
      WHERE usuario_id = ?
      ORDER BY (valorAtual / NULLIF(valorAlvo, 0)) DESC, id DESC
      LIMIT 3`,
    [usuario_id]
  );

  return rows.map((row) => ({
    ...row,
    valorAlvo: numero(row.valorAlvo),
    valorAtual: numero(row.valorAtual),
    prazo: row.prazo ? row.prazo.toISOString?.().slice(0, 10) || String(row.prazo).slice(0, 10) : ''
  }));
}

async function evolucao(usuario_id) {
  const [rows] = await db.query(
    `SELECT DATE_FORMAT(data, '%Y-%m') AS mes,
            COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
            COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas
       FROM transacao
      WHERE usuario_id = ?
        AND data >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
        AND status = 'realizado'
      GROUP BY DATE_FORMAT(data, '%Y-%m')
      ORDER BY mes ASC`,
    [usuario_id]
  );

  return rows.map((row) => ({
    mes: row.mes,
    receitas: numero(row.receitas),
    despesas: numero(row.despesas)
  }));
}

async function resumo(usuario_id) {
  const [listaContas, mes, recentes, catDespesas, catReceitas, dadosVencimentos, listaMetas, dadosEvolucao] = await Promise.all([
    contas(usuario_id),
    transacoesMes(usuario_id),
    transacoesRecentes(usuario_id),
    categorias(usuario_id, 'despesa'),
    categorias(usuario_id, 'receita'),
    vencimentos(usuario_id),
    metas(usuario_id),
    evolucao(usuario_id)
  ]);

  const saldoTotal = listaContas.reduce((acc, item) => acc + numero(item.saldo), 0);

  return {
    saldoTotal,
    contas: listaContas,
    mes: {
      ...mes,
      saldo: mes.receitas - mes.despesas,
      previsto: {
        receitas: mes.receitas_previstas,
        despesas: mes.despesas_previstas,
        saldo: mes.receitas_previstas - mes.despesas_previstas
      },
      realizado: {
        receitas: mes.receitas,
        despesas: mes.despesas,
        saldo: mes.receitas - mes.despesas
      }
    },
    vencimentos: dadosVencimentos,
    metas: listaMetas,
    transacoesRecentes: recentes,
    categorias: {
      despesas: catDespesas,
      receitas: catReceitas
    },
    evolucao: dadosEvolucao
  };
}

module.exports = { resumo };
