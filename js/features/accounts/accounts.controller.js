const accountsService = require('./accounts.service');

async function listar(req, res) {
  try {
    const contas = await accountsService.listar(req.usuario.id);
    return res.status(200).json({ contas });
  } catch (err) {
    console.error('[CONTROLLER - listar contas]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function buscar(req, res) {
  try {
    const conta = await accountsService.buscarPorId(req.params.id, req.usuario.id);
    if (!conta) return res.status(404).json({ mensagem: 'Conta não encontrada.' });
    return res.status(200).json({ conta });
  } catch (err) {
    console.error('[CONTROLLER - buscar conta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function cadastrar(req, res) {
  const { nome, tipo, saldo, instituicao } = req.body;

  if (!nome || !tipo) {
    return res.status(400).json({ mensagem: 'Nome e tipo são obrigatórios.' });
  }

  try {
    const novaConta = await accountsService.cadastrar({
      nome,
      tipo,
      saldo: saldo || 0,
      instituicao,
      usuario_id: req.usuario.id
    });

    return res.status(201).json({
      mensagem: 'Conta cadastrada com sucesso.',
      conta: novaConta
    });
  } catch (err) {
    console.error('[CONTROLLER - cadastrar conta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function atualizar(req, res) {
  const { nome, tipo, saldo, instituicao } = req.body;

  try {
    const contaAtualizada = await accountsService.atualizar(
      req.params.id,
      { nome, tipo, saldo, instituicao },

      req.usuario.id
    );

    return res.status(200).json({
      mensagem: 'Conta atualizada com sucesso.',
      conta: contaAtualizada
    });
  } catch (err) {
    console.error('[CONTROLLER - atualizar conta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function excluir(req, res) {
  try {
    await accountsService.excluir(req.params.id, req.usuario.id);
    return res.status(200).json({ mensagem: 'Conta excluída com sucesso.' });
  } catch (err) {
    console.error('[CONTROLLER - excluir conta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

module.exports = { listar, buscar, cadastrar, atualizar, excluir };
