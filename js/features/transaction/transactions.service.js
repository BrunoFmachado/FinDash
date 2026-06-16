const db = require('../../../db');

const TIPOS_VALIDOS = ['receita', 'despesa'];
const STATUS_VALIDOS = ['realizado', 'previsto'];

function erroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function normalizarValor(valor, padrao = 0) {
  const numero = Number(valor ?? padrao);
  return Number.isFinite(numero) ? numero : padrao;
}

function impactoSaldo(transacao) {
  if (!transacao || transacao.status !== 'realizado') return 0;
  const valor = normalizarValor(transacao.valor);
  return transacao.tipo === 'receita' ? valor : -valor;
}

async function validarConta(conta_id, usuario_id) {
  const [rows] = await db.query(
    'SELECT id FROM conta WHERE id = ? AND usuario_id = ?',
    [conta_id, usuario_id]
  );

  if (!rows[0]) {
    const erro = new Error('Conta nÃ£o encontrada para este usuÃ¡rio.');
    erro.status = 404;
    throw erro;
  }
}

async function atualizarSaldoConta(conta_id, diferenca) {
  if (!diferenca) return;
  await db.query(
    'UPDATE conta SET saldo = saldo + ? WHERE id = ?',
    [diferenca, conta_id]
  );
}

function mapear(row) {
  if (!row) return null;

  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    valor: Number(row.valor || 0),
    valor_previsto: Number(row.valor_previsto || row.valor || 0),
    data: row.data ? row.data.toISOString?.().slice(0, 10) || String(row.data).slice(0, 10) : '',
    categoria: row.categoria,
    descricao: row.descricao,
    status: row.status,
    conta_id: row.conta_id,
    conta_nome: row.conta_nome
  };
}

function montarFiltros(usuario_id, filtros = {}) {
  const where = ['t.usuario_id = ?'];
  const params = [usuario_id];

  if (filtros.tipo && filtros.tipo !== 'todos') {
    where.push('t.tipo = ?');
    params.push(filtros.tipo);
  }

  if (filtros.status && filtros.status !== 'todos') {
    where.push('t.status = ?');
    params.push(filtros.status);
  }

  if (filtros.inicio) {
    where.push('t.data >= ?');
    params.push(filtros.inicio);
  }

  if (filtros.fim) {
    where.push('t.data <= ?');
    params.push(filtros.fim);
  }

  if (filtros.mes) {
    where.push("DATE_FORMAT(t.data, '%Y-%m') = ?");
    params.push(filtros.mes);
  }

  return { where: where.join(' AND '), params };
}

async function listar(usuario_id, filtros = {}) {
  const { where, params } = montarFiltros(usuario_id, filtros);
  const [rows] = await db.query(
    `SELECT t.id, t.tipo, t.titulo, t.valor, t.valor_previsto, t.data, t.categoria,
            t.descricao, t.status, t.conta_id, c.nome AS conta_nome
       FROM transacao t
       JOIN conta c ON c.id = t.conta_id
      WHERE ${where}
      ORDER BY t.data DESC, t.id DESC`,
    params
  );

  return rows.map(mapear);
}

async function buscarPorId(id, usuario_id) {
  const [rows] = await db.query(
    `SELECT t.id, t.tipo, t.titulo, t.valor, t.valor_previsto, t.data, t.categoria,
            t.descricao, t.status, t.conta_id, c.nome AS conta_nome
       FROM transacao t
       JOIN conta c ON c.id = t.conta_id
      WHERE t.id = ? AND t.usuario_id = ?`,
    [id, usuario_id]
  );

  return mapear(rows[0]);
}

