const billsService = require('./bills.service');

async function listar(req, res) {
  try {
    const vencimentos = await billsService.listar(req.usuario.id, req.query);
    const resumo = await billsService.resumo(req.usuario.id);
    return res.status(200).json({ vencimentos, resumo });
  } catch (err) {
    console.error('[CONTROLLER - listar vencimentos]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function buscar(req, res) {
  try {
    const vencimento = await billsService.buscarPorId(req.params.id, req.usuario.id);
    if (!vencimento) return res.status(404).json({ mensagem: 'Vencimento nÃ£o encontrado.' });
    return res.status(200).json({ vencimento });
  } catch (err) {
    console.error('[CONTROLLER - buscar vencimento]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function cadastrar(req, res) {
  try {
    const vencimento = await billsService.cadastrar({
      ...req.body,
      usuario_id: req.usuario.id
    });

    return res.status(201).json({
      mensagem: 'Vencimento cadastrado com sucesso.',
      vencimento
    });
  } catch (err) {
    console.error('[CONTROLLER - cadastrar vencimento]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const vencimento = await billsService.atualizar(req.params.id, req.body, req.usuario.id);
    return res.status(200).json({
      mensagem: 'Vencimento atualizado com sucesso.',
      vencimento
    });
  } catch (err) {
    console.error('[CONTROLLER - atualizar vencimento]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function alterarStatus(req, res) {
  try {
    const vencimento = await billsService.alterarStatus(req.params.id, req.body.status, req.usuario.id);
    return res.status(200).json({
      mensagem: 'Status atualizado com sucesso.',
      vencimento
    });
  } catch (err) {
    console.error('[CONTROLLER - status vencimento]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function excluir(req, res) {
  try {
    await billsService.excluir(req.params.id, req.usuario.id);
    return res.status(200).json({ mensagem: 'Vencimento excluÃ­do com sucesso.' });
  } catch (err) {
    console.error('[CONTROLLER - excluir vencimento]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

module.exports = { listar, buscar, cadastrar, atualizar, alterarStatus, excluir };
