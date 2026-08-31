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
  logoPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'logo_public_id',
    // public_id de Cloudinary de `logoUrl` (ver Autor.fotografiaPublicId).
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
  creadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'creado_por_id',
    // Usuario que creó el registro (ver src/utils/ownership.js): protege lo
    // subido por el admin principal de ser editado/borrado por otra cuenta.
  },
}, {
  tableName: 'editoriales',
  timestamps: true,
});

module.exports = Editorial;
