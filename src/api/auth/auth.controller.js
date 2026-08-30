const service = require('./auth.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

const handleError = (res, error) => {
  console.error(error);
  const statusCode = error.isAppError ? error.statusCode : 500;
  return errorResponse(res, error.message, statusCode);
};

exports.registrar = async (req, res) => {
  try {
    const { usuario, token } = await service.registrar(req.body);
    return successResponse(res, { usuario, token }, 'Cuenta creada exitosamente', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { usuario, token } = await service.login(req.body);
    return successResponse(res, { usuario, token }, 'Sesión iniciada');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.perfil = async (req, res) => {
  try {
    const usuario = await service.obtenerPerfil(req.user.id);
    return successResponse(res, usuario);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.solicitarRecuperacion = async (req, res) => {
  try {
    await service.solicitarRecuperacion(req.body.email);
    // Mismo mensaje exista o no la cuenta: no revela si el correo está registrado.
    return successResponse(res, null, 'Si el correo existe, te enviamos un enlace de recuperación');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.verificarToken = async (req, res) => {
  try {
    await service.verificarToken(req.body.email, req.body.token);
    return successResponse(res, null, 'Enlace válido');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.restablecerPassword = async (req, res) => {
  try {
    await service.restablecerPassword(req.body.email, req.body.token, req.body.password);
    return successResponse(res, null, 'Contraseña actualizada correctamente');
  } catch (error) {
    return handleError(res, error);
  }
};
