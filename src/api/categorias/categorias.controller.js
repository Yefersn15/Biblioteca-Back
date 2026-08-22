const service = require('./categorias.service');
const { successResponse, errorResponse } = require('../../utils/helpers');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

const handleError = (res, error) => {
  console.error(error);
  const statusCode = error.isAppError ? error.statusCode : 500;
  return errorResponse(res, error.message, statusCode);
};

const esStaff = (req) => req.user && ['ADMIN', 'BIBLIOTECARIO'].includes(req.user.rol);

exports.listar = async (req, res) => {
  try {
    const pagination = getPagination(req);
    const { search, estado } = req.query;
    const { rows, count } = await service.listar({ isStaff: esStaff(req), pagination, search, estado });
    return paginatedResponse(res, { rows, count }, pagination);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtener = async (req, res) => {
  try {
    const categoria = await service.obtener(req.params.id, esStaff(req));
    return successResponse(res, categoria);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.crear = async (req, res) => {
  try {
    const categoria = await service.crear(req.body);
    return successResponse(res, categoria, 'Categoría creada exitosamente', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.actualizar = async (req, res) => {
  try {
    const categoria = await service.actualizar(req.params.id, req.body);
    return successResponse(res, categoria, 'Categoría actualizada exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id);
    return successResponse(res, null, 'Categoría eliminada exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};
