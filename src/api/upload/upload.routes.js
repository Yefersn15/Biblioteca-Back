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

// Sin sesión: solo para la foto de perfil en el formulario de registro
// público (todavía no hay token en ese momento). Carpeta fija en "avatares"
// (el cliente no puede elegir otra) y un límite bajo por IP para acotar el
// abuso de un endpoint que cualquiera puede llamar sin autenticarse.
const uploadPublicoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas subidas desde esta conexión, intenta más tarde' },
});

router.post('/', verifyToken, uploadLimiter, uploadMiddleware.single('imagen'), controller.subir);
router.post('/publico/avatar', uploadPublicoLimiter, uploadMiddleware.single('imagen'), controller.subirAvatarPublico);

module.exports = router;
