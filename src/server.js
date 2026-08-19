const app = require('./app');
const config = require('./config/env');
const { sequelize } = require('./models');

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a Postgres establecida');

    app.listen(config.port, () => {
      console.log(`API escuchando en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
};

start();
