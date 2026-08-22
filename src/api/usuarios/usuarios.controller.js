const service = require('./usuarios.service');
const { successResponse, errorResponse } = require('../../utils/helpers');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

const handleError = (res, error) => {
  console.error(error);
  const statusCode = error.isAppError ? error.statusCode : 500;
  return errorResponse(res, error.message, statusCode);
};

exports.listar = async (req, res) => {
  try {
    const pagination = getPagination(req);
    const { rows, count } = await service.listar({
      pagination,
      search: req.query.search,
      rol: req.query.rol,
      estado: req.query.estado,
    });
    return paginatedResponse(res, { rows, count }, pagination);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtener = async (req, res) => {
  try {
    const esStaff = ['ADMIN', 'BIBLIOTECARIO'].includes(req.user.rol);
    if (!esStaff && req.user.id !== Number(req.params.id)) {
      return errorResponse(res, 'No tienes permisos para esta acción', 403);
    }
    const usuario = await service.obtener(req.params.id);
    return successResponse(res, usuario);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.crear = async (req, res) => {
  try {
    const usuario = await service.crear(req.body);
    return successResponse(res, usuario, 'Usuario creado exitosamente', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.actualizar = async (req, res) => {
  try {
    const usuario = await service.actualizar(req.params.id, req.body, req.user);
    return successResponse(res, usuario, 'Usuario actualizado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id);
    return successResponse(res, null, 'Usuario deshabilitado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};
