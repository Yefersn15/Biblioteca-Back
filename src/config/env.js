require('dotenv').config();

const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Faltan variables de entorno: ${missing.join(', ')}. Revisa tu archivo .env`);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Identifica a la cuenta creada por `npm run seed:db`, la única con
  // protección total (ver Usuario.esAdminPrincipal): nadie puede cambiarle
  // el rol, desactivarla ni cambiarle la contraseña desde la aplicación.
  adminEmail: process.env.ADMIN_EMAIL,
  // Cloudinary y Brevo son opcionales: si faltan, la app sigue arrancando
  // (subida de imágenes y envío de correo simplemente avisan que no están
  // configurados, en vez de tumbar el servidor completo).
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    from: process.env.MAIL_FROM,
  },
};
