const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const registroSchema = z.object({
  nombres: z.string().min(2).max(100),
  apellidos: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  genero: z.enum(['HOMBRE', 'MUJER', 'OTRO']),
  tipoDocumento: z.enum(['CC', 'TI', 'PASAPORTE', 'CEDULA_EXTRANJERA']),
  documento: z.string().min(6, 'El documento debe tener al menos 6 caracteres').max(30),
  celular: z.string().min(7).max(20),
  direccion: z.string().min(3).max(200),
  barrio: z.string().min(2).max(100),
  avatar: z.string().url().optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const verifyCodeSchema = z.object({
  email: z.string().email(),
  codigo: z.string().length(6),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  codigo: z.string().length(6),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
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
  verifyCodeSchema,
  resetPasswordSchema,
};
