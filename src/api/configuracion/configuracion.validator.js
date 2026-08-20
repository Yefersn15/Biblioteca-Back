const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const DIAS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM', 'FESTIVOS'];
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

const temaSchema = z.object({
  modo: z.enum(['NINGUNO', 'PREDEFINIDO', 'PERSONALIZADO']),
  paletaId: z.string().max(50).nullable().optional(),
  colores: z
    .object({
      fondo: z.string().regex(HEX_REGEX, 'Debe ser un color hex, ej. #eef5f9'),
      superficie: z.string().regex(HEX_REGEX, 'Debe ser un color hex, ej. #ffffff'),
      encabezado: z.string().regex(HEX_REGEX, 'Debe ser un color hex, ej. #0b3d5c'),
      acento: z.string().regex(HEX_REGEX, 'Debe ser un color hex, ej. #1f8fce'),
      secundario: z.string().regex(HEX_REGEX, 'Debe ser un color hex, ej. #5c4326'),
    })
    .nullable()
    .optional(),
});

const reglaHorarioSchema = z
  .object({
    dias: z.array(z.enum(DIAS)).min(1, 'Cada grupo de horario necesita al menos un día seleccionado'),
    cerrado: z.boolean(),
    apertura: z.string().regex(HORA_REGEX, 'Hora inválida').optional(),
    cierre: z.string().regex(HORA_REGEX, 'Hora inválida').optional(),
  })
  .refine((regla) => regla.cerrado || (regla.apertura && regla.cierre), {
    message: 'Indica hora de apertura y cierre, o marca el grupo como cerrado',
  });

const actualizarSchema = z.object({
  nombreInstitucion: z.string().min(2).max(150).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  descripcion: z.string().max(2000).optional().or(z.literal('')),
  direccion: z.string().max(200).optional().or(z.literal('')),
  telefono: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  horario: z.array(reglaHorarioSchema).max(20).optional(),
  mapaEmbedUrl: z.string().url().optional().or(z.literal('')),
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
