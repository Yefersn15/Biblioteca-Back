const repository = require('./libros.repository');
const AppError = require('../../utils/AppError');

const ORDENES = {
  'titulo-asc': [['titulo', 'ASC']],
  'titulo-desc': [['titulo', 'DESC']],
  'disponibles-desc': [['copiasDisponibles', 'DESC'], ['titulo', 'ASC']],
  'disponibles-asc': [['copiasDisponibles', 'ASC'], ['titulo', 'ASC']],
  'recientes': [['createdAt', 'DESC']],
};

exports.listar = async ({ isStaff, pagination, search, autorId, categoriaId, editorialId, tipo, sort, agotados, estado }) => {
  const where = repository.buildWhere({ isStaff, search, editorialId, tipo, agotados, estado });

  if (autorId || categoriaId) {
    const listas = await Promise.all([
      autorId ? repository.findIdsByAutor(autorId) : null,
      categoriaId ? repository.findIdsByCategoria(categoriaId) : null,
    ]);
    const [idsAutor, idsCategoria] = listas;
    const ids = [idsAutor, idsCategoria].filter(Boolean);
    where.id = ids.length === 1 ? ids[0] : ids[0].filter((id) => ids[1].includes(id));
  }

  const order = ORDENES[sort] || ORDENES['titulo-asc'];
  return repository.findAndCountAll({ where, pagination, order });
};

// Recomendados = los más prestados. Si todavía no hay historial de
// préstamos (instalación nueva), cae de vuelta a los más recientes para que
// el inicio no se vea vacío en una demo o recién desplegado.
exports.listarPopulares = async (limit = 6) => {
  const ids = await repository.idsPopulares(limit);
  if (ids.length > 0) {
    const libros = await repository.findByIds(ids);
    return ids.map((id) => libros.find((l) => l.id === id)).filter(Boolean);
  }
  const { rows } = await repository.findAndCountAll({
    where: { estado: true },
    pagination: { limit, offset: 0 },
  });
  return rows;
};

exports.obtener = async (id, isStaff) => {
  const libro = await repository.findById(id);
  if (!libro || (!isStaff && !libro.estado)) throw new AppError('Libro no encontrado', 404);
  return libro;
};

exports.crear = async ({ autorIds, categoriaIds, ...data }) => {
  if (!autorIds || autorIds.length === 0) {
    throw new AppError('Debe indicar al menos un autor', 400);
  }

  const copiasTotales = data.copiasTotales || 1;
  const libro = await repository.create({ ...data, copiasTotales, copiasDisponibles: copiasTotales });
  await libro.setAutores(autorIds);
  if (categoriaIds) await libro.setCategorias(categoriaIds);
  return repository.findById(libro.id);
};

exports.actualizar = async (id, { autorIds, categoriaIds, ...data }) => {
  const libro = await repository.findById(id);
  if (!libro) throw new AppError('Libro no encontrado', 404);

  if (autorIds && autorIds.length === 0) {
    throw new AppError('Debe indicar al menos un autor', 400);
  }

  if (data.copiasTotales !== undefined && data.copiasTotales !== libro.copiasTotales) {
    const delta = data.copiasTotales - libro.copiasTotales;
    data.copiasDisponibles = Math.min(data.copiasTotales, Math.max(0, libro.copiasDisponibles + delta));
  }

  await libro.update(data);
  if (autorIds) await libro.setAutores(autorIds);
  if (categoriaIds) await libro.setCategorias(categoriaIds);
  return repository.findById(id);
};

exports.eliminar = async (id) => {
  const libro = await repository.findById(id);
  if (!libro) throw new AppError('Libro no encontrado', 404);
  // Baja lógica: mantiene el historial de préstamos ya asociados a este libro.
  await libro.update({ estado: false });
};
