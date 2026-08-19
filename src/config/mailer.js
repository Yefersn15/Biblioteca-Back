const nodemailer = require('nodemailer');
const config = require('./env');

const configurado = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);

const transporter = configurado
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  : null;

module.exports = { transporter, configurado };
