const service = require('./prestamos.service');
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
      requester: req.user,
      pagination,
      estado: req.query.estado,
      vencidos: req.query.vencidos === 'true',
      search: req.query.search,
    });
    return paginatedResponse(res, { rows, count }, pagination);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtener = async (req, res) => {
  try {
    const prestamo = await service.obtener(req.params.id, req.user);
    return successResponse(res, prestamo);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.solicitar = async (req, res) => {
  try {
    const prestamo = await service.solicitar(req.user.id, req.body);
    return successResponse(res, prestamo, 'Préstamo solicitado, queda pendiente de aprobación', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.aprobar = async (req, res) => {
  try {
    const prestamo = await service.aprobar(req.params.id, req.user.id, req.body.fechaDevolucionEstimada);
    return successResponse(res, prestamo, 'Préstamo aprobado');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.rechazar = async (req, res) => {
  try {
    const prestamo = await service.rechazar(req.params.id, req.user.id, req.body.observaciones);
    return successResponse(res, prestamo, 'Préstamo rechazado');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.devolver = async (req, res) => {
  try {
    const prestamo = await service.devolver(req.params.id, req.user.id, req.body.observaciones);
    return successResponse(res, prestamo, 'Devolución registrada');
  } catch (error) {
    return handleError(res, error);
  }
};
