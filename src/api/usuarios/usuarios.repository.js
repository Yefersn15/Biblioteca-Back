const { Op } = require('sequelize');
const { Usuario } = require('../../models');

exports.findAndCountAll = ({ where, pagination }) =>
  Usuario.findAndCountAll({ where, order: [['id', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Usuario.findByPk(id);

exports.create = (data) => Usuario.create(data);

exports.buildWhere = ({ search, rol, estado }) => {
  const where = {};
  if (search) {
    where[Op.or] = [
      { nombres: { [Op.iLike]: `%${search}%` } },
      { apellidos: { [Op.iLike]: `%${search}%` } },
      { documento: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (rol) where.rol = rol;
  if (estado !== undefined) where.estado = estado;
  return where;
};
