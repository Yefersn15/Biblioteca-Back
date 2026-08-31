const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');

// ISBN-10 o ISBN-13, ignorando guiones/espacios; no valida el dígito
// verificador, solo la forma (misma regla que en el frontend, ver
// src/validations/isbn.js). Cadena vacía se deja pasar aquí porque el campo
// es opcional; z.literal('') más abajo cubre ese caso.
const ISBN_REGEX = /^(?:\d{9}[\dXx]|\d{13})$/;

const crearSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(200, 'El título no puede superar 200 caracteres'),
  autorIds: z.array(z.coerce.number().int().positive()).min(1, 'Debe indicar al menos un autor'),
  editorialId: z.coerce.number().int().positive().optional(),
  tipo: z.enum(['LIBRO', 'REVISTA', 'PERIODICO', 'GUIA']).optional(),
  descripcion: z.string().trim().max(5000, 'La descripción no puede superar 5000 caracteres').optional(),
  portadaUrl: z.string().trim().url('La URL de la portada no es válida').optional().or(z.literal('')),
  portadaPublicId: z.string().trim().max(200).nullable().optional(),
  isbn: z.string().trim()
    .transform((v) => v.replace(/[-\s]/g, ''))
    .refine((v) => v === '' || ISBN_REGEX.test(v), 'El ISBN debe tener 10 o 13 dígitos')
    .optional(),
  anioPublicacion: z.coerce.number().int().min(1000, 'El año de publicación no es válido').max(3000, 'El año de publicación no es válido').optional(),
  idioma: z.string().trim().max(60, 'El idioma no puede superar 60 caracteres').optional(),
  archivoUrl: z.string().trim().url('La URL del archivo no es válida').optional().or(z.literal('')),
  paginas: z.coerce.number().int().min(1, 'Debe tener al menos 1 página').optional(),
  copiasTotales: z.coerce.number().int().min(1, 'Debe haber al menos 1 copia').optional(),
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
