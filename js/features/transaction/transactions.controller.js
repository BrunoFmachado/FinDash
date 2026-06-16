const transactionsService = require('./transactions.service');

async function listar(req, res) {
  try {
    const transacoes = await transactionsService.listar(req.usuario.id, req.query);
    const resumo = await transactionsService.resumo(req.usuario.id, req.query);
    return res.status(200).json({ transacoes, resumo });
  } catch (err) {
    console.error('[CONTROLLER - listar transaÃ§Ãµes]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function buscar(req, res) {
  try {
    const transacao = await transactionsService.buscarPorId(req.params.id, req.usuario.id);
    if (!transacao) return res.status(404).json({ mensagem: 'TransaÃ§Ã£o nÃ£o encontrada.' });
    return res.status(200).json({ transacao });
  } catch (err) {
    console.error('[CONTROLLER - buscar transaÃ§Ã£o]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function cadastrar(req, res) {
  try {
    const transacao = await transactionsService.cadastrar({
      ...req.body,
      usuario_id: req.usuario.id
    });

    return res.status(201).json({
      mensagem: 'TransaÃ§Ã£o cadastrada com sucesso.',
      transacao
    });
  } catch (err) {
    console.error('[CONTROLLER - cadastrar transaÃ§Ã£o]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const transacao = await transactionsService.atualizar(
      req.params.id,
      req.body,
      req.usuario.id
    );

    return res.status(200).json({
      mensagem: 'TransaÃ§Ã£o atualizada com sucesso.',
      transacao
    });
  } catch (err) {
    console.error('[CONTROLLER - atualizar transaÃ§Ã£o]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function excluir(req, res) {
  try {
    await transactionsService.excluir(req.params.id, req.usuario.id);
    return res.status(200).json({ mensagem: 'TransaÃ§Ã£o excluÃ­da com sucesso.' });
  } catch (err) {
    console.error('[CONTROLLER - excluir transaÃ§Ã£o]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

async function exportarCsv(req, res) {
  try {
    const transacoes = await transactionsService.listar(req.usuario.id, req.query);
    const linhas = [
      ['Tipo', 'Titulo', 'Categoria', 'Conta', 'Data', 'Status', 'Previsto', 'Realizado', 'Descricao'],
      ...transacoes.map((item) => [
        item.tipo,
        item.titulo,
        item.categoria || '',
        item.conta_nome || '',
        item.data,
        item.status,
        item.valor_previsto,
        item.valor,
        item.descricao || ''
      ])
    ];

    const csv = linhas.map((linha) => (
      linha.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(';')
    )).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="findash-financeiro.csv"');
    return res.status(200).send(`\uFEFF${csv}`);
  } catch (err) {
    console.error('[CONTROLLER - exportar transaÃ§Ãµes]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

module.exports = { listar, buscar, cadastrar, atualizar, excluir, exportarCsv };
