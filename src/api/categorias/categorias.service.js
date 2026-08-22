const repository = require('./categorias.repository');
const AppError = require('../../utils/AppError');

exports.listar = ({ pagination, search }) => {
  const where = repository.buildWhere({ search });
  return repository.findAndCountAll({ where, pagination });
};

exports.obtener = async (id) => {
  const categoria = await repository.findById(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
  return categoria;
};

exports.crear = (data) => repository.create(data);

exports.actualizar = async (id, data) => {
  const categoria = await repository.findById(id);
  if (!categoria) throw new AppError('Categoría no encontrada', 404);
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
