const { Usuario } = require('../../models');

exports.findAndCountAll = ({ pagination }) =>
  Usuario.findAndCountAll({ order: [['id', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Usuario.findByPk(id);

exports.create = (data) => Usuario.create(data);
