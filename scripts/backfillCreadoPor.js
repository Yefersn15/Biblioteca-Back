// node scripts/backfillCreadoPor.js
// Asigna como "creado por" al admin principal (ADMIN_EMAIL) todos los
// libros/autores/editoriales/categorías que ya existían antes de que se
// empezara a registrar ese dato (ver src/utils/ownership.js). Es un script
// de un solo uso: solo toca los registros que todavía no tienen dueño.
const { sequelize, Usuario, Libro, Autor, Editorial, Categoria } = require('../src/models');
const config = require('../src/config/env');

const MODELOS = [Libro, Autor, Editorial, Categoria];

const run = async () => {
  if (!config.adminEmail) {
    throw new Error('Falta ADMIN_EMAIL en el .env');
  }

  await sequelize.authenticate();

  const admin = await Usuario.findOne({ where: { email: config.adminEmail } });
  if (!admin) {
    throw new Error(`No existe un usuario con el correo ${config.adminEmail}. Corre "npm run seed:db" primero.`);
  }

  for (const Modelo of MODELOS) {
    const [cantidad] = await Modelo.update(
      { creadoPorId: admin.id },
      { where: { creadoPorId: null } },
    );
    console.log(`${Modelo.name}: ${cantidad} registro(s) asignado(s) al admin principal.`);
  }
};

let exitCode = 0;
run()
  .catch((error) => {
    console.error('Error asignando dueño a los registros existentes:', error.message);
    exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
    process.exit(exitCode);
  });
