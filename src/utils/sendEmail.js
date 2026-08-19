const { transporter, configurado } = require('../config/mailer');
const config = require('../config/env');

// Si no hay SMTP configurado, no se rompe el flujo (p. ej. registro o
// recuperación de contraseña no deben fallar por esto): simplemente se dejar
// constancia en el log del servidor, útil en desarrollo.
module.exports = async function sendEmail({ to, subject, html }) {
  if (!configurado) {
    console.warn(`[email] SMTP no configurado. Correo NO enviado a ${to}: "${subject}"`);
    return { enviado: false };
  }

  await transporter.sendMail({ from: config.smtp.from || config.smtp.user, to, subject, html });
  return { enviado: true };
};
