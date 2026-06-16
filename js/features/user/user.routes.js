const express        = require('express');
const router         = express.Router();
const userController = require('./user.controller');
const autenticar     = require('../../middleware/auth');

router.post('/',       userController.cadastrar);
router.post('/login',  userController.login);
router.get('/:id',     autenticar, userController.buscar);
router.put('/:id',     autenticar, userController.atualizar);
router.delete('/:id',  autenticar, userController.excluir);

module.exports = router;