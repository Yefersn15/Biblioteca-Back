const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, Libro, Prestamo, Usuario } = require('../../models');
const repository = require('./prestamos.repository');
const AppError = require('../../utils/AppError');
const sendEmail = require('../../utils/sendEmail');
const { hashPassword } = require('../../utils/password');

const hoyISO = () => new Date().toISOString().slice(0, 10);

const fechaMasDias = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
};

exports.listar = async ({ requester, pagination, estado, vencidos, search }) => {
  const esStaff = ['ADMIN', 'BIBLIOTECARIO'].includes(requester.rol);
  const where = esStaff ? {} : { usuarioId: requester.id };
  if (vencidos) {
    // "Vencido" no es un estado propio: es un préstamo aprobado cuya fecha
    // de devolución ya pasó. Ignora el filtro de estado si se pide esto.
    where.estado = 'APROBADO';
    where.fechaDevolucionEstimada = { [Op.lt]: hoyISO() };
  } else if (estado) {
    where.estado = estado;
  }
  if (search) {
    const [libroIds, usuarioIds] = await Promise.all([
      repository.findIdsByLibroSearch(search),
      repository.findIdsByUsuarioSearch(search),
    ]);
    where[Op.or] = [{ libroId: libroIds }, { usuarioId: usuarioIds }];
  }
  return repository.findAndCountAll({ where, pagination });
};

exports.obtener = async (id, requester) => {
  const prestamo = await repository.findById(id);
  if (!prestamo) throw new AppError('Préstamo no encontrado', 404);

  const esStaff = ['ADMIN', 'BIBLIOTECARIO'].includes(requester.rol);
  if (!esStaff && prestamo.usuarioId !== requester.id) {
    throw new AppError('No tienes permisos para esta acción', 403);
  }
  return prestamo;
};

exports.solicitar = async (usuarioId, { libroId }) => {
  const libro = await Libro.findByPk(libroId);
  if (!libro || !libro.estado) throw new AppError('Libro no encontrado', 404);
  if (libro.copiasDisponibles < 1) throw new AppError('No hay copias disponibles de este libro', 409);

  const prestamo = await repository.create({
    libroId,
    usuarioId,
    fechaPrestamo: hoyISO(),
    estado: 'PENDIENTE',
  });
  return repository.findById(prestamo.id);
};

// Crea, dentro de la misma transacción del préstamo presencial, la cuenta
// de alguien que llega al mostrador sin haberse registrado antes. Rol fijo
// en USUARIO (nunca lo elige el bibliotecario) y contraseña aleatoria que
// nadie conoce: si esa persona luego quiere entrar a la web, la restablece
// con "¿Olvidaste tu contraseña?" usando este mismo correo.
const crearUsuarioDesdeMostrador = async (usuarioNuevo, t) => {
  const { nombres, apellidos, email, documento, celular } = usuarioNuevo;
  const condiciones = [{ email }];
  if (documento) condiciones.push({ documento });
  if (celular) condiciones.push({ celular });

  const existente = await Usuario.findOne({ where: { [Op.or]: condiciones }, transaction: t });
  if (existente) {
    if (existente.email === email) throw new AppError('Ya existe una cuenta con ese correo', 409);
    if (documento && existente.documento === documento) throw new AppError('Ese número de documento ya está registrado', 409);
    throw new AppError('Ese número de celular ya está registrado', 409);
  }

  const passwordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));
  return Usuario.create({ nombres, apellidos, email, documento, celular, passwordHash, rol: 'USUARIO' }, { transaction: t });
};

