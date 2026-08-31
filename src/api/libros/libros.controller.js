const service = require('./libros.service');
const { successResponse, errorResponse } = require('../../utils/helpers');
const { getPagination, paginatedResponse } = require('../../utils/pagination');
const { esAdminPrincipal, ocultarCreadoPor } = require('../../utils/ownership');

const handleError = (res, error) => {
  console.error(error);
  const statusCode = error.isAppError ? error.statusCode : 500;
  return errorResponse(res, error.message, statusCode);
};

const esStaff = (req) => req.user && ['ADMIN', 'BIBLIOTECARIO'].includes(req.user.rol);

exports.listar = async (req, res) => {
  try {
    const pagination = getPagination(req);
    const { search, autorId, categoriaId, editorialId, tipo, sort, agotados, estado } = req.query;
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
      estado: estado === undefined ? undefined : estado === 'true',
    });
    const mostrarCreadoPor = await esAdminPrincipal(req);
    return paginatedResponse(res, { rows: ocultarCreadoPor(rows, mostrarCreadoPor), count }, pagination);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.populares = async (req, res) => {
  try {
    const { autorId, categoriaId, editorialId } = req.query;
    const limit = Number(req.query.limit) || 6;
    const libros = await service.listarPopulares({ limit, autorId, categoriaId, editorialId });
    return successResponse(res, libros);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtener = async (req, res) => {
  try {
    const libro = await service.obtener(req.params.id, esStaff(req));
    const mostrarCreadoPor = await esAdminPrincipal(req);
    return successResponse(res, ocultarCreadoPor(libro, mostrarCreadoPor));
  } catch (error) {
    return handleError(res, error);
  }
};

exports.crear = async (req, res) => {
  try {
    const libro = await service.crear(req.body, req.user.id);
    const mostrarCreadoPor = await esAdminPrincipal(req);
    return successResponse(res, ocultarCreadoPor(libro, mostrarCreadoPor), 'Libro creado exitosamente', 201);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.actualizar = async (req, res) => {
  try {
    const libro = await service.actualizar(req.params.id, req.body, req.user.id);
    const mostrarCreadoPor = await esAdminPrincipal(req);
    return successResponse(res, ocultarCreadoPor(libro, mostrarCreadoPor), 'Libro actualizado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};

exports.eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id, req.user.id);
    return successResponse(res, null, 'Libro eliminado exitosamente');
  } catch (error) {
    return handleError(res, error);
  }
};
