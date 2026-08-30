const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const solicitarSchema = z.object({
  libroId: z.coerce.number().int().positive(),
});

const gestionarSchema = z.object({
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar 1000 caracteres').optional(),
});

// La fecha de devolución la fija el bibliotecario al aprobar, no quien
// solicita. Se valida aquí (formato) y otra vez en el service contra
// fechaPrestamo (no puede ser anterior al día de la solicitud), porque acá
// no tenemos el préstamo cargado todavía para comparar fechas.
const aprobarSchema = z.object({
  fechaDevolucionEstimada: z.string().date(),
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

module.exports = { validate, solicitarSchema, gestionarSchema, aprobarSchema };
