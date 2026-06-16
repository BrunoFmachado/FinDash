const db = require('../../../db');

function mapear(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    titulo: row.nome,
    valorAlvo: Number(row.valorAlvo || 0),
    valorAtual: Number(row.valorAtual || 0),
    aporteMensal: Number(row.aporteMensal || 0),
    prazo: row.prazo ? row.prazo.toISOString?.().slice(0, 10) || String(row.prazo).slice(0, 10) : ''
  };
}

function erroValidacao(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 400;
  return erro;
}

function validar({ nome, valorAlvo, valorAtual, aporteMensal }) {
  if (!nome) throw erroValidacao('Nome da meta Ã© obrigatÃ³rio.');
  if (Number(valorAlvo) <= 0) throw erroValidacao('Valor alvo deve ser maior que zero.');
  if (Number(valorAtual || 0) < 0) throw erroValidacao('Valor atual nÃ£o pode ser negativo.');
  if (Number(aporteMensal || 0) < 0) throw erroValidacao('Aporte mensal nÃ£o pode ser negativo.');
}

async function listar(usuario_id) {
  const [rows] = await db.query(
    `SELECT id, nome, valorAlvo, valorAtual, aporteMensal, prazo
       FROM meta
      WHERE usuario_id = ?
      ORDER BY id DESC`,
    [usuario_id]
  );

  return rows.map(mapear);
}

async function buscarPorId(id, usuario_id) {
  const [rows] = await db.query(
    `SELECT id, nome, valorAlvo, valorAtual, aporteMensal, prazo
       FROM meta
      WHERE id = ? AND usuario_id = ?`,
    [id, usuario_id]
  );

  return mapear(rows[0]);
}

async function cadastrar(dados) {
  const nome = dados.nome || dados.titulo;
  validar({ ...dados, nome });

  const [resultado] = await db.query(
    `INSERT INTO meta (nome, valorAlvo, valorAtual, aporteMensal, prazo, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      nome,
      Number(dados.valorAlvo || dados.target || 0),
      Number(dados.valorAtual || dados.current || 0),
      Number(dados.aporteMensal || dados.monthlyContribution || 0),
      dados.prazo || dados.deadline || null,
      dados.usuario_id
    ]
  );

  return buscarPorId(resultado.insertId, dados.usuario_id);
}

async function atualizar(id, dados, usuario_id) {
  const atual = await buscarPorId(id, usuario_id);
  if (!atual) {
    const erro = new Error('Meta nÃ£o encontrada.');
    erro.status = 404;
    throw erro;
  }

  const atualizado = {
    nome: dados.nome ?? dados.titulo ?? atual.nome,
    valorAlvo: dados.valorAlvo ?? dados.target ?? atual.valorAlvo,
    valorAtual: dados.valorAtual ?? dados.current ?? atual.valorAtual,
    aporteMensal: dados.aporteMensal ?? dados.monthlyContribution ?? atual.aporteMensal,
    prazo: dados.prazo ?? dados.deadline ?? atual.prazo
  };

  validar(atualizado);

  await db.query(
    `UPDATE meta
        SET nome = ?, valorAlvo = ?, valorAtual = ?, aporteMensal = ?, prazo = ?
      WHERE id = ? AND usuario_id = ?`,
    [
      atualizado.nome,
      Number(atualizado.valorAlvo || 0),
      Number(atualizado.valorAtual || 0),
      Number(atualizado.aporteMensal || 0),
      atualizado.prazo || null,
      id,
      usuario_id
    ]
  );

  return buscarPorId(id, usuario_id);
}

async function excluir(id, usuario_id) {
  const atual = await buscarPorId(id, usuario_id);
  if (!atual) {
    const erro = new Error('Meta nÃ£o encontrada.');
    erro.status = 404;
    throw erro;
  }

  await db.query('DELETE FROM meta WHERE id = ? AND usuario_id = ?', [id, usuario_id]);
}

async function resumo(usuario_id) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(valorAtual), 0) AS atual_total,
            COALESCE(SUM(valorAlvo), 0) AS alvo_total
       FROM meta
      WHERE usuario_id = ?`,
    [usuario_id]
  );

  const row = rows[0] || {};
  return {
    total: Number(row.total || 0),
    atual_total: Number(row.atual_total || 0),
    alvo_total: Number(row.alvo_total || 0)
  };
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, excluir, resumo };
