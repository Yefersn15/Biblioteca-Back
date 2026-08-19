const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const crearSchema = z.object({
  nombres: z.string().min(2).max(100),
  apellidos: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  genero: z.enum(['HOMBRE', 'MUJER', 'OTRO']).optional(),
  tipoDocumento: z.enum(['CC', 'TI', 'PASAPORTE', 'CEDULA_EXTRANJERA']).optional(),
  documento: z.string().max(30).optional(),
  celular: z.string().max(20).optional(),
  direccion: z.string().max(200).optional(),
  barrio: z.string().max(100).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  rol: z.enum(['ADMIN', 'BIBLIOTECARIO', 'USUARIO']).optional(),
});

const actualizarSchema = z.object({
  nombres: z.string().min(2).max(100).optional(),
  apellidos: z.string().min(2).max(100).optional(),
  genero: z.enum(['HOMBRE', 'MUJER', 'OTRO']).optional(),
  celular: z.string().max(20).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  password: z.string().min(8).optional(),
  // Solo un ADMIN puede tocar estos campos (ver usuarios.service.actualizar):
  // documento e identidad no deberían cambiar libremente, y dirección/barrio
  // son datos de contacto que el propio usuario podría alterar por error.
  tipoDocumento: z.enum(['CC', 'TI', 'PASAPORTE', 'CEDULA_EXTRANJERA']).optional(),
  documento: z.string().max(30).optional(),
  direccion: z.string().max(200).optional(),
  barrio: z.string().max(100).optional(),
  rol: z.enum(['ADMIN', 'BIBLIOTECARIO', 'USUARIO']).optional(),
  estado: z.boolean().optional(),
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

module.exports = { validate, crearSchema, actualizarSchema };
