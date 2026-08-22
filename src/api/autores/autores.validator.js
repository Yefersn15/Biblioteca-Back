const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const redesSocialesSchema = z.object({
  facebook: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  biografiaUrl: z.string().url().optional().or(z.literal('')),
}).optional();

const crearSchema = z.object({
  nombre: z.string().min(2).max(150),
  apellido: z.string().max(150).optional(),
  nacionalidad: z.string().max(100).optional(),
  generoLiterario: z.array(z.coerce.number().int().positive()).optional(),
  biografia: z.string().max(5000).optional(),
  fotografiaUrl: z.string().url().optional().or(z.literal('')),
  idiomaPrincipal: z.string().max(60).optional(),
  obrasDestacadas: z.array(z.coerce.number().int().positive()).optional(),
  premios: z.array(z.string().max(200)).optional(),
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