// Préstamo registrado por el bibliotecario en el mostrador (el libro ya se
// entregó en mano): a diferencia de `solicitar`, no pasa por PENDIENTE —
// queda APROBADO de una vez, con la misma validación de copias y la misma
// cola de espera automática que `aprobar`.
exports.registrarPresencial = (bibliotecarioId, { usuarioId, usuarioNuevo, libroId, fechaDevolucionEstimada }) =>
  sequelize.transaction(async (t) => {
    let usuario;
    if (usuarioNuevo) {
      usuario = await crearUsuarioDesdeMostrador(usuarioNuevo, t);
    } else {
      usuario = await Usuario.findByPk(usuarioId, { transaction: t });
      if (!usuario || !usuario.estado) throw new AppError('Usuario no encontrado', 404);
    }

    const hoy = hoyISO();
    if (fechaDevolucionEstimada < hoy) {
      throw new AppError('La fecha de devolución no puede ser anterior a hoy', 400);
    }

    const libro = await Libro.findByPk(libroId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!libro || !libro.estado) throw new AppError('Libro no encontrado', 404);
    if (libro.copiasDisponibles < 1) throw new AppError('No hay copias disponibles de este libro', 409);

    await libro.decrement('copiasDisponibles', { transaction: t });
    const prestamo = await repository.create(
      { libroId, usuarioId: usuario.id, fechaPrestamo: hoy, estado: 'APROBADO', bibliotecarioId, fechaDevolucionEstimada },
      { transaction: t },
    );

    // Igual que al aprobar: si esto agotó las copias, los pendientes de este
    // libro ya no se pueden cumplir y se rechazan automáticamente.
    await libro.reload({ transaction: t });
    if (libro.copiasDisponibles === 0) {
      await Prestamo.update(
        { estado: 'RECHAZADO', bibliotecarioId, observaciones: 'Rechazado automáticamente: sin copias disponibles' },
        { where: { libroId: libro.id, estado: 'PENDIENTE' }, transaction: t },
      );
    }

    return repository.findById(prestamo.id, { transaction: t });
  });

exports.aprobar = (id, bibliotecarioId, fechaDevolucionEstimada) =>
  sequelize.transaction(async (t) => {
    const prestamo = await repository.findById(id);
    if (!prestamo) throw new AppError('Préstamo no encontrado', 404);
    if (prestamo.estado !== 'PENDIENTE') throw new AppError('Solo se pueden aprobar préstamos pendientes', 409);
    if (fechaDevolucionEstimada < prestamo.fechaPrestamo) {
      throw new AppError('La fecha de devolución no puede ser anterior a la fecha de la solicitud', 400);
    }

    const libro = await Libro.findByPk(prestamo.libroId, { transaction: t, lock: t.LOCK.UPDATE });
    if (libro.copiasDisponibles < 1) throw new AppError('No hay copias disponibles de este libro', 409);

    await libro.decrement('copiasDisponibles', { transaction: t });
    await prestamo.update({ estado: 'APROBADO', bibliotecarioId, fechaDevolucionEstimada }, { transaction: t });

    // Si esa aprobación agotó las copias, los demás pendientes de este libro
    // ya no se pueden cumplir: se rechazan automáticamente (cola de espera).
    await libro.reload({ transaction: t });
    if (libro.copiasDisponibles === 0) {
      await Prestamo.update(
        { estado: 'RECHAZADO', bibliotecarioId, observaciones: 'Rechazado automáticamente: sin copias disponibles' },
        { where: { libroId: libro.id, estado: 'PENDIENTE', id: { [Op.ne]: id } }, transaction: t },
      );
    }

    return repository.findById(id, { transaction: t });
  });

exports.rechazar = async (id, bibliotecarioId, observaciones) => {
  const prestamo = await repository.findById(id);
  if (!prestamo) throw new AppError('Préstamo no encontrado', 404);
  if (prestamo.estado !== 'PENDIENTE') throw new AppError('Solo se pueden rechazar préstamos pendientes', 409);

  await prestamo.update({ estado: 'RECHAZADO', bibliotecarioId, observaciones });
  return repository.findById(id);
};

