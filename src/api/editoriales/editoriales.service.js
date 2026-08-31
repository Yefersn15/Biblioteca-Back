const repository = require('./editoriales.repository');
const AppError = require('../../utils/AppError');
const { Libro } = require('../../models');
const uploadService = require('../upload/upload.service');

exports.listar = async ({ isStaff, pagination, search, estado }) => {
  const where = repository.buildWhere({ isStaff, search, estado });
  const { rows, count } = await repository.findAndCountAll({ where, pagination });
  const rowsConPopularidad = rows.map((editorial) => {
    const plano = editorial.toJSON();
    plano.cantidadLibros = plano.libros.length;
    delete plano.libros;
    return plano;
  });
  return { rows: rowsConPopularidad, count };
};

exports.obtener = async (id, isStaff) => {
  const editorial = await repository.findById(id);
  if (!editorial || (!isStaff && !editorial.estado)) throw new AppError('Editorial no encontrada', 404);
  return editorial;
};

exports.crear = (data) => repository.create(data);

exports.actualizar = async (id, data) => {
  const editorial = await repository.findById(id);
  if (!editorial) throw new AppError('Editorial no encontrada', 404);

  // Al deshabilitar una editorial, todos sus libros pasan a inactivos
  // también (baja lógica en cascada). Al volver a habilitarla, sus libros
  // NO se re-habilitan automáticamente.
  const seDeshabilita = data.estado === false && editorial.estado === true;
  const logoPublicIdAnterior = editorial.logoPublicId;

  await editorial.update(data);
  if (seDeshabilita) {
    await Libro.update({ estado: false }, { where: { editorialId: id } });
  }
  if (data.logoUrl !== undefined && logoPublicIdAnterior && logoPublicIdAnterior !== data.logoPublicId) {
    await uploadService.eliminarImagen(logoPublicIdAnterior);
  }
  return editorial;
};

exports.eliminar = async (id) => {
  const editorial = await repository.findById(id);
  if (!editorial) throw new AppError('Editorial no encontrada', 404);
  const librosAsociados = await editorial.countLibros();
  if (librosAsociados > 0) {
    throw new AppError('No se puede eliminar: la editorial tiene libros asociados', 409);
  }
  await editorial.destroy();
  await uploadService.eliminarImagen(editorial.logoPublicId);
};
