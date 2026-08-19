const express = require('express');
const router = express.Router();
const controller = require('./usuarios.controller');
const { validate, crearSchema, actualizarSchema } = require('./usuarios.validator');
const { verifyToken, checkRole } = require('../../middlewares/auth');

router.use(verifyToken);

router.get('/', checkRole(['ADMIN', 'BIBLIOTECARIO']), controller.listar);
router.get('/:id', controller.obtener); // self o staff, verificado en el controller
router.post('/', checkRole(['ADMIN']), validate(crearSchema), controller.crear);
router.put('/:id', validate(actualizarSchema), controller.actualizar); // self o ADMIN, verificado en el service
router.delete('/:id', checkRole(['ADMIN']), controller.eliminar);

module.exports = router;
