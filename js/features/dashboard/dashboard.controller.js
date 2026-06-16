const dashboardService = require('./dashboard.service');

async function resumo(req, res) {
  try {
    const dados = await dashboardService.resumo(req.usuario.id);
    return res.status(200).json(dados);
  } catch (err) {
    console.error('[CONTROLLER - dashboard]', err.message);
    return res.status(err.status || 500).json({ mensagem: err.message });
  }
}

module.exports = { resumo };
