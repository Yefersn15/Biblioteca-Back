const { Op } = require('sequelize');
const { Editorial } = require('../../models');

exports.findAndCountAll = ({ where, pagination }) =>
  Editorial.findAndCountAll({ where, order: [['nombre', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Editorial.findByPk(id);

exports.create = (data) => Editorial.create(data);

exports.buildWhere = ({ isStaff, search, estado }) => {
  const where = isStaff ? {} : { estado: true };
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };
  if (isStaff && estado !== undefined) where.estado = estado;
  return where;
};
