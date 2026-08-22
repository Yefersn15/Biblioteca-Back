const service = require('./editoriales.service');
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
    const { search } = req.query;
    const { rows, count } = await service.listar({ pagination, search });
    return paginatedResponse(res, { rows, count }, pagination);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtener = async (req, res) => {
  try {
    const editorial = await service.obtener(req.params.id);
    return successResponse(res, editorial);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.crear = async (req, res) => {
  try {
    const editorial = await service.crear(req.body);
    return successResponse(res, editorial, 'Editorial creada exitosamente', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.actualizar = async (req, res) => {
  try {
    const editorial = await service.actualizar(req.params.id, req.body);
    return successResponse(res, editorial, 'Editorial actualizada exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id);
    return successResponse(res, null, 'Editorial eliminada exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};
