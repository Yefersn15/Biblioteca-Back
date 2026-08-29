const { Op } = require('sequelize');
const { sequelize, Libro, Autor, Editorial, Categoria, Prestamo } = require('../../models');

const includeRelaciones = [
  { model: Autor, as: 'autores', through: { attributes: [] } },
  { model: Editorial, as: 'editorial' },
  { model: Categoria, as: 'categorias', through: { attributes: [] } },
];

exports.findAndCountAll = ({ where, pagination, order }) =>
  Libro.findAndCountAll({
    where,
    include: includeRelaciones,
    distinct: true,
    order: order || [['titulo', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

exports.findById = (id) => Libro.findByPk(id, { include: includeRelaciones });

exports.findByIds = (ids) => Libro.findAll({ where: { id: ids, estado: true }, include: includeRelaciones });

// Ids de los libros más prestados (cuenta préstamos ya aprobados o
// devueltos, no los pendientes/rechazados que nunca se llegaron a prestar).
// `candidatoIds`, si se pasa, restringe el conteo a esos libros (se usa para
// "más populares de tal autor/categoría/editorial").
exports.idsPopulares = async (limit, candidatoIds) => {
  const where = { estado: { [Op.in]: ['APROBADO', 'DEVUELTO'] } };
  if (candidatoIds) where.libroId = candidatoIds;
  const conteos = await Prestamo.findAll({
    attributes: ['libroId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
    where,
    group: ['libroId'],
    order: [[sequelize.literal('total'), 'DESC']],
    limit,
    raw: true,
  });
  return conteos.map((c) => c.libroId);
};

exports.create = (data) => Libro.create(data);

exports.buildWhere = ({ isStaff, search, editorialId, tipo, agotados, estado }) => {
  const where = isStaff ? {} : { estado: true };
  if (search) where.titulo = { [Op.iLike]: `%${search}%` };
  if (editorialId) where.editorialId = editorialId;
  if (tipo) where.tipo = tipo;
  if (agotados) where.copiasDisponibles = 0;
  if (isStaff && estado !== undefined) where.estado = estado;
  return where;
};

// Un libro puede tener varios autores/categorías (N:M), así que filtrar por
// uno de ellos no puede ir directo en el WHERE del libro: se resuelve aparte
// qué ids de libro coinciden y luego se intersecta con el resto de filtros.
// Esto evita que el include principal pierda a los demás coautores del libro
// (que sí pasaría si el filtro fuera un `where` dentro del include normal).
exports.findIdsByAutor = async (autorId) => {
  const libros = await Libro.findAll({
    attributes: ['id'],
    include: [{ model: Autor, as: 'autores', where: { id: autorId }, attributes: [], through: { attributes: [] } }],
  });
  return libros.map((l) => l.id);
};

exports.findIdsByCategoria = async (categoriaId) => {
  const libros = await Libro.findAll({
    attributes: ['id'],
    include: [{ model: Categoria, as: 'categorias', where: { id: categoriaId }, attributes: [], through: { attributes: [] } }],
  });
  return libros.map((l) => l.id);
};
