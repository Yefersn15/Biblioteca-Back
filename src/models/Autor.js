const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Autor = sequelize.define('Autor', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  nacionalidad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  generoLiterario: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'genero_literario',
  },
  biografia: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fotografiaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fotografia_url',
  },
  idiomaPrincipal: {
    type: DataTypes.STRING(60),
    allowNull: true,
    field: 'idioma_principal',
  },
  obrasDestacadas: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    field: 'obras_destacadas',
  },
  premios: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  },
  redesSociales: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    field: 'redes_sociales',
    // { facebook, twitter, instagram, portafolio }
  },
}, {
  tableName: 'autores',
  timestamps: true,
});

module.exports = Autor;
