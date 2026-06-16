const bcrypt = require('bcryptjs');
const db     = require('../../../db');

async function buscarPorEmail(email) {
  const [rows] = await db.query(
    'SELECT id, nome, email, senha FROM usuarios WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const [rows] = await db.query(
    'SELECT id, nome, email FROM usuarios WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function cadastrar({ nome, email, senha }) {
  const existente = await buscarPorEmail(email);
  if (existente) {
    const erro = new Error('E-mail já cadastrado.');
    erro.status = 409;
    throw erro;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const [resultado] = await db.query(
    'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
    [nome, email, senhaHash]
  );

  return { id: resultado.insertId, nome, email };
}

async function autenticar({ email, senha }) {
  const usuario = await buscarPorEmail(email);

  if (!usuario) {
    const erro = new Error('E-mail ou senha incorretos.');
    erro.status = 401;
    throw erro;
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) {
    const erro = new Error('E-mail ou senha incorretos.');
    erro.status = 401;
    throw erro;
  }

  const { senha: _, ...dadosPublicos } = usuario;
  return dadosPublicos;
}

async function atualizar(id, { nome, email, senha }) {
  const usuario = await buscarPorId(id);

  if (!usuario) {
    const erro = new Error('Usuário não encontrado.');
    erro.status = 404;
    throw erro;
  }

  if (email && email !== usuario.email) {
    const existente = await buscarPorEmail(email);
    if (existente) {
      const erro = new Error('E-mail já cadastrado.');
      erro.status = 409;
      throw erro;
    }
  }

  const novoNome  = nome  ?? usuario.nome;
  const novoEmail = email ?? usuario.email;

  let senhaHash = undefined;
  if (senha) {
    if (senha.length < 6) {
      const erro = new Error('A senha deve ter no mínimo 6 caracteres.');
      erro.status = 400;
      throw erro;
    }
    senhaHash = await bcrypt.hash(senha, 10);
  }

  if (senhaHash) {
    await db.query(
      'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?',
      [novoNome, novoEmail, senhaHash, id]
    );
  } else {
    await db.query(
      'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
      [novoNome, novoEmail, id]
    );
  }

  return { id: Number(id), nome: novoNome, email: novoEmail };
}

async function excluir(id, senha) {
  const [rows] = await db.query(
    'SELECT id, senha FROM usuarios WHERE id = ?',
    [id]
  );
  const usuario = rows[0];

  if (!usuario) {
    const erro = new Error('Usuário não encontrado.');
    erro.status = 404;
    throw erro;
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) {
    const erro = new Error('Senha incorreta.');
    erro.status = 401;
    throw erro;
  }

  await db.query('DELETE FROM receita WHERE transacao_id IN (SELECT id FROM transacao WHERE usuario_id = ?)', [id]);
  await db.query('DELETE FROM despesa WHERE transacao_id IN (SELECT id FROM transacao WHERE usuario_id = ?)', [id]);
  await db.query('DELETE FROM transacao WHERE usuario_id = ?', [id]);
  await db.query('DELETE FROM vencimento WHERE usuario_id = ?', [id]);
  await db.query('DELETE FROM meta WHERE usuario_id = ?', [id]);
  await db.query('DELETE FROM conta WHERE usuario_id = ?', [id]);
  await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
}

module.exports = { buscarPorId, cadastrar, autenticar, atualizar, excluir };
