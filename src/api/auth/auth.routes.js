const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const controller = require('./auth.controller');
const {
  validate,
  registroSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyTokenSchema,
  resetPasswordSchema,
} = require('./auth.validator');
const { verifyToken } = require('../../middlewares/auth');

// Limita intentos de login por IP para dificultar ataques de fuerza bruta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos, intenta más tarde' },
});

// Igual para recuperación: limita fuerza bruta sobre el token del enlace.
const recuperacionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos, intenta más tarde' },
});

router.post('/registro', validate(registroSchema), controller.registrar);
router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.get('/perfil', verifyToken, controller.perfil);

router.post('/forgot-password', recuperacionLimiter, validate(forgotPasswordSchema), controller.solicitarRecuperacion);
router.post('/verify-token', recuperacionLimiter, validate(verifyTokenSchema), controller.verificarToken);
router.post('/reset-password', recuperacionLimiter, validate(resetPasswordSchema), controller.restablecerPassword);

module.exports = router;
