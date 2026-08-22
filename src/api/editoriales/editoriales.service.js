const repository = require('./editoriales.repository');
const AppError = require('../../utils/AppError');

exports.listar = ({ pagination, search }) => {
  const where = repository.buildWhere({ search });
  return repository.findAndCountAll({ where, pagination });
};

exports.obtener = async (id) => {
  const editorial = await repository.findById(id);
  if (!editorial) throw new AppError('Editorial no encontrada', 404);
  return editorial;
};

exports.crear = (data) => repository.create(data);

exports.actualizar = async (id, data) => {
  const editorial = await repository.findById(id);
  if (!editorial) throw new AppError('Editorial no encontrada', 404);
  await editorial.update(data);
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
};