exports.devolver = (id, bibliotecarioId, observaciones) =>
  sequelize.transaction(async (t) => {
    const prestamo = await repository.findById(id);
    if (!prestamo) throw new AppError('Préstamo no encontrado', 404);
    if (prestamo.estado !== 'APROBADO') throw new AppError('Solo se pueden devolver préstamos aprobados', 409);

    const libro = await Libro.findByPk(prestamo.libroId, { transaction: t, lock: t.LOCK.UPDATE });
    await libro.update(
      { copiasDisponibles: Math.min(libro.copiasTotales, libro.copiasDisponibles + 1) },
      { transaction: t },
    );
    await prestamo.update(
      { estado: 'DEVUELTO', fechaDevolucionReal: hoyISO(), bibliotecarioId, observaciones },
      { transaction: t },
    );

    // Cola de espera: si alguien más pedía este libro, se le aprueba
    // automáticamente al más antiguo en cuanto queda una copia libre.
    const siguienteEnEspera = await Prestamo.findOne({
      where: { libroId: libro.id, estado: 'PENDIENTE' },
      order: [['createdAt', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (siguienteEnEspera) {
      await libro.decrement('copiasDisponibles', { transaction: t });
      await siguienteEnEspera.update({ estado: 'APROBADO', bibliotecarioId }, { transaction: t });
    }

    return repository.findById(id, { transaction: t });
  });

// Avisa por correo a quien tiene un préstamo aprobado cuya fecha de
// devolución cae dentro de 1 o 2 días. Pensado para correrse una vez al día
// (ver src/jobs/recordatoriosPrestamos.js); `recordatorioEnviado` evita que
// se le avise dos veces al mismo préstamo.
exports.enviarRecordatoriosVencimiento = async () => {
  const prestamos = await Prestamo.findAll({
    where: {
      estado: 'APROBADO',
      recordatorioEnviado: false,
      fechaDevolucionEstimada: { [Op.in]: [fechaMasDias(1), fechaMasDias(2)] },
    },
    include: [{ model: Libro, as: 'libro' }, { model: Usuario, as: 'usuario' }],
  });

  for (const prestamo of prestamos) {
    const diasRestantes = prestamo.fechaDevolucionEstimada === fechaMasDias(1) ? 1 : 2;
    await sendEmail({
      to: prestamo.usuario.email,
      subject: `Tu préstamo vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`,
      html: `
        <p>Hola ${prestamo.usuario.nombres},</p>
        <p>Te recordamos que el préstamo de <strong>${prestamo.libro.titulo}</strong> debe devolverse el <strong>${prestamo.fechaDevolucionEstimada}</strong> (en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}).</p>
        <p>Si ya lo devolviste o necesitas más tiempo, contacta a la biblioteca.</p>
      `,
    });
    await prestamo.update({ recordatorioEnviado: true });
  }

  return prestamos.length;
};

const diasDeAtraso = (fechaDevolucionEstimadaISO) => {
  const unDiaMs = 24 * 60 * 60 * 1000;
  return Math.round((new Date(hoyISO()) - new Date(fechaDevolucionEstimadaISO)) / unDiaMs);
};

// Hitos de atraso que se avisan una sola vez cada uno: 1 día, 1 semana, 1 mes.
const HITOS_ATRASO = [
  { dias: 1, etiqueta: '1 día' },
  { dias: 7, etiqueta: '1 semana' },
  { dias: 30, etiqueta: '1 mes' },
];

// Avisa por correo cuando un préstamo aprobado ya pasó su fecha de
// devolución, a diferencia de `enviarRecordatoriosVencimiento` (antes de
// vencer). `diasAtrasoAvisado` guarda el hito más grande ya notificado para
// no repetir el mismo aviso en cada corrida del job ni saltarse ninguno si
// el job estuvo caído varios días.
exports.enviarAvisosVencidos = async () => {
  const prestamos = await Prestamo.findAll({
    where: { estado: 'APROBADO', fechaDevolucionEstimada: { [Op.lt]: hoyISO() } },
    include: [{ model: Libro, as: 'libro' }, { model: Usuario, as: 'usuario' }],
  });

  let enviados = 0;
  for (const prestamo of prestamos) {
    const atraso = diasDeAtraso(prestamo.fechaDevolucionEstimada);
    const yaAvisado = prestamo.diasAtrasoAvisado || 0;
    const hito = [...HITOS_ATRASO].reverse().find((h) => atraso >= h.dias && yaAvisado < h.dias);
    if (!hito) continue;

    await sendEmail({
      to: prestamo.usuario.email,
      subject: `Tu préstamo está vencido hace ${hito.etiqueta}`,
      html: `
        <p>Hola ${prestamo.usuario.nombres},</p>
        <p>El préstamo de <strong>${prestamo.libro.titulo}</strong> debía devolverse el <strong>${prestamo.fechaDevolucionEstimada}</strong> y ya lleva ${hito.etiqueta} de atraso.</p>
        <p>Por favor devuélvelo lo antes posible, o contacta a la biblioteca si necesitas más tiempo.</p>
      `,
    });
    await prestamo.update({ diasAtrasoAvisado: hito.dias });
    enviados++;
  }

  return enviados;
};
