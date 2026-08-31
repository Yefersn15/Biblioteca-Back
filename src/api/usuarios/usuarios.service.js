const repository = require('./usuarios.repository');
const { hashPassword } = require('../../utils/password');
const AppError = require('../../utils/AppError');
const uploadService = require('../upload/upload.service');

const CAMPOS_SOLO_ADMIN = ['nombres', 'apellidos', 'tipoDocumento', 'documento', 'direccion', 'barrio'];

exports.listar = ({ pagination, search, rol, estado }) => {
  // El query param llega como string ('true'/'false'); solo se convierte a
  // boolean cuando efectivamente se envió el filtro.
  const estadoBool = estado === undefined ? undefined : estado === 'true';
  const where = repository.buildWhere({ search, rol, estado: estadoBool });
  return repository.findAndCountAll({ where, pagination });
};

exports.obtener = async (id) => {
  const usuario = await repository.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  return usuario;
};

exports.crear = async (data) => {
  const existente = await repository.findByUniqueFields({
    email: data.email,
    documento: data.documento,
    celular: data.celular,
  });
  if (existente) {
    if (existente.email === data.email) throw new AppError('Ya existe un usuario con ese correo', 409);
    if (existente.documento === data.documento) throw new AppError('Ese número de documento ya está registrado', 409);
    throw new AppError('Ese número de celular ya está registrado', 409);
  }

  const passwordHash = await hashPassword(data.password);
  const usuario = await repository.create({
    nombres: data.nombres,
    apellidos: data.apellidos,
    email: data.email,
    genero: data.genero,
    tipoDocumento: data.tipoDocumento,
    documento: data.documento,
    celular: data.celular,
    direccion: data.direccion,
    barrio: data.barrio,
    avatar: data.avatar,
    avatarPublicId: data.avatarPublicId,
    passwordHash,
    rol: data.rol || 'USUARIO',
  });
  // Model.create() devuelve la instancia recién insertada sin pasar por el
  // defaultScope que oculta passwordHash en las consultas normales.
  usuario.passwordHash = undefined;
  return usuario;
};

exports.actualizar = async (id, data, requester) => {
  const usuario = await repository.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  const esAdmin = requester.rol === 'ADMIN';
  const esPropio = requester.id === usuario.id;
  if (!esAdmin && !esPropio) throw new AppError('No tienes permisos para esta acción', 403);

  // La cuenta creada por `npm run seed:db` está por encima de todos,
  // incluidos otros ADMIN: nadie más puede tocarla, y ni ella misma puede
  // cambiar su rol, desactivarse o cambiar su contraseña desde la app (solo
  // sus datos de contacto/perfil normales).
  if (usuario.esAdminPrincipal && !esPropio) {
    throw new AppError('La cuenta del administrador principal no puede ser modificada por otro usuario.', 403);
  }
  if (usuario.esAdminPrincipal && (data.rol !== undefined || data.estado !== undefined || data.password)) {
    throw new AppError('La cuenta del administrador principal no puede cambiar de rol, desactivarse ni cambiar su contraseña desde la aplicación. Usa "npm run seed:db" en el servidor.', 403);
  }

  // Solo un ADMIN puede reasignar rol o habilitar/deshabilitar cuentas,
  // incluso si es su propio usuario (evita que se autopromueva un no-admin).
  if ((data.rol !== undefined || data.estado !== undefined) && !esAdmin) {
    throw new AppError('Solo un administrador puede cambiar rol o estado', 403);
  }

  // Nombre, documento y dirección son datos de identidad y contacto que el
  // bibliotecario necesita poder confiar; un USUARIO no puede autoeditarlos
  // (evita que alguien se haga pasar por otra persona tras un préstamo).
  if (!esAdmin) {
    const intentaCampoRestringido = CAMPOS_SOLO_ADMIN.some((campo) => data[campo] !== undefined);
    if (intentaCampoRestringido) {
      throw new AppError('Solo un administrador puede cambiar esos datos. Contacta a un administrador.', 403);
    }
  }

  if (data.documento !== undefined && data.documento !== usuario.documento) {
    const dup = await repository.findByUniqueFields({ documento: data.documento, excludeId: id });
    if (dup) throw new AppError('Ese número de documento ya está registrado', 409);
  }
  if (data.celular !== undefined && data.celular !== usuario.celular) {
    const dup = await repository.findByUniqueFields({ celular: data.celular, excludeId: id });
    if (dup) throw new AppError('Ese número de celular ya está registrado', 409);
  }

  const camposEditables = ['genero', 'celular', 'avatar', 'avatarPublicId', ...CAMPOS_SOLO_ADMIN];
  const cambios = {};
  for (const campo of camposEditables) {
    if (data[campo] !== undefined) cambios[campo] = data[campo];
  }
  if (data.rol !== undefined) cambios.rol = data.rol;
  if (data.estado !== undefined) cambios.estado = data.estado;
  if (data.password) cambios.passwordHash = await hashPassword(data.password);

  const avatarPublicIdAnterior = usuario.avatarPublicId;
  await usuario.update(cambios);
  if (data.avatar !== undefined && avatarPublicIdAnterior && avatarPublicIdAnterior !== data.avatarPublicId) {
    await uploadService.eliminarImagen(avatarPublicIdAnterior);
  }
  // Si se cambió la contraseña, el hash queda cargado en la instancia (el
  // defaultScope solo afecta a las consultas, no a un valor recién asignado
  // con .update()); se limpia antes de devolverlo.
  usuario.passwordHash = undefined;
  return usuario;
};

exports.eliminar = async (id) => {
  const usuario = await repository.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  if (usuario.esAdminPrincipal) {
    throw new AppError('La cuenta del administrador principal no se puede desactivar.', 403);
  }
  // Baja lógica: preserva la integridad referencial con los préstamos ya
  // asociados a este usuario en lugar de borrarlo físicamente.
  await usuario.update({ estado: false });
};
