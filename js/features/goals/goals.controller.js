const goalsService = require('./goals.service');

async function listar(req, res) {
  try {
    const metas = await goalsService.listar(req.usuario.id);
    const resumo = await goalsService.resumo(req.usuario.id);
    return res.status(200).json({ metas, resumo });
  } catch (err) {
    console.error('[CONTROLLER - listar metas]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function buscar(req, res) {
  try {
    const meta = await goalsService.buscarPorId(req.params.id, req.usuario.id);
    if (!meta) return res.status(404).json({ mensagem: 'Meta nÃ£o encontrada.' });
    return res.status(200).json({ meta });
  } catch (err) {
    console.error('[CONTROLLER - buscar meta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function cadastrar(req, res) {
  try {
    const meta = await goalsService.cadastrar({
      ...req.body,
      usuario_id: req.usuario.id
    });

    return res.status(201).json({
      mensagem: 'Meta cadastrada com sucesso.',
      meta
    });
  } catch (err) {
    console.error('[CONTROLLER - cadastrar meta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const meta = await goalsService.atualizar(req.params.id, req.body, req.usuario.id);
    return res.status(200).json({
      mensagem: 'Meta atualizada com sucesso.',
      meta
    });
  } catch (err) {
    console.error('[CONTROLLER - atualizar meta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function excluir(req, res) {
  try {
    await goalsService.excluir(req.params.id, req.usuario.id);
    return res.status(200).json({ mensagem: 'Meta excluÃ­da com sucesso.' });
  } catch (err) {
    console.error('[CONTROLLER - excluir meta]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

module.exports = { listar, buscar, cadastrar, atualizar, excluir };
