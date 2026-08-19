const service = require('./libros.service');
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
    const { search, autorId, categoriaId, editorialId, tipo, sort, agotados } = req.query;
    const { rows, count } = await service.listar({
      isStaff: esStaff(req),
      pagination,
      search,
      autorId,
      categoriaId,
      editorialId,
      tipo,
      sort,
      agotados: agotados === 'true',
    });
    return paginatedResponse(res, { rows, count }, pagination);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.populares = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 6;
    const libros = await service.listarPopulares(limit);
    return successResponse(res, libros);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtener = async (req, res) => {
  try {
    const libro = await service.obtener(req.params.id, esStaff(req));
    return successResponse(res, libro);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.crear = async (req, res) => {
  try {
    const libro = await service.crear(req.body);
    return successResponse(res, libro, 'Libro creado exitosamente', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.actualizar = async (req, res) => {
  try {
    const libro = await service.actualizar(req.params.id, req.body);
    return successResponse(res, libro, 'Libro actualizado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id);
    return successResponse(res, null, 'Libro eliminado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};
