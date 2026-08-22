const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Libro = sequelize.define('Libro', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  editorialId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'editorial_id',
  },
  tipo: {
    type: DataTypes.ENUM('LIBRO', 'REVISTA', 'PERIODICO', 'GUIA'),
    allowNull: false,
    defaultValue: 'LIBRO',
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  portadaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'portada_url',
  },
  isbn: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  anioPublicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'anio_publicacion',
  },
  idioma: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  archivoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'archivo_url',
    // URL de descarga del archivo digital del libro (PDF, epub...), opcional.
  },
  paginas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  copiasTotales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'copias_totales',
  },
  copiasDisponibles: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'copias_disponibles',
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'libros',
  timestamps: true,
});

module.exports = Libro;
