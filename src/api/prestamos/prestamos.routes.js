const express = require('express');
const router = express.Router();
const controller = require('./prestamos.controller');
const { validate, solicitarSchema, gestionarSchema, aprobarSchema, registrarPresencialSchema } = require('./prestamos.validator');
const { verifyToken, checkRole } = require('../../middlewares/auth');

const soloStaff = checkRole(['ADMIN', 'BIBLIOTECARIO']);

router.use(verifyToken);

router.get('/', controller.listar); // staff ve todos, usuario ve los propios (filtrado en el service)
router.get('/:id', controller.obtener); // self o staff, verificado en el service
router.post('/', validate(solicitarSchema), controller.solicitar);
router.post('/presencial', soloStaff, validate(registrarPresencialSchema), controller.registrarPresencial);
router.put('/:id/aprobar', soloStaff, validate(aprobarSchema), controller.aprobar);
router.put('/:id/rechazar', soloStaff, validate(gestionarSchema), controller.rechazar);
router.put('/:id/devolver', soloStaff, validate(gestionarSchema), controller.devolver);

module.exports = router;
