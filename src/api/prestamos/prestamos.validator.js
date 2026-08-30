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

// Datos mínimos para crear, desde el mostrador, la cuenta de alguien que
// llega sin haberse registrado antes. Se completan aparte con una
// contraseña aleatoria (ver prestamos.service.js): si esa persona luego
// quiere entrar a la web, usa "¿Olvidaste tu contraseña?" con este correo.
const usuarioNuevoSchema = z.object({
  nombres: z.string().trim().min(2, 'Los nombres deben tener al menos 2 caracteres').max(100, 'Los nombres no pueden superar 100 caracteres'),
  apellidos: z.string().trim().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(100, 'Los apellidos no pueden superar 100 caracteres'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  documento: z.string().trim().min(6, 'El documento debe tener al menos 6 caracteres').max(30, 'El documento no puede superar 30 caracteres').optional(),
  celular: z.string().trim().max(20, 'El celular no puede superar 20 caracteres').optional(),
});

// Para cuando el bibliotecario registra en el mostrador un préstamo que ya
// se entregó en mano: a diferencia de `solicitarSchema` (lo llena quien
// pide el libro, sobre su propia cuenta), acá el bibliotecario elige el
// libro y, o bien un usuario ya registrado (usuarioId), o los datos de uno
// nuevo (usuarioNuevo) — exactamente uno de los dos, nunca ambos ni ninguno.
const registrarPresencialSchema = z.object({
  usuarioId: z.coerce.number().int().positive().optional(),
  usuarioNuevo: usuarioNuevoSchema.optional(),
  libroId: z.coerce.number().int().positive(),
  fechaDevolucionEstimada: z.string().date(),
}).refine((data) => Boolean(data.usuarioId) !== Boolean(data.usuarioNuevo), {
  message: 'Indica un usuario registrado o los datos de uno nuevo, no ambos',
  path: ['usuarioId'],
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

module.exports = { validate, solicitarSchema, gestionarSchema, aprobarSchema, registrarPresencialSchema };
