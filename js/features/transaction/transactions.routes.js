const express = require('express');
const router = express.Router();
const transactionsController = require('./transactions.controller');

router.get('/', transactionsController.listar);
router.get('/export/csv', transactionsController.exportarCsv);
router.get('/:id', transactionsController.buscar);
router.post('/', transactionsController.cadastrar);
router.put('/:id', transactionsController.atualizar);
router.delete('/:id', transactionsController.excluir);

module.exports = router;
