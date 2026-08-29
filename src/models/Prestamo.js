const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prestamo = sequelize.define('Prestamo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  libroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'libro_id',
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
  bibliotecarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'bibliotecario_id',
    // Usuario con rol ADMIN/BIBLIOTECARIO que aprobó, rechazó o registró la
    // devolución. Queda null mientras el préstamo está PENDIENTE.
  },
  fechaPrestamo: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'fecha_prestamo',
  },
  fechaDevolucionEstimada: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'fecha_devolucion_estimada',
    // Null mientras el préstamo está PENDIENTE: la pone el bibliotecario al
    // aprobar, no quien solicita.
  },
  fechaDevolucionReal: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'fecha_devolucion_real',
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'DEVUELTO'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recordatorioEnviado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'recordatorio_enviado',
    // Evita reenviar el correo de "tu préstamo vence pronto" en cada corrida
    // del job (ver src/jobs/recordatoriosPrestamos.js): se marca en true la
    // primera vez que se avisa y no se vuelve a tocar.
  },
}, {
  tableName: 'prestamos',
  timestamps: true,
});

module.exports = Prestamo;
