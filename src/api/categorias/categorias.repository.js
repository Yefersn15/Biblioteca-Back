const { Categoria } = require('../../models');

exports.findAndCountAll = ({ pagination }) =>
  Categoria.findAndCountAll({ order: [['nombre', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Categoria.findByPk(id);

exports.create = (data) => Categoria.create(data);
