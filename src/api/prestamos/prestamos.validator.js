const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const solicitarSchema = z.object({
  libroId: z.coerce.number().int().positive(),
  fechaDevolucionEstimada: z.string().date(),
});

const gestionarSchema = z.object({
  observaciones: z.string().max(1000).optional(),
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

module.exports = { validate, solicitarSchema, gestionarSchema };
