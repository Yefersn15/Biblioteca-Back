const { z } = require('zod');
const { errorResponse } = require('../../utils/helpers');
const { PASSWORD_FUERTE_REGEX, MENSAJE_PASSWORD_FUERTE } = require('../../utils/passwordPolicy');

const crearSchema = z.object({
  nombres: z.string().trim().min(2, 'Los nombres deben tener al menos 2 caracteres').max(100, 'Los nombres no pueden superar 100 caracteres'),
  apellidos: z.string().trim().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(100, 'Los apellidos no pueden superar 100 caracteres'),
  email: z.string().trim().email('Ingresa un correo electrónico válido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(PASSWORD_FUERTE_REGEX, MENSAJE_PASSWORD_FUERTE),
  genero: z.enum(['HOMBRE', 'MUJER', 'OTRO']).optional(),
  tipoDocumento: z.enum(['CC', 'TI', 'PASAPORTE', 'CEDULA_EXTRANJERA']).optional(),
  // .or(z.literal('').transform(() => undefined)): el formulario de creación
  // manual de un admin deja este campo en blanco por defecto si no se llena
  // (es opcional). Sin el transform, el min() lo rechazaría como dato
  // inválido; si se aceptara la cadena vacía tal cual, se guardaría "" en la
  // columna (que es unique) y la siguiente cuenta sin documento chocaría
  // contra ese mismo valor.
  documento: z.string().trim().min(6, 'El documento debe tener al menos 6 caracteres').max(30, 'El documento no puede superar 30 caracteres').optional().or(z.literal('').transform(() => undefined)),
  celular: z.string().trim().max(20, 'El celular no puede superar 20 caracteres').optional(),
  direccion: z.string().trim().max(200, 'La dirección no puede superar 200 caracteres').optional(),
  barrio: z.string().trim().max(100, 'El barrio no puede superar 100 caracteres').optional(),
  avatar: z.string().trim().url('La URL de la foto no es válida').optional().or(z.literal('')),
  avatarPublicId: z.string().trim().max(200).nullable().optional(),
  rol: z.enum(['ADMIN', 'BIBLIOTECARIO', 'USUARIO']).optional(),
});

const actualizarSchema = z.object({
  genero: z.enum(['HOMBRE', 'MUJER', 'OTRO']).optional(),
  celular: z.string().trim().max(20, 'El celular no puede superar 20 caracteres').optional(),
  avatar: z.string().trim().url('La URL de la foto no es válida').optional().or(z.literal('')),
  avatarPublicId: z.string().trim().max(200).nullable().optional(),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(PASSWORD_FUERTE_REGEX, MENSAJE_PASSWORD_FUERTE)
    .optional(),
  // Solo un ADMIN puede tocar estos campos (ver usuarios.service.actualizar):
  // nombre, documento y dirección son datos de identidad y contacto que no
  // deberían cambiar libremente (evita que alguien se haga pasar por otra
  // persona tras un préstamo).
  nombres: z.string().trim().min(2, 'Los nombres deben tener al menos 2 caracteres').max(100, 'Los nombres no pueden superar 100 caracteres').optional(),
  apellidos: z.string().trim().min(2, 'Los apellidos deben tener al menos 2 caracteres').max(100, 'Los apellidos no pueden superar 100 caracteres').optional(),
  tipoDocumento: z.enum(['CC', 'TI', 'PASAPORTE', 'CEDULA_EXTRANJERA']).optional(),
  // .or(z.literal('').transform(() => undefined)): algunas cuentas (p. ej. el
  // ADMIN sembrado por seedAdmin.js) no tienen documento cargado todavía; el
  // formulario de edición reenvía el valor tal cual está (vacío) cuando no se
  // modifica. Sin el transform, el min() lo rechazaría como dato inválido; si
  // solo se aceptara la cadena vacía tal cual, se guardaría "" en la columna
  // (que es unique) y la siguiente cuenta sin documento chocaría contra ese
  // mismo valor. Al convertirlo a undefined, el service simplemente no toca
  // el campo (ver CAMPOS_SOLO_ADMIN en usuarios.service.js).
  documento: z.string().trim().min(6, 'El documento debe tener al menos 6 caracteres').max(30, 'El documento no puede superar 30 caracteres').optional().or(z.literal('').transform(() => undefined)),
  direccion: z.string().trim().max(200, 'La dirección no puede superar 200 caracteres').optional(),
  barrio: z.string().trim().max(100, 'El barrio no puede superar 100 caracteres').optional(),
  rol: z.enum(['ADMIN', 'BIBLIOTECARIO', 'USUARIO']).optional(),
  estado: z.boolean().optional(),
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

module.exports = { validate, crearSchema, actualizarSchema };
