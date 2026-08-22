const { Op } = require('sequelize');
const { Autor } = require('../../models');

exports.findAndCountAll = ({ where, pagination }) =>
  Autor.findAndCountAll({ where, order: [['nombre', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Autor.findByPk(id);

exports.create = (data) => Autor.create(data);

exports.buildWhere = ({ search }) => {
  const where = {};
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { apellido: { [Op.iLike]: `%${search}%` } },
    ];
  }
  return where;
};
