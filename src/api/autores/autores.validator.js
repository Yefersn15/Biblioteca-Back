const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const redesSocialesSchema = z.object({
  facebook: z.string().trim().url('URL de Facebook inválida').optional().or(z.literal('')),
  twitter: z.string().trim().url('URL de Twitter/X inválida').optional().or(z.literal('')),
  instagram: z.string().trim().url('URL de Instagram inválida').optional().or(z.literal('')),
  biografiaUrl: z.string().trim().url('URL de biografía inválida').optional().or(z.literal('')),
}).optional();

const crearSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'El nombre no puede superar 150 caracteres'),
  apellido: z.string().trim().max(150, 'El apellido no puede superar 150 caracteres').optional(),
  nacionalidad: z.string().trim().max(100, 'La nacionalidad no puede superar 100 caracteres').optional(),
  generoLiterario: z.array(z.coerce.number().int().positive()).optional(),
  biografia: z.string().trim().max(5000, 'La biografía no puede superar 5000 caracteres').optional(),
  fotografiaUrl: z.string().trim().url('La URL de la fotografía no es válida').optional().or(z.literal('')),
  idiomaPrincipal: z.string().trim().max(60, 'El idioma no puede superar 60 caracteres').optional(),
  obrasDestacadas: z.array(z.coerce.number().int().positive()).optional(),
  premios: z.array(z.string().trim().max(200, 'Cada premio no puede superar 200 caracteres')).optional(),
  redesSociales: redesSocialesSchema,
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
