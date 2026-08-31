const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Usuario, TokenRecuperacion } = require('../../models');
const { hashPassword, comparePassword } = require('../../utils/password');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const sendEmail = require('../../utils/sendEmail');
const uploadService = require('../upload/upload.service');

const firmarToken = (usuario) =>
  jwt.sign({ id: usuario.id, rol: usuario.rol }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

// Token largo y aleatorio (no adivinable por fuerza bruta, a diferencia de
// un código de 6 dígitos) que viaja en el link del correo, nunca escrito a mano.
const generarToken = () => crypto.randomBytes(32).toString('hex');

exports.registrar = async (datos) => {
  const { email, password, documento, celular, avatarPublicId } = datos;

  const existente = await Usuario.findOne({
    where: { [Op.or]: [{ email }, { documento }, { celular }] },
  });
  if (existente) {
    // El avatar ya se subió a Cloudinary antes de llamar a este endpoint
    // (el registro no tiene sesión todavía, así que la subida es un paso
    // aparte); si el registro no prospera, se borra para no dejarlo huérfano.
    await uploadService.eliminarImagen(avatarPublicId);
    if (existente.email === email) throw new AppError('Ya existe una cuenta con ese correo', 409);
    if (existente.documento === documento) throw new AppError('Ese número de documento ya está registrado', 409);
    throw new AppError('Ese número de celular ya está registrado', 409);
  }

  const passwordHash = await hashPassword(password);
  const { password: _p, ...resto } = datos;
  let usuario;
  try {
    usuario = await Usuario.create({ ...resto, passwordHash, rol: 'USUARIO' });
  } catch (error) {
    await uploadService.eliminarImagen(avatarPublicId);
    throw error;
  }

  // Model.create() devuelve la instancia tal cual se insertó, sin pasar por
  // el defaultScope que oculta passwordHash en las consultas normales.
  usuario.passwordHash = undefined;
  return { usuario, token: firmarToken(usuario) };
};

exports.login = async ({ email, password }) => {
  const usuario = await Usuario.scope('withPassword').findOne({ where: { email } });

  // Mensaje genérico en ambos casos: no revelar si el correo existe o no.
  if (!usuario || !usuario.estado) throw new AppError('Credenciales inválidas', 401);

  const passwordValida = await comparePassword(password, usuario.passwordHash);
  if (!passwordValida) throw new AppError('Credenciales inválidas', 401);

  usuario.passwordHash = undefined;
  return { usuario, token: firmarToken(usuario) };
};

exports.obtenerPerfil = (id) => Usuario.findByPk(id);

// No revela si el correo existe o no (evita enumeración de cuentas): si no
// existe, simplemente no se envía nada y la respuesta del controlador es la
// misma igual (ver auth.controller.js).
exports.solicitarRecuperacion = async (email) => {
  const usuario = await Usuario.findOne({ where: { email } });
  // Igual que "el correo no existe": la cuenta del administrador principal
  // (npm run seed:db) no se puede tocar desde la app, ni siquiera por este
  // camino, y no se revela que es una cuenta protegida.
  if (!usuario || usuario.esAdminPrincipal) return;

  await TokenRecuperacion.update({ usado: true }, { where: { usuarioId: usuario.id, usado: false } });

  const token = generarToken();
  const tokenHash = await hashPassword(token);
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
  await TokenRecuperacion.create({ usuarioId: usuario.id, tokenHash, expiraEn });

  const enlace = `${config.frontendUrl.replace(/\/$/, '')}/restablecer-password?email=${encodeURIComponent(email)}&token=${token}`;

  await sendEmail({
    to: usuario.email,
    subject: 'Recupera tu contraseña en Biblioteca Web',
    html: `
      <p>Hola ${usuario.nombres},</p>
      <p>Usa este enlace para crear una nueva contraseña. Vence en 15 minutos.</p>
      <p><a href="${enlace}" style="display:inline-block;padding:12px 24px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px;">Restablecer contraseña</a></p>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${enlace}</p>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    `,
  });
};

const buscarTokenValido = async (usuarioId, token) => {
  const registro = await TokenRecuperacion.findOne({
    where: { usuarioId, usado: false, expiraEn: { [Op.gt]: new Date() } },
    order: [['createdAt', 'DESC']],
  });
  if (!registro) throw new AppError('El enlace es inválido o ya expiró', 400);

  const coincide = await comparePassword(token, registro.tokenHash);
  if (!coincide) throw new AppError('El enlace es inválido o ya expiró', 400);

  return registro;
};

exports.verificarToken = async (email, token) => {
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) throw new AppError('El enlace es inválido o ya expiró', 400);
  await buscarTokenValido(usuario.id, token);
};

exports.restablecerPassword = async (email, token, password) => {
  const usuario = await Usuario.scope('withPassword').findOne({ where: { email } });
  if (!usuario) throw new AppError('El enlace es inválido o ya expiró', 400);

  const registro = await buscarTokenValido(usuario.id, token);

  usuario.passwordHash = await hashPassword(password);
  await usuario.save();
  await registro.update({ usado: true });
};
