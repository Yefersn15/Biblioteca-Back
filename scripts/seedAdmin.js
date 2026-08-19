// npm run seed:db
// Crea el usuario ADMIN inicial a partir de variables de entorno (nunca
// hardcodeadas en el código) y con la contraseña hasheada con bcrypt.
// Es idempotente: si ya existe un usuario con ese correo, no hace nada.
const { sequelize, Usuario } = require('../src/models');
const { hashPassword } = require('../src/utils/password');

const REQUERIDAS = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_NOMBRES', 'ADMIN_APELLIDOS'];

const run = async () => {
  const faltantes = REQUERIDAS.filter((key) => !process.env[key]);
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno para crear el admin: ${faltantes.join(', ')}`);
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRES, ADMIN_APELLIDOS } = process.env;
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
  }

  await sequelize.authenticate();

  const existente = await Usuario.findOne({ where: { email: ADMIN_EMAIL } });
  if (existente) {
    console.log(`Ya existe un usuario con el correo ${ADMIN_EMAIL}; no se crea de nuevo.`);
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await Usuario.create({
    nombres: ADMIN_NOMBRES,
    apellidos: ADMIN_APELLIDOS,
    email: ADMIN_EMAIL,
    passwordHash,
    rol: 'ADMIN',
    estado: true,
  });

  console.log(`Administrador creado: ${ADMIN_EMAIL}`);
};

let exitCode = 0;
run()
  .catch((error) => {
    console.error('Error creando el administrador:', error.message);
    exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
    process.exit(exitCode);
  });
