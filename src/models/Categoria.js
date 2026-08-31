const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  creadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'creado_por_id',
    // Usuario que creó el registro (ver src/utils/ownership.js): protege lo
    // subido por el admin principal de ser editado/borrado por otra cuenta.
  },
}, {
  tableName: 'categorias',
  timestamps: true,
});

module.exports = Categoria;
