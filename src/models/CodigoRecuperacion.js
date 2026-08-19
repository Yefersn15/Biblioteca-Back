const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CodigoRecuperacion = sequelize.define('CodigoRecuperacion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
  codigoHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'codigo_hash',
  },
  usado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  expiraEn: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expira_en',
  },
}, {
  tableName: 'codigos_recuperacion',
  timestamps: true,
});

module.exports = CodigoRecuperacion;
