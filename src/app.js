const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');

const authRoutes = require('./api/auth/auth.routes');
const usuariosRoutes = require('./api/usuarios/usuarios.routes');
const autoresRoutes = require('./api/autores/autores.routes');
const editorialesRoutes = require('./api/editoriales/editoriales.routes');
const categoriasRoutes = require('./api/categorias/categorias.routes');
const librosRoutes = require('./api/libros/libros.routes');
const prestamosRoutes = require('./api/prestamos/prestamos.routes');
const bannersRoutes = require('./api/banners/banners.routes');
const uploadRoutes = require('./api/upload/upload.routes');
const configuracionRoutes = require('./api/configuracion/configuracion.routes');
const estadisticasRoutes = require('./api/estadisticas/estadisticas.routes');

const app = express();

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

// En desarrollo, Vite puede levantar el front en otro puerto si el habitual
// ya está ocupado (5174, 5175...) — aceptar cualquier localhost evita que
// cambie CORS_ORIGIN cada vez. En producción solo se permite el origen
// configurado.
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl/Postman/health checks sin header Origin
    if (origin === config.corsOrigin) return callback(null, true);
    if (config.env === 'development' && LOCALHOST_ORIGIN.test(origin)) return callback(null, true);
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
};

app.use(requestLogger);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API de Biblioteca activa' }));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/autores', autoresRoutes);
app.use('/api/editoriales', editorialesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/libros', librosRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
