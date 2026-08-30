const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const DIAS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM', 'FESTIVOS'];
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const temaSchema = z.object({
  modo: z.enum(['NINGUNO', 'PREDEFINIDO', 'PERSONALIZADO']),
  paletaId: z.string().trim().max(50, 'El id de paleta no es válido').nullable().optional(),
  colores: z
    .object({
      fondo: z.string().trim().regex(HEX_REGEX, 'Debe ser un color hex, ej. #eef5f9'),
      superficie: z.string().trim().regex(HEX_REGEX, 'Debe ser un color hex, ej. #ffffff'),
      encabezado: z.string().trim().regex(HEX_REGEX, 'Debe ser un color hex, ej. #0b3d5c'),
      acento: z.string().trim().regex(HEX_REGEX, 'Debe ser un color hex, ej. #1f8fce'),
      secundario: z.string().trim().regex(HEX_REGEX, 'Debe ser un color hex, ej. #5c4326'),
    })
    .nullable()
    .optional(),
});

const reglaHorarioSchema = z
  .object({
    dias: z.array(z.enum(DIAS)).min(1, 'Cada grupo de horario necesita al menos un día seleccionado'),
    cerrado: z.boolean(),
    apertura: z.string().trim().regex(HORA_REGEX, 'Hora inválida').optional(),
    cierre: z.string().trim().regex(HORA_REGEX, 'Hora inválida').optional(),
  })
  .refine((regla) => regla.cerrado || (regla.apertura && regla.cierre), {
    message: 'Indica hora de apertura y cierre, o marca el grupo como cerrado',
  })
  // Comparación de texto válida aquí porque HORA_REGEX ya garantiza el
  // formato HH:MM de 24 horas con cero a la izquierda (mismo criterio que
  // usa HorarioBuilder.jsx en el frontend para el mismo chequeo).
  .refine((regla) => regla.cerrado || !regla.apertura || !regla.cierre || regla.cierre > regla.apertura, {
    message: 'La hora de cierre debe ser posterior a la de apertura',
    path: ['cierre'],
  });

const actualizarSchema = z.object({
  nombreInstitucion: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'El nombre no puede superar 150 caracteres').optional(),
  logoUrl: z.string().trim().url('La URL del logo no es válida').optional().or(z.literal('')),
  descripcion: z.string().trim().max(2000, 'La descripción no puede superar 2000 caracteres').optional().or(z.literal('')),
  direccion: z.string().trim().max(200, 'La dirección no puede superar 200 caracteres').optional().or(z.literal('')),
  telefono: z.string().trim().max(30, 'El teléfono no puede superar 30 caracteres').optional().or(z.literal('')),
  email: z.string().trim().email('Ingresa un correo electrónico válido').optional().or(z.literal('')),
  horario: z.array(reglaHorarioSchema).max(20, 'No puede haber más de 20 grupos de horario').optional(),
  mapaEmbedUrl: z.string().trim().url('La URL del mapa no es válida').optional().or(z.literal('')),
  tema: temaSchema.optional(),
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

module.exports = { validate, actualizarSchema, DIAS };
