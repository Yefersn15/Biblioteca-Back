const service = require('./autores.service');
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
    const { rows, count } = await service.listar({ pagination });
    return paginatedResponse(res, { rows, count }, pagination);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtener = async (req, res) => {
  try {
    const autor = await service.obtener(req.params.id);
    return successResponse(res, autor);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.crear = async (req, res) => {
  try {
    const autor = await service.crear(req.body);
    return successResponse(res, autor, 'Autor creado exitosamente', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.actualizar = async (req, res) => {
  try {
    const autor = await service.actualizar(req.params.id, req.body);
    return successResponse(res, autor, 'Autor actualizado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id);
    return successResponse(res, null, 'Autor eliminado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};
