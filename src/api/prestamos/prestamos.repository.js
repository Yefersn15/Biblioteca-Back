const { Op } = require('sequelize');
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

exports.create = (data, options = {}) => Prestamo.create(data, options);

// Un préstamo solo tiene un libro y un usuario, pero el buscador debe hacer
// match si el término aparece en el título del libro O en el nombre del
// solicitante: se resuelven los ids que coinciden en cada tabla por separado
// y luego se intersectan con OR en el where de Prestamo (mismo patrón que
// findIdsByAutor/findIdsByCategoria en libros.repository.js).
exports.findIdsByLibroSearch = async (search) => {
  const libros = await Libro.findAll({
    attributes: ['id'],
    where: { titulo: { [Op.iLike]: `%${search}%` } },
  });
  return libros.map((l) => l.id);
};

exports.findIdsByUsuarioSearch = async (search) => {
  const usuarios = await Usuario.findAll({
    attributes: ['id'],
    where: {
      [Op.or]: [{ nombres: { [Op.iLike]: `%${search}%` } }, { apellidos: { [Op.iLike]: `%${search}%` } }],
    },
  });
  return usuarios.map((u) => u.id);
};
