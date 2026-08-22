const { Op } = require('sequelize');
const { sequelize, Libro, Prestamo } = require('../../models');
const repository = require('./prestamos.repository');
const AppError = require('../../utils/AppError');

const hoyISO = () => new Date().toISOString().slice(0, 10);

exports.listar = ({ requester, pagination, estado, vencidos }) => {
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
