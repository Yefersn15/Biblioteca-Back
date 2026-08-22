const repository = require('./categorias.repository');
const librosRepository = require('../libros/libros.repository');
const { Libro } = require('../../models');
const AppError = require('../../utils/AppError');

exports.listar = ({ isStaff, pagination, search, estado }) => {
  const where = repository.buildWhere({ isStaff, search, estado });
  return repository.findAndCountAll({ where, pagination });
};

exports.obtener = async (id, isStaff) => {
  const categoria = await repository.findById(id);
  if (!categoria || (!isStaff && !categoria.estado)) throw new AppError('Categoría no encontrada', 404);
  return categoria;
};

exports.crear = (data) => repository.create(data);

exports.actualizar = async (id, data) => {
  const categoria = await repository.findById(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);

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

exports.eliminar = async (id) => {
  const categoria = await repository.findById(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  const librosAsociados = await categoria.countLibros();
  if (librosAsociados > 0) {
    throw new AppError('No se puede eliminar: la categoría tiene libros asociados', 409);
  }
  await categoria.destroy();
};
