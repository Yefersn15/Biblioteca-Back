const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { errorResponse } = require('../utils/helpers');

const readToken = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' ? token : null;
};

// Rutas protegidas: exige un JWT válido y coloca al usuario en req.user.
exports.verifyToken = (req, res, next) => {
  const token = readToken(req);
  if (!token) return errorResponse(res, 'Se requiere autenticación', 401);

  try {
    req.user = jwt.verify(token, config.jwt.secret);
    return next();
  } catch {
    return errorResponse(res, 'Token inválido o expirado', 401);
  }
};

// Rutas públicas que cambian de comportamiento si hay sesión (p. ej. staff
// viendo contenido inactivo): nunca rechaza la petición por token ausente
// o inválido, solo deja req.user sin definir en ese caso.
exports.optionalAuth = (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwt.secret);
    } catch {
      // Token inválido en ruta pública: se ignora, sigue como anónimo.
    }
  }
  next();
};

exports.checkRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return errorResponse(res, 'No tienes permisos para esta acción', 403);
  }
  return next();
};
