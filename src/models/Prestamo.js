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
    allowNull: false,
    field: 'fecha_devolucion_estimada',
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
}, {
  tableName: 'prestamos',
  timestamps: true,
});

module.exports = Prestamo;
