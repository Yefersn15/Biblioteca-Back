const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const crearSchema = z.object({
  nombre: z.string().min(2).max(150),
  descripcion: z.string().max(2000).optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  sitioWeb: z.string().url().optional().or(z.literal('')),
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
