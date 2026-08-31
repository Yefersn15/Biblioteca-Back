const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const config = require('../config/env');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash',
  },
  genero: {
    type: DataTypes.ENUM('HOMBRE', 'MUJER', 'OTRO'),
    allowNull: true,
  },
  tipoDocumento: {
    type: DataTypes.ENUM('CC', 'TI', 'PASAPORTE', 'CEDULA_EXTRANJERA'),
    allowNull: true,
    field: 'tipo_documento',
  },
  documento: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
  },
  celular: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  barrio: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatarPublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'avatar_public_id',
    // public_id de Cloudinary de `avatar` (ver Autor.fotografiaPublicId).
  },
  rol: {
    type: DataTypes.ENUM('ADMIN', 'BIBLIOTECARIO', 'USUARIO'),
    allowNull: false,
    defaultValue: 'USUARIO',
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  // No es una columna real: identifica a la cuenta creada por `npm run
  // seed:db` (la del correo en ADMIN_EMAIL) para bloquear en el servicio
  // cualquier intento de cambiarle el rol, desactivarla o cambiarle la
  // contraseña desde la aplicación, sin importar quién lo pida.
  esAdminPrincipal: {
    type: DataTypes.VIRTUAL,
    get() {
      return Boolean(config.adminEmail) && this.getDataValue('email') === config.adminEmail;
    },
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['passwordHash'] },
  },
  scopes: {
    withPassword: { attributes: {} },
  },
});

module.exports = Usuario;
