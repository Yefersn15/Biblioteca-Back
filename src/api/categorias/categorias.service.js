const repository = require('./categorias.repository');
const librosRepository = require('../libros/libros.repository');
const { Libro } = require('../../models');
const AppError = require('../../utils/AppError');
const { assertPuedeModificar } = require('../../utils/ownership');

exports.listar = async ({ isStaff, pagination, search, estado }) => {
  const where = repository.buildWhere({ isStaff, search, estado });
  const { rows, count } = await repository.findAndCountAll({ where, pagination });
  const rowsConPopularidad = rows.map((categoria) => {
    const plano = categoria.toJSON();
    plano.cantidadLibros = plano.libros.length;
    delete plano.libros;
    return plano;
  });
  return { rows: rowsConPopularidad, count };
};

exports.obtener = async (id, isStaff) => {
  const categoria = await repository.findById(id);
  if (!categoria || (!isStaff && !categoria.estado)) throw new AppError('Categoría no encontrada', 404);
  return categoria;
};

exports.crear = async (data, usuarioActualId) => {
  const existente = await repository.findByNombre(data.nombre);
  if (existente) throw new AppError('Ya existe una categoría con ese nombre', 409);
  return repository.create({ ...data, creadoPorId: usuarioActualId });
};

exports.actualizar = async (id, data, usuarioActualId) => {
  const categoria = await repository.findById(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  await assertPuedeModificar(categoria, usuarioActualId);

  if (data.nombre !== undefined && data.nombre !== categoria.nombre) {
    const existente = await repository.findByNombre(data.nombre);
    if (existente) throw new AppError('Ya existe una categoría con ese nombre', 409);
  }

  // Cascada: al deshabilitar una categoría, todos los libros que la tienen
  // entre las suyas pasan a inactivos también (aunque tengan otras
  // categorías activas). Al volver a habilitarla, sus libros NO se
  // re-habilitan automáticamente.
  if (data.estado === false && categoria.estado === true) {
    const idsLibros = await librosRepository.findIdsByCategoria(id);
    if (idsLibros.length > 0) {
      await Libro.update({ estado: false }, { where: { id: idsLibros } });
    }
  }

  await categoria.update(data);
  return categoria;
};

exports.eliminar = async (id, usuarioActualId) => {
  const categoria = await repository.findById(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  await assertPuedeModificar(categoria, usuarioActualId);
  const librosAsociados = await categoria.countLibros();
  if (librosAsociados > 0) {
    throw new AppError('No se puede eliminar: la categoría tiene libros asociados', 409);
  }
  await categoria.destroy();
};