async function cadastrar(dados) {
  const tipo = dados.tipo;
  const status = dados.status || 'realizado';

  if (!TIPOS_VALIDOS.includes(tipo)) throw erroValidacao('Tipo de transaÃ§Ã£o invÃ¡lido.');
  if (!STATUS_VALIDOS.includes(status)) throw erroValidacao('Status de transaÃ§Ã£o invÃ¡lido.');
  if (!dados.titulo) throw erroValidacao('TÃ­tulo Ã© obrigatÃ³rio.');
  if (!dados.data) throw erroValidacao('Data Ã© obrigatÃ³ria.');
  if (!dados.conta_id) throw erroValidacao('Conta Ã© obrigatÃ³ria.');

  await validarConta(dados.conta_id, dados.usuario_id);

  const valor = normalizarValor(dados.valor);
  const valorPrevisto = normalizarValor(dados.valor_previsto, valor);

  const [resultado] = await db.query(
    `INSERT INTO transacao
      (usuario_id, tipo, titulo, valor, valor_previsto, data, categoria, descricao, status, conta_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dados.usuario_id,
      tipo,
      dados.titulo,
      valor,
      valorPrevisto,
      dados.data,
      dados.categoria || null,
      dados.descricao || null,
      status,
      dados.conta_id
    ]
  );

  await atualizarSaldoConta(dados.conta_id, impactoSaldo({ tipo, status, valor }));
  return buscarPorId(resultado.insertId, dados.usuario_id);
}

async function atualizar(id, dados, usuario_id) {
  const atual = await buscarPorId(id, usuario_id);
  if (!atual) {
    const erro = new Error('TransaÃ§Ã£o nÃ£o encontrada.');
    erro.status = 404;
    throw erro;
  }

  const tipo = dados.tipo ?? atual.tipo;
  const status = dados.status ?? atual.status;
  const conta_id = dados.conta_id ?? atual.conta_id;

  if (!TIPOS_VALIDOS.includes(tipo)) throw erroValidacao('Tipo de transaÃ§Ã£o invÃ¡lido.');
  if (!STATUS_VALIDOS.includes(status)) throw erroValidacao('Status de transaÃ§Ã£o invÃ¡lido.');
  await validarConta(conta_id, usuario_id);

  const valor = normalizarValor(dados.valor, atual.valor);
  const valorPrevisto = normalizarValor(dados.valor_previsto, atual.valor_previsto);
  const atualizado = {
    tipo,
    titulo: dados.titulo ?? atual.titulo,
    valor,
    valor_previsto: valorPrevisto,
    data: dados.data ?? atual.data,
    categoria: dados.categoria ?? atual.categoria,
    descricao: dados.descricao ?? atual.descricao,
    status,
    conta_id
  };

  await atualizarSaldoConta(atual.conta_id, -impactoSaldo(atual));

  await db.query(
    `UPDATE transacao
        SET tipo = ?, titulo = ?, valor = ?, valor_previsto = ?, data = ?,
            categoria = ?, descricao = ?, status = ?, conta_id = ?
      WHERE id = ? AND usuario_id = ?`,
    [
      atualizado.tipo,
      atualizado.titulo,
      atualizado.valor,
      atualizado.valor_previsto,
      atualizado.data,
      atualizado.categoria,
      atualizado.descricao,
      atualizado.status,
      atualizado.conta_id,
      id,
      usuario_id
    ]
  );

  await atualizarSaldoConta(atualizado.conta_id, impactoSaldo(atualizado));
  return buscarPorId(id, usuario_id);
}

async function excluir(id, usuario_id) {
  const atual = await buscarPorId(id, usuario_id);
  if (!atual) {
    const erro = new Error('TransaÃ§Ã£o nÃ£o encontrada.');
    erro.status = 404;
    throw erro;
  }

  await atualizarSaldoConta(atual.conta_id, -impactoSaldo(atual));
  await db.query('DELETE FROM transacao WHERE id = ? AND usuario_id = ?', [id, usuario_id]);
}

async function resumo(usuario_id, filtros = {}) {
  const { where, params } = montarFiltros(usuario_id, filtros);
  const [rows] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
       COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas,
       COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor_previsto ELSE 0 END), 0) AS receitas_previstas,
       COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor_previsto ELSE 0 END), 0) AS despesas_previstas,
       COUNT(*) AS total
       FROM transacao t
      WHERE ${where}`,
    params
  );

  const row = rows[0] || {};
  return {
    receitas: Number(row.receitas || 0),
    despesas: Number(row.despesas || 0),
    receitas_previstas: Number(row.receitas_previstas || 0),
    despesas_previstas: Number(row.despesas_previstas || 0),
    saldo: Number(row.receitas || 0) - Number(row.despesas || 0),
    total: Number(row.total || 0)
  };
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, excluir, resumo };
