const { Op } = require('sequelize');
const { Usuario } = require('../../models');

exports.findAndCountAll = ({ where, pagination }) =>
  Usuario.findAndCountAll({ where, order: [['id', 'ASC']], limit: pagination.limit, offset: pagination.offset });

exports.findById = (id) => Usuario.findByPk(id);

// Busca un usuario que ya tenga alguno de los campos únicos dados (email,
// documento o celular), para poder distinguir cuál de ellos está duplicado
// antes de dejar que la restricción única de la base de datos lo rechace con
// un mensaje genérico. `excludeId` se usa al editar, para no chocar con el
// propio registro que se está actualizando.
exports.findByUniqueFields = ({ email, documento, celular, excludeId }) => {
  const or = [];
  if (email) or.push({ email });
  if (documento) or.push({ documento });
  if (celular) or.push({ celular });
  if (or.length === 0) return null;

  const where = { [Op.or]: or };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Usuario.findOne({ where });
};

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
