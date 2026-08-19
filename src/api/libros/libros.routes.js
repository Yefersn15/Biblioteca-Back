const express = require('express');
const router = express.Router();
const controller = require('./libros.controller');
const { validate, crearSchema, actualizarSchema } = require('./libros.validator');
const { verifyToken, optionalAuth, checkRole } = require('../../middlewares/auth');

const soloStaff = [verifyToken, checkRole(['ADMIN', 'BIBLIOTECARIO'])];

// optionalAuth: el público solo ve libros activos; el staff autenticado
// también ve los inactivos (mismo patrón que ya usa el módulo de banners).
router.get('/', optionalAuth, controller.listar);
router.get('/populares', controller.populares); // antes de '/:id' para que no se confunda con un id
router.get('/:id', optionalAuth, controller.obtener);
router.post('/', ...soloStaff, validate(crearSchema), controller.crear);
router.put('/:id', ...soloStaff, validate(actualizarSchema), controller.actualizar);
router.delete('/:id', ...soloStaff, controller.eliminar);

module.exports = router;
