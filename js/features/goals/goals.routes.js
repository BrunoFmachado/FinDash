const express = require('express');
const router = express.Router();
const goalsController = require('./goals.controller');

router.get('/', goalsController.listar);
router.get('/:id', goalsController.buscar);
router.post('/', goalsController.cadastrar);
router.put('/:id', goalsController.atualizar);
router.delete('/:id', goalsController.excluir);

module.exports = router;
