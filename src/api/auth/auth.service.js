const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario, CodigoRecuperacion } = require('../../models');
const { hashPassword, comparePassword } = require('../../utils/password');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const sendEmail = require('../../utils/sendEmail');

const firmarToken = (usuario) =>
  jwt.sign({ id: usuario.id, rol: usuario.rol }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const generarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.registrar = async (datos) => {
  const { email, password, documento, celular } = datos;

  const existente = await Usuario.findOne({
    where: { [Op.or]: [{ email }, { documento }, { celular }] },
  });
  if (existente) {
    if (existente.email === email) throw new AppError('Ya existe una cuenta con ese correo', 409);
    if (existente.documento === documento) throw new AppError('Ese número de documento ya está registrado', 409);
    throw new AppError('Ese número de celular ya está registrado', 409);
  }

  const passwordHash = await hashPassword(password);
  const { password: _p, ...resto } = datos;
  const usuario = await Usuario.create({ ...resto, passwordHash, rol: 'USUARIO' });

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
// existe, simplemente no se envía nada y la respuesta es la misma igual.
exports.solicitarRecuperacion = async (email) => {
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) return;

  await CodigoRecuperacion.update({ usado: true }, { where: { usuarioId: usuario.id, usado: false } });

  const codigo = generarCodigo();
  const codigoHash = await hashPassword(codigo);
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000);
  await CodigoRecuperacion.create({ usuarioId: usuario.id, codigoHash, expiraEn });

  await sendEmail({
    to: usuario.email,
    subject: 'Código para recuperar tu contraseña',
    html: `
      <p>Hola ${usuario.nombres},</p>
      <p>Usa este código para restablecer tu contraseña en Biblioteca Web. Vence en 15 minutos.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${codigo}</p>
      <p>Si no solicitaste esto, puedes ignorar este correo.</p>
    `,
  });
};

const buscarCodigoValido = async (usuarioId, codigo) => {
  const registro = await CodigoRecuperacion.findOne({
    where: { usuarioId, usado: false, expiraEn: { [Op.gt]: new Date() } },
    order: [['createdAt', 'DESC']],
  });
  if (!registro) throw new AppError('Código inválido o expirado', 400);

  const coincide = await comparePassword(codigo, registro.codigoHash);
  if (!coincide) throw new AppError('Código incorrecto', 400);

  return registro;
};

exports.verificarCodigo = async (email, codigo) => {
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) throw new AppError('No existe una cuenta con ese correo', 404);
  await buscarCodigoValido(usuario.id, codigo);
};

exports.restablecerPassword = async (email, codigo, password) => {
  const usuario = await Usuario.scope('withPassword').findOne({ where: { email } });
  if (!usuario) throw new AppError('No existe una cuenta con ese correo', 404);

  const registro = await buscarCodigoValido(usuario.id, codigo);

  usuario.passwordHash = await hashPassword(password);
  await usuario.save();
  await registro.update({ usado: true });
};
