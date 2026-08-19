const express = require('express');
const router = express.Router();
const controller = require('./estadisticas.controller');
const { verifyToken, checkRole } = require('../../middlewares/auth');

router.get('/resumen', verifyToken, checkRole(['ADMIN', 'BIBLIOTECARIO']), controller.resumen);

module.exports = router;
