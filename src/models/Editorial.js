const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Editorial = sequelize.define('Editorial', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'logo_url',
  },
  sitioWeb: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'sitio_web',
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'editoriales',
  timestamps: true,
});

module.exports = Editorial;
