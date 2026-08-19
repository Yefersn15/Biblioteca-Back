const { errorResponse } = require('../utils/helpers');

exports.notFoundHandler = (req, res) => errorResponse(res, `Ruta no encontrada: ${req.originalUrl}`, 404);

// eslint-disable-next-line no-unused-vars
exports.globalErrorHandler = (error, req, res, next) => {
  console.error(error);

  if (error.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, error.errors?.[0]?.message || 'Registro duplicado', 409);
  }
  if (error.name === 'SequelizeValidationError') {
    return errorResponse(res, error.errors?.[0]?.message || 'Datos inválidos', 400);
  }
  if (error.name === 'MulterError' || /debe ser una imagen/.test(error.message || '')) {
    const mensaje = error.code === 'LIMIT_FILE_SIZE' ? 'La imagen no puede superar 8MB' : error.message;
    return errorResponse(res, mensaje, 400);
  }

  const statusCode = error.isAppError ? error.statusCode : 500;
  const message = error.isAppError ? error.message : 'Error interno del servidor';
  return errorResponse(res, message, statusCode);
};
