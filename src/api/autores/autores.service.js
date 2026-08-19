const repository = require('./autores.repository');
const AppError = require('../../utils/AppError');

exports.listar = ({ pagination }) => repository.findAndCountAll({ pagination });

exports.obtener = async (id) => {
  const autor = await repository.findById(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  return autor;
};

exports.crear = (data) => repository.create(data);

exports.actualizar = async (id, data) => {
  const autor = await repository.findById(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  await autor.update(data);
  return autor;
};

exports.eliminar = async (id) => {
  const autor = await repository.findById(id);
  if (!autor) throw new AppError('Autor no encontrado', 404);
  const librosAsociados = await autor.countLibros();
  if (librosAsociados > 0) {
    throw new AppError('No se puede eliminar: el autor tiene libros asociados', 409);
  }
  await autor.destroy();
};
