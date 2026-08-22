const express = require('express');
const router = express.Router();
const controller = require('./autores.controller');
const { validate, crearSchema, actualizarSchema } = require('./autores.validator');
const { verifyToken, optionalAuth, checkRole } = require('../../middlewares/auth');

const soloStaff = [verifyToken, checkRole(['ADMIN', 'BIBLIOTECARIO'])];

// optionalAuth: el público solo ve autores activos; el staff autenticado
// también ve los inactivos (mismo patrón que usa el módulo de libros).
router.get('/', optionalAuth, controller.listar);
router.get('/:id', optionalAuth, controller.obtener);
router.post('/', ...soloStaff, validate(crearSchema), controller.crear);
router.put('/:id', ...soloStaff, validate(actualizarSchema), controller.actualizar);
router.delete('/:id', ...soloStaff, controller.eliminar);

module.exports = router;
