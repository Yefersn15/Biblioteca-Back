const { Editorial } = require('../../models');

exports.findAndCountAll = ({ pagination }) =>
  Editorial.findAndCountAll({ order: [['nombre', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Editorial.findByPk(id);

exports.create = (data) => Editorial.create(data);
