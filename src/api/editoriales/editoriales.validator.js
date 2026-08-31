const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const crearSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'El nombre no puede superar 150 caracteres'),
  descripcion: z.string().trim().max(2000, 'La descripción no puede superar 2000 caracteres').optional().or(z.literal('')),
  logoUrl: z.string().trim().url('La URL del logo no es válida').optional().or(z.literal('')),
  logoPublicId: z.string().trim().max(200).nullable().optional(),
  sitioWeb: z.string().trim().url('La URL del sitio web no es válida').optional().or(z.literal('')),
  estado: z.boolean().optional(),
});

const actualizarSchema = crearSchema.partial();

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
