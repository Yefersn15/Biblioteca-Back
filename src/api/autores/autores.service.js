const repository = require('./autores.repository');
const AppError = require('../../utils/AppError');
const { Libro } = require('../../models');
const uploadService = require('../upload/upload.service');
const { assertPuedeModificar } = require('../../utils/ownership');

exports.listar = async ({ isStaff, pagination, search, nacionalidad, generoLiterario, estado }) => {
  const where = repository.buildWhere({ isStaff, search, nacionalidad, generoLiterario, estado });
  const { rows, count } = await repository.findAndCountAll({ where, pagination });
  const rowsConPopularidad = rows.map((autor) => {
    const plano = autor.toJSON();
    plano.cantidadLibros = plano.libros.length;
    delete plano.libros;
    return plano;
  });
  return { rows: rowsConPopularidad, count };
};

exports.obtener = async (id, isStaff) => {
  const autor = await repository.findById(id);
  if (!autor || (!isStaff && !autor.estado)) throw new AppError('Autor no encontrado', 404);
  return autor;
};

exports.crear = (data, usuarioActualId) => repository.create({ ...data, creadoPorId: usuarioActualId });

exports.actualizar = async (id, data, usuarioActualId) => {
  const autor = await repository.findById(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  await assertPuedeModificar(autor, usuarioActualId);

  const estabaActivo = autor.estado;
  const fotografiaPublicIdAnterior = autor.fotografiaPublicId;
  await autor.update(data);

  // Si la fotografía cambió (nueva subida, URL pegada a mano, o se quitó) y
  // la anterior era una imagen propia de este sistema, se borra de Cloudinary
  // para no dejarla huérfana.
  if (data.fotografiaUrl !== undefined && fotografiaPublicIdAnterior && fotografiaPublicIdAnterior !== data.fotografiaPublicId) {
    await uploadService.eliminarImagen(fotografiaPublicIdAnterior);
  }

  // Cascada: al deshabilitar un autor, todos los libros donde aparece
  // (aunque tengan otros coautores activos) pasan a inactivos también.
  // Volver a habilitar el autor NO reactiva los libros (se hace a mano).
  if (data.estado === false && estabaActivo) {
    const idsLibros = await repository.findIdsLibrosByAutor(id);
    if (idsLibros.length > 0) {
      await Libro.update({ estado: false }, { where: { id: idsLibros } });
    }
  }

  return autor;
};

exports.eliminar = async (id, usuarioActualId) => {
  const autor = await repository.findById(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  await assertPuedeModificar(autor, usuarioActualId);
  const librosAsociados = await autor.countLibros();
  if (librosAsociados > 0) {
    throw new AppError('No se puede eliminar: el autor tiene libros asociados', 409);
  }
  await autor.destroy();
  await uploadService.eliminarImagen(autor.fotografiaPublicId);
};
