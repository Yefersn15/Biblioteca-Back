const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

const crearSchema = z.object({
  titulo: z.string().min(1).max(200),
  autorIds: z.array(z.coerce.number().int().positive()).min(1, 'Debe indicar al menos un autor'),
  editorialId: z.coerce.number().int().positive().optional(),
  tipo: z.enum(['LIBRO', 'REVISTA', 'PERIODICO', 'GUIA']).optional(),
  descripcion: z.string().max(5000).optional(),
  portadaUrl: z.string().url().optional(),
  isbn: z.string().max(20).optional(),
  anioPublicacion: z.coerce.number().int().min(1000).max(3000).optional(),
  idioma: z.string().max(60).optional(),
  archivoUrl: z.string().url().optional(),
  etiquetas: z.array(z.string().max(50)).optional(),
  paginas: z.coerce.number().int().min(1).optional(),
  copiasTotales: z.coerce.number().int().min(1).optional(),
  categoriaIds: z.array(z.coerce.number().int().positive()).optional(),
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
