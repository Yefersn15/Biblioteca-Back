const { Usuario } = require('../models');
const config = require('../config/env');
const AppError = require('./AppError');

// Id del usuario creado por `npm run seed:db` (ver Usuario.esAdminPrincipal).
// Se resuelve por email en cada llamada: es una app pequeña, no vale la pena
// cachear y arriesgarse a servir un id viejo si el admin cambia de correo.
const getAdminPrincipalId = async () => {
  if (!config.adminEmail) return null;
  const admin = await Usuario.findOne({ where: { email: config.adminEmail }, attributes: ['id'] });
  return admin ? admin.id : null;
};
exports.getAdminPrincipalId = getAdminPrincipalId;

exports.esAdminPrincipal = async (req) => {
  if (!req.user) return false;
  const adminId = await getAdminPrincipalId();
  return adminId !== null && req.user.id === adminId;
};

// Bloquea actualizar/eliminar un registro creado por el admin principal
// cuando quien lo pide no es esa misma cuenta.
exports.assertPuedeModificar = async (registro, usuarioActualId) => {
  const adminId = await getAdminPrincipalId();
  if (adminId !== null && registro.creadoPorId === adminId && usuarioActualId !== adminId) {
    throw new AppError('Este registro fue creado por el administrador principal: solo esa cuenta puede modificarlo o eliminarlo', 403);
  }
};

// Quita el dato de "creado por" de la respuesta salvo que quien pregunta sea
// el admin principal.
exports.ocultarCreadoPor = (datos, mostrar) => {
  if (mostrar) return datos;
  const limpiar = (item) => {
    if (!item) return item;
    const plano = typeof item.toJSON === 'function' ? item.toJSON() : { ...item };
    delete plano.creadoPorId;
    delete plano.creadoPor;
    return plano;
  };
  return Array.isArray(datos) ? datos.map(limpiar) : limpiar(datos);
};
