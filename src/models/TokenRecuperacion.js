const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TokenRecuperacion = sequelize.define('TokenRecuperacion', {
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
  tokenHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'token_hash',
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
  tableName: 'tokens_recuperacion',
  timestamps: true,
});

module.exports = TokenRecuperacion;
