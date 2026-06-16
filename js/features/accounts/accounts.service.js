const db = require('../../../db');

const TIPOS_VALIDOS = [
  'conta_corrente',
  'conta_digital',
  'cartao_credito',
  'investimento',
  'carteira'
];

async function listar(usuario_id) {
  const [rows] = await db.query(
    'SELECT id, nome, tipo, saldo, instituicao FROM conta WHERE usuario_id = ? ORDER BY id DESC',
    [usuario_id]
  );
  return rows;
}

async function buscarPorId(id, usuario_id) {
  const [rows] = await db.query(
    'SELECT id, nome, tipo, saldo, instituicao FROM conta WHERE id = ? AND usuario_id = ?',
    [id, usuario_id]
  );
  return rows[0] || null;
}

async function cadastrar({ nome, tipo, saldo = 0, instituicao, usuario_id }) {
  if (!TIPOS_VALIDOS.includes(tipo)) {
    const erro = new Error('Tipo de conta inválido.');
    erro.status = 400;
    throw erro;
  }

  const [resultado] = await db.query(
    'INSERT INTO conta (nome, tipo, saldo, instituicao, usuario_id) VALUES (?, ?, ?, ?, ?)',
    [nome, tipo, saldo, instituicao, usuario_id]
  );

  return { id: resultado.insertId, nome, tipo, saldo, instituicao };
}

async function atualizar(id, { nome, tipo, saldo, instituicao }, usuario_id) {
  const conta = await buscarPorId(id, usuario_id);

  if (!conta) {
    const erro = new Error('Conta não encontrada.');
    erro.status = 404;
    throw erro;
  }

  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    const erro = new Error('Tipo de conta inválido.');
    erro.status = 400;
    throw erro;
  }

  const novoNome  = nome  ?? conta.nome;
  const novoTipo  = tipo  ?? conta.tipo;
  const novoSaldo = saldo ?? conta.saldo;
  const novaInstituicao = instituicao ?? conta.instituicao;
  await db.query(
    'UPDATE conta SET nome = ?, tipo = ?, saldo = ?, instituicao = ? WHERE id = ? AND usuario_id = ?',
    [novoNome, novoTipo, novoSaldo, novaInstituicao, id, usuario_id]
  );

  return { id: Number(id), nome: novoNome, tipo: novoTipo, saldo: novoSaldo, instituicao: novaInstituicao };
}

async function excluir(id, usuario_id) {
  const conta = await buscarPorId(id, usuario_id);

  if (!conta) {
    const erro = new Error('Conta não encontrada.');
    erro.status = 404;
    throw erro;
  }

  const [transacoes] = await db.query(
    'SELECT id FROM transacao WHERE conta_id = ? AND usuario_id = ? LIMIT 1',
    [id, usuario_id]
  );

  if (transacoes.length > 0) {
    const erro = new Error('Não é possível excluir uma conta que possui transações vinculadas.');
    erro.status = 409;
    throw erro;
  }

  await db.query('DELETE FROM conta WHERE id = ? AND usuario_id = ?', [id, usuario_id]);
}

module.exports = { listar, buscarPorId, cadastrar, atualizar, excluir };
