// Regla de contraseña compartida por todo lo que establece una contraseña
// (registro, restablecer por enlace, perfil, edición de usuario desde admin):
// al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo — además del
// mínimo de 8 caracteres que se exige aparte con z.string().min(8).
exports.PASSWORD_FUERTE_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
exports.MENSAJE_PASSWORD_FUERTE = 'Debe incluir mayúscula, minúscula, número y símbolo';
