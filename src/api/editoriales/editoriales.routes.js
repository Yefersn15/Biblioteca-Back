const express = require('express');
const router = express.Router();
const controller = require('./editoriales.controller');
const { validate, crearSchema, actualizarSchema } = require('./editoriales.validator');
const { verifyToken, optionalAuth, checkRole } = require('../../middlewares/auth');

const soloStaff = [verifyToken, checkRole(['ADMIN', 'BIBLIOTECARIO'])];

// optionalAuth: el público solo ve editoriales activas; el staff autenticado
// también ve las inactivas (mismo patrón que usa el módulo de libros).
router.get('/', optionalAuth, controller.listar);
router.get('/:id', optionalAuth, controller.obtener);
router.post('/', ...soloStaff, validate(crearSchema), controller.crear);
router.put('/:id', ...soloStaff, validate(actualizarSchema), controller.actualizar);
router.delete('/:id', ...soloStaff, controller.eliminar);

module.exports = router;
