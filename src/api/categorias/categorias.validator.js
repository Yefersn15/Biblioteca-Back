const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const crearSchema = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(1000).optional(),
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
