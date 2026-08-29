const { Op } = require('sequelize');
const { Autor } = require('../../models');

// El include de libros (solo ids) se usa para poder ordenar por "popularidad"
// en el listado público sin exponer más que el conteo (ver autores.service).
exports.findAndCountAll = ({ where, pagination }) =>
  Autor.findAndCountAll({
    where,
    include: [{ association: 'libros', attributes: ['id'], through: { attributes: [] } }],
    distinct: true,
    order: [['nombre', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

exports.findById = (id) => Autor.findByPk(id);

exports.findByIds = (ids) => Autor.findAll({ where: { id: ids, estado: true } });

exports.create = (data) => Autor.create(data);

exports.buildWhere = ({ isStaff, search, nacionalidad, generoLiterario, estado }) => {
  // Público: solo autores activos. Staff: todos, salvo que filtre por un
  // estado explícito (?estado=true/false) — mismo patrón que libros.
  const where = isStaff ? {} : { estado: true };
  if (isStaff && estado !== undefined) where.estado = estado;
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { apellido: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (nacionalidad) where.nacionalidad = nacionalidad;
  if (generoLiterario) where.generoLiterario = { [Op.contains]: [Number(generoLiterario)] };
  return where;
};

// Ids de todos los libros que tienen a este autor en su lista de autores
// (N:M vía la tabla intermedia libro_autores) — se usa para la cascada de
// deshabilitar autor -> deshabilitar sus libros.
exports.findIdsLibrosByAutor = async (autorId) => {
  const autor = await Autor.findByPk(autorId, {
    include: [{ association: 'libros', attributes: ['id'], through: { attributes: [] } }],
  });
  return autor ? autor.libros.map((l) => l.id) : [];
};
