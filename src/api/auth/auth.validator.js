const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');
const { PASSWORD_FUERTE_REGEX, MENSAJE_PASSWORD_FUERTE } = require('../../utils/passwordPolicy');

const registroSchema = z.object({
  nombres: z.string().trim().min(2, 'Los nombres deben tener al menos 2 caracteres').max(100, 'Los nombres no pueden superar 100 caracteres'),
  apellidos: z.string().trim().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(100, 'Los apellidos no pueden superar 100 caracteres'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(PASSWORD_FUERTE_REGEX, MENSAJE_PASSWORD_FUERTE),
  genero: z.enum(['HOMBRE', 'MUJER', 'OTRO']),
  tipoDocumento: z.enum(['CC', 'TI', 'PASAPORTE', 'CEDULA_EXTRANJERA']),
  documento: z.string().trim().min(6, 'El documento debe tener al menos 6 caracteres').max(30, 'El documento no puede superar 30 caracteres'),
  celular: z.string().trim().min(7, 'El celular debe tener al menos 7 dígitos').max(20, 'El celular no puede superar 20 caracteres'),
  direccion: z.string().trim().min(3, 'La dirección debe tener al menos 3 caracteres').max(200, 'La dirección no puede superar 200 caracteres'),
  barrio: z.string().trim().min(2, 'El barrio debe tener al menos 2 caracteres').max(100, 'El barrio no puede superar 100 caracteres'),
  avatar: z.string().trim().url('La URL de la foto no es válida').optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
});

const verifyTokenSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  token: z.string().trim().min(20, 'El enlace es inválido o ya expiró'),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  token: z.string().trim().min(20, 'El enlace es inválido o ya expiró'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(PASSWORD_FUERTE_REGEX, MENSAJE_PASSWORD_FUERTE),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const primerError = result.error.issues[0];
    return errorResponse(res, primerError?.message || 'Datos inválidos', 400);
  }
  req.body = result.data;
  next();
};

module.exports = {
  validate,
  registroSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyTokenSchema,
  resetPasswordSchema,
};
