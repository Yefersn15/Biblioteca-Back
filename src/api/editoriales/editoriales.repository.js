const { Op } = require('sequelize');
const { Editorial } = require('../../models');

// El include de libros (solo ids) se usa para poder ordenar por "popularidad"
// en el listado público sin exponer más que el conteo (ver editoriales.service).
exports.findAndCountAll = ({ where, pagination }) =>
  Editorial.findAndCountAll({
    where,
    include: [{ association: 'libros', attributes: ['id'] }],
    distinct: true,
    order: [['nombre', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

exports.findById = (id) => Editorial.findByPk(id);

exports.findByNombre = (nombre) => Editorial.findOne({ where: { nombre } });

exports.findByIds = (ids) => Editorial.findAll({ where: { id: ids, estado: true } });

exports.create = (data) => Editorial.create(data);

exports.buildWhere = ({ isStaff, search, estado }) => {
  const where = isStaff ? {} : { estado: true };
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };
  if (isStaff && estado !== undefined) where.estado = estado;
  return where;
};
