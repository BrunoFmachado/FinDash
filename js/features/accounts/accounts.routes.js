const express            = require('express');
const router             = express.Router();
const accountsController = require('./accounts.controller');

router.get('/',    accountsController.listar);
router.get('/:id', accountsController.buscar);
router.post('/',   accountsController.cadastrar);
router.put('/:id', accountsController.atualizar);
router.delete('/:id', accountsController.excluir);

module.exports = router;
