const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  layout: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'single'
    // clave de la plantilla de collage: single | duo | trio | grid-4 | grid-6 | mosaic-8
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
    // [{ slot: number, url: string }] - una entrada por cada casilla de la plantilla
    // Solo se usa cuando contentType = 'IMAGENES'.
  },
  contentType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'IMAGENES',
    field: 'content_type'
    // IMAGENES: usa `images` (imágenes subidas a mano).
    // LIBROS: cada casilla muestra la portada de un libro del catálogo.
    // AUTORES / EDITORIALES: cada casilla muestra la foto/logo de uno elegido a mano.
  },
  origen: {
    type: DataTypes.STRING(20),
    allowNull: true
    // Solo aplica cuando contentType = 'LIBROS': MANUAL | CATEGORIA | AUTOR | EDITORIAL.
  },
  origenId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'origen_id'
    // Id de la categoría/autor/editorial cuando origen no es MANUAL.
  },
  refIds: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'ref_ids'
    // Ids de libro/autor/editorial elegidos a mano, en el mismo orden que las
    // casillas de la plantilla (LIBROS+MANUAL, AUTORES, EDITORIALES).
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  texto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  textPosition: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'none',
    field: 'text_position'
    // left | right | center | none
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'display_order'
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'banners',
  timestamps: true
});

module.exports = Banner;
