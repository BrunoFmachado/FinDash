const jwt         = require('jsonwebtoken');
const userService = require('./user.service');

async function cadastrar(req, res) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: 'Preencha todos os campos.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ mensagem: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    const novoUsuario = await userService.cadastrar({ nome, email, senha });
    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
      usuario: novoUsuario
    });
  } catch (err) {
    console.error('[CONTROLLER - cadastrar]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Informe e-mail e senha.' });
  }

  try {
    const usuario = await userService.autenticar({ email, senha });

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario
    });
  } catch (err) {
    console.error('[CONTROLLER - login]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function buscar(req, res) {
  try {
    const usuario = await userService.buscarPorId(req.params.id);
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    return res.status(200).json({ usuario });
  } catch (err) {
    console.error('[CONTROLLER - buscar]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function atualizar(req, res) {
  const { nome, email, senha } = req.body;

  try {
    const usuarioAtualizado = await userService.atualizar(
      req.params.id,
      { nome, email, senha }
    );

    return res.status(200).json({
      mensagem: 'Usuário atualizado com sucesso.',
      usuario: usuarioAtualizado
    });
  } catch (err) {
    console.error('[CONTROLLER - atualizar]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function excluir(req, res) {
  const { senha } = req.body;

  if (!senha) {
    return res.status(400).json({ mensagem: 'Informe a senha para confirmar.' });
  }

  try {
    await userService.excluir(req.params.id, senha);
    return res.status(200).json({ mensagem: 'Usuário excluído com sucesso.' });
  } catch (err) {
    console.error('[CONTROLLER - excluir]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

module.exports = { cadastrar, login, buscar, atualizar, excluir };