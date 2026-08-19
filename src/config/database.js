const { Sequelize } = require('sequelize');
const config = require('./env');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  // El SQL de cada query queda disponible con DEBUG_SQL=true si algún día
  // hace falta, pero por defecto se apaga: el requestLogger ya deja una
  // línea clara por petición (método, ruta, código, duración) y el SQL
  // completo solo agregaba ruido para depurar a simple vista.
  logging: process.env.DEBUG_SQL === 'true' ? console.log : false,
  dialectOptions: config.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

module.exports = sequelize;
