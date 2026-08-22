const { Op } = require('sequelize');
const { Categoria } = require('../../models');

exports.findAndCountAll = ({ where, pagination }) =>
  Categoria.findAndCountAll({ where, order: [['nombre', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Categoria.findByPk(id);

exports.create = (data) => Categoria.create(data);

exports.buildWhere = ({ search }) => {
  const where = {};
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };
  return where;
};
