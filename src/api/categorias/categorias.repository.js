const { Op } = require('sequelize');
const { Categoria } = require('../../models');

// El include de libros (solo ids) se usa para poder ordenar por "popularidad"
// en el listado público sin exponer más que el conteo (ver categorias.service).
exports.findAndCountAll = ({ where, pagination }) =>
  Categoria.findAndCountAll({
    where,
    include: [{ association: 'libros', attributes: ['id'], through: { attributes: [] } }],
    distinct: true,
    order: [['nombre', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

exports.findById = (id) => Categoria.findByPk(id);

exports.findByNombre = (nombre) => Categoria.findOne({ where: { nombre } });

exports.findByIds = (ids) => Categoria.findAll({ where: { id: ids, estado: true } });

exports.create = (data) => Categoria.create(data);

exports.buildWhere = ({ isStaff, search, estado }) => {
  const where = isStaff ? {} : { estado: true };
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };
  // Filtro explícito de estado: solo tiene sentido para el staff (el público
  // siempre está limitado a estado:true de todas formas).
  if (isStaff && estado !== undefined) where.estado = estado === 'true' || estado === true;
  return where;
};
