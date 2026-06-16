const express = require('express');
const router = express.Router();
const billsController = require('./bills.controller');

router.get('/', billsController.listar);
router.get('/:id', billsController.buscar);
router.post('/', billsController.cadastrar);
router.put('/:id', billsController.atualizar);
router.patch('/:id/status', billsController.alterarStatus);
router.delete('/:id', billsController.excluir);

module.exports = router;
