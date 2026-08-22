const { Op } = require('sequelize');
const { Categoria } = require('../../models');

exports.findAndCountAll = ({ where, pagination }) =>
  Categoria.findAndCountAll({ where, order: [['nombre', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Categoria.findByPk(id);

exports.create = (data) => Categoria.create(data);

exports.buildWhere = ({ isStaff, search, estado }) => {
  const where = isStaff ? {} : { estado: true };
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };
  // Filtro explícito de estado: solo tiene sentido para el staff (el público
  // siempre está limitado a estado:true de todas formas).
  if (isStaff && estado !== undefined) where.estado = estado === 'true' || estado === true;
  return where;
};
