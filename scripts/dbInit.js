// npm run db:init
// 1) Crea la base de datos en Postgres si todavía no existe (usando las
//    credenciales de .env) y 2) sincroniza las tablas a partir de los
//    modelos de Sequelize. Los modelos son la única fuente de verdad del
//    esquema; este script no duplica CREATE TABLEs a mano.
const { Client } = require('pg');
const config = require('../src/config/env');

const NOMBRE_VALIDO = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const ensureDatabaseExists = async () => {
  if (!NOMBRE_VALIDO.test(config.db.name)) {
    throw new Error(`DB_NAME inválido: "${config.db.name}"`);
  }

  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres', // BD de mantenimiento: siempre existe, se usa solo para crear la nuestra
  });

  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.db.name]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${config.db.name}"`);
      console.log(`Base de datos "${config.db.name}" creada`);
    } else {
      console.log(`Base de datos "${config.db.name}" ya existe`);
    }
  } finally {
    await client.end();
  }
};

const syncTables = async () => {
  const { sequelize } = require('../src/models');
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Tablas sincronizadas a partir de los modelos');
  } finally {
    await sequelize.close();
  }
};

(async () => {
  try {
    await ensureDatabaseExists();
    await syncTables();
    process.exit(0);
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    process.exit(1);
  }
})();
