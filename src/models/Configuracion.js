const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Fila única (singleton, id siempre 1): datos de la institución que
// personalizan todo el sitio (Header, Footer, Home, panel admin) sin tocar
// código — así cualquiera que despliegue este proyecto puede verlo con el
// nombre/logo/ubicación de su propia biblioteca.
const Configuracion = sequelize.define('Configuracion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1,
  },
  nombreInstitucion: {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: 'TecnoSoftware',
    field: 'nombre_institucion',
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'logo_url',
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    // Frase de bienvenida que se muestra en el Home.
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  horario: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    // Lista de reglas, cada una: { dias: ['LUN',...,'FESTIVOS'], cerrado,
    // apertura: 'HH:mm', cierre: 'HH:mm' }. Es una lista (no un horario fijo
    // lunes-viernes/fin de semana) para que el admin agrupe los días como
    // quiera: "sábados y domingos" o "fines de semana y festivos juntos",
    // con horas distintas o cerrado por grupo.
  },
  mapaEmbedUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'mapa_embed_url',
    // URL de "Insertar un mapa" de Google Maps (Compartir > Insertar un
    // mapa > copiar el src del iframe). Si no se define, el mapa del inicio
    // se arma automáticamente a partir de `direccion`.
  },
  tema: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { modo: 'NINGUNO', paletaId: null, colores: null },
    // { modo: 'NINGUNO'|'PREDEFINIDO'|'PERSONALIZADO', paletaId, colores: {fondo,encabezado,acento} }.
    // 'PREDEFINIDO' solo guarda paletaId (el front resuelve los hex contra su catálogo
    // de paletas); 'PERSONALIZADO' guarda los hex elegidos en `colores`. 'NINGUNO' deja
    // el sitio con los colores neutros por defecto.
  },
}, {
  tableName: 'configuracion',
  timestamps: true,
});

module.exports = Configuracion;
