const db = require('../../../db');

const STATUS_VALIDOS = ['pendente', 'pago'];

function mapear(row) {
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.descricao,
    descricao: row.descricao,
    valor: Number(row.valor || 0),
    dataVencimento: row.dataVencimento ? row.dataVencimento.toISOString?.().slice(0, 10) || String(row.dataVencimento).slice(0, 10) : '',
    dataPagamento: row.dataPagamento ? row.dataPagamento.toISOString?.().slice(0, 10) || String(row.dataPagamento).slice(0, 10) : null,
    status: row.status,
    pago: row.status === 'pago'
  };
}

function erroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function validar({ descricao, valor, dataVencimento, status }) {
  if (!descricao) throw erroValidacao('TÃ­tulo Ã© obrigatÃ³rio.');
  if (!dataVencimento) throw erroValidacao('Data de vencimento Ã© obrigatÃ³ria.');
  if (Number(valor) < 0) throw erroValidacao('Valor nÃ£o pode ser negativo.');
  if (status && !STATUS_VALIDOS.includes(status)) throw erroValidacao('Status invÃ¡lido.');
}

async function listar(usuario_id, filtros = {}) {
  const where = ['usuario_id = ?'];
  const params = [usuario_id];

  if (filtros.status && filtros.status !== 'todos') {
    where.push('status = ?');
    params.push(filtros.status);
  }

  const [rows] = await db.query(
    `SELECT id, descricao, valor, dataVencimento, status, dataPagamento
       FROM vencimento
      WHERE ${where.join(' AND ')}
      ORDER BY dataVencimento ASC, id DESC`,
    params
  );

  return rows.map(mapear);
}

async function buscarPorId(id, usuario_id) {
  const [rows] = await db.query(
    `SELECT id, descricao, valor, dataVencimento, status, dataPagamento
       FROM vencimento
      WHERE id = ? AND usuario_id = ?`,
    [id, usuario_id]
  );

  return mapear(rows[0]);
}

async function cadastrar(dados) {
  const status = dados.status || 'pendente';
  const descricao = dados.descricao || dados.titulo;
  validar({ ...dados, descricao, status });

  const [resultado] = await db.query(
    `INSERT INTO vencimento (descricao, valor, dataVencimento, status, dataPagamento, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      descricao,
      Number(dados.valor || 0),
      dados.dataVencimento,
      status,
      status === 'pago' ? (dados.dataPagamento || new Date().toISOString().slice(0, 10)) : null,
      dados.usuario_id
    ]
  );

  return buscarPorId(resultado.insertId, dados.usuario_id);
}

async function atualizar(id, dados, usuario_id) {
  const atual = await buscarPorId(id, usuario_id);
  if (!atual) {
    const erro = new Error('Vencimento nÃ£o encontrado.');
    erro.status = 404;
    throw erro;
  }

  const status = dados.status ?? atual.status;
  const descricao = dados.descricao ?? dados.titulo ?? atual.descricao;
  const valor = dados.valor ?? atual.valor;
  const dataVencimento = dados.dataVencimento ?? atual.dataVencimento;
  const dataPagamento = status === 'pago'
    ? (dados.dataPagamento || atual.dataPagamento || new Date().toISOString().slice(0, 10))
    : null;

  validar({ descricao, valor, dataVencimento, status });

  await db.query(
    `UPDATE vencimento
        SET descricao = ?, valor = ?, dataVencimento = ?, status = ?, dataPagamento = ?
      WHERE id = ? AND usuario_id = ?`,
    [descricao, Number(valor || 0), dataVencimento, status, dataPagamento, id, usuario_id]
  );

  return buscarPorId(id, usuario_id);
}

async function alterarStatus(id, status, usuario_id) {
  return atualizar(id, { status }, usuario_id);
}

async function excluir(id, usuario_id) {
  const atual = await buscarPorId(id, usuario_id);
  if (!atual) {
    const erro = new Error('Vencimento nÃ£o encontrado.');
    erro.status = 404;
    throw erro;
  }

  await db.query('DELETE FROM vencimento WHERE id = ? AND usuario_id = ?', [id, usuario_id]);
}

async function resumo(usuario_id) {
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

  const row = rows[0] || {};
  return {
    pendente_total: Number(row.pendente_total || 0),
    pago_total: Number(row.pago_total || 0),
    pendente_count: Number(row.pendente_count || 0),
    pago_count: Number(row.pago_count || 0)
  };
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, alterarStatus, excluir, resumo };
