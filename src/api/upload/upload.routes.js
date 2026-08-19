const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const controller = require('./upload.controller');
const uploadMiddleware = require('./upload.middleware');
const { verifyToken } = require('../../middlewares/auth');

// Cualquier usuario autenticado puede subir (p. ej. su propio avatar);
// las páginas de administración ya restringen quién puede crear/editar el
// recurso que termina usando la URL resultante.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas subidas, intenta más tarde' },
});

router.post('/', verifyToken, uploadLimiter, uploadMiddleware.single('imagen'), controller.subir);

module.exports = router;
