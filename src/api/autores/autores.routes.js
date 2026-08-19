const express = require('express');
const router = express.Router();
const controller = require('./autores.controller');
const { validate, crearSchema, actualizarSchema } = require('./autores.validator');
const { verifyToken, checkRole } = require('../../middlewares/auth');

const soloStaff = [verifyToken, checkRole(['ADMIN', 'BIBLIOTECARIO'])];

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', ...soloStaff, validate(crearSchema), controller.crear);
router.put('/:id', ...soloStaff, validate(actualizarSchema), controller.actualizar);
router.delete('/:id', ...soloStaff, controller.eliminar);

module.exports = router;
