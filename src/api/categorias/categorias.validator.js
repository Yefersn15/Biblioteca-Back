const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const crearSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: z.string().trim().max(1000, 'La descripción no puede superar 1000 caracteres').optional(),
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
