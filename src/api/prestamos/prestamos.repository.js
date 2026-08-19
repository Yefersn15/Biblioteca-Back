const { Prestamo, Libro, Usuario } = require('../../models');

const includeRelaciones = [
  { model: Libro, as: 'libro' },
  { model: Usuario, as: 'usuario' },
  { model: Usuario, as: 'bibliotecario' },
];

exports.findAndCountAll = ({ where, pagination }) =>
  Prestamo.findAndCountAll({
    where,
    include: includeRelaciones,
    order: [['createdAt', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

exports.findById = (id, options = {}) => Prestamo.findByPk(id, { include: includeRelaciones, ...options });

exports.create = (data) => Prestamo.create(data);
