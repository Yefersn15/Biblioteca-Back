const express = require('express');
const router = express.Router();
const controller = require('./categorias.controller');
const { validate, crearSchema, actualizarSchema } = require('./categorias.validator');
const { verifyToken, optionalAuth, checkRole } = require('../../middlewares/auth');

const soloStaff = [verifyToken, checkRole(['ADMIN', 'BIBLIOTECARIO'])];

// optionalAuth: el público solo ve categorías activas; el staff autenticado
// también ve las inactivas (mismo patrón que usa el módulo de libros).
router.get('/', optionalAuth, controller.listar);
router.get('/:id', optionalAuth, controller.obtener);
router.post('/', ...soloStaff, validate(crearSchema), controller.crear);
router.put('/:id', ...soloStaff, validate(actualizarSchema), controller.actualizar);
router.delete('/:id', ...soloStaff, controller.eliminar);

module.exports = router;
