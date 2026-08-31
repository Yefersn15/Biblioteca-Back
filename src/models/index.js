const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Autor = require('./Autor');
const Editorial = require('./Editorial');
const Categoria = require('./Categoria');
const Libro = require('./Libro');
const Prestamo = require('./Prestamo');
const Banner = require('./Banner');
const TokenRecuperacion = require('./TokenRecuperacion');
const Configuracion = require('./Configuracion');

// Libro N:M Autor (un libro puede tener varios autores/coautores)
Libro.belongsToMany(Autor, { through: 'libro_autores', as: 'autores', foreignKey: 'libro_id' });
Autor.belongsToMany(Libro, { through: 'libro_autores', as: 'libros', foreignKey: 'autor_id' });

// Editorial 1:N Libro
Editorial.hasMany(Libro, { foreignKey: 'editorialId', as: 'libros' });
Libro.belongsTo(Editorial, { foreignKey: 'editorialId', as: 'editorial' });

// Libro N:M Categoria
Libro.belongsToMany(Categoria, { through: 'libro_categorias', as: 'categorias', foreignKey: 'libro_id' });
Categoria.belongsToMany(Libro, { through: 'libro_categorias', as: 'libros', foreignKey: 'categoria_id' });

// Usuario / Libro 1:N Prestamo
Usuario.hasMany(Prestamo, { foreignKey: 'usuarioId', as: 'prestamos' });
Prestamo.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Usuario.hasMany(Prestamo, { foreignKey: 'bibliotecarioId', as: 'prestamosGestionados' });
Prestamo.belongsTo(Usuario, { foreignKey: 'bibliotecarioId', as: 'bibliotecario' });

Libro.hasMany(Prestamo, { foreignKey: 'libroId', as: 'prestamos' });
Prestamo.belongsTo(Libro, { foreignKey: 'libroId', as: 'libro' });

Usuario.hasMany(TokenRecuperacion, { foreignKey: 'usuarioId', as: 'tokensRecuperacion' });
TokenRecuperacion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Usuario que creó cada registro (ver src/utils/ownership.js).
Libro.belongsTo(Usuario, { foreignKey: 'creadoPorId', as: 'creadoPor' });
Autor.belongsTo(Usuario, { foreignKey: 'creadoPorId', as: 'creadoPor' });
Editorial.belongsTo(Usuario, { foreignKey: 'creadoPorId', as: 'creadoPor' });
Categoria.belongsTo(Usuario, { foreignKey: 'creadoPorId', as: 'creadoPor' });

module.exports = {
  sequelize,
  Usuario,
  Autor,
  Editorial,
  Categoria,
  Libro,
  Prestamo,
  Banner,
  TokenRecuperacion,
  Configuracion,
};
