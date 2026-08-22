// Acceso a datos de banners: aísla las llamadas a Sequelize para que
// banners.service.js concentre únicamente lógica de negocio.
const { Op } = require('sequelize');
const { Banner } = require('../../models');

exports.findAndCountAll = ({ where, pagination }) =>
  Banner.findAndCountAll({
    where,
    order: [['displayOrder', 'ASC'], ['id', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

exports.create = (data) => Banner.create(data);

exports.findById = (id) => Banner.findByPk(id);

exports.buildWhere = ({ isStaff, search }) => {
  const where = isStaff ? {} : { estado: true };
  if (search) {
    where[Op.or] = [
      { titulo: { [Op.iLike]: `%${search}%` } },
      { texto: { [Op.iLike]: `%${search}%` } },
    ];
  }
  return where;
};
