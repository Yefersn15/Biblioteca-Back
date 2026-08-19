const { Autor } = require('../../models');

exports.findAndCountAll = ({ pagination }) =>
  Autor.findAndCountAll({ order: [['nombre', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Autor.findByPk(id);

exports.create = (data) => Autor.create(data);
