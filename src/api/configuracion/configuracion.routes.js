const express = require('express');
const router = express.Router();
const controller = require('./configuracion.controller');
const { validate, actualizarSchema } = require('./configuracion.validator');
const { verifyToken, checkRole } = require('../../middlewares/auth');

router.get('/', controller.obtener); // público: Home/Header/Footer lo necesitan sin sesión
router.put('/', verifyToken, checkRole(['ADMIN']), validate(actualizarSchema), controller.actualizar);

module.exports = router;
