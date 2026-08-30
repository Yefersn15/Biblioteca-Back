# Biblioteca-Back

API REST para el proyecto Biblioteca Web: Express + Sequelize + PostgreSQL.

## Primer arranque

1. Instala Postgres localmente (o usa una instancia en la nube) y ten a mano usuario/contraseña con permiso para crear bases de datos.
2. Copia `.env.example` a `.env` y completa `DB_PASSWORD`, `JWT_SECRET` (una cadena aleatoria larga) y las variables `ADMIN_*`.
3. Instala dependencias:
   ```
   npm install
   ```
4. Crea la base de datos y las tablas (a partir de los modelos de Sequelize, que son la única fuente de verdad del esquema):
   ```
   npm run db:init
   ```
   Alternativa manual: ver `db/init.sql`.
5. Crea el usuario ADMIN inicial (idempotente, usa las variables `ADMIN_*` del `.env`; la contraseña se guarda hasheada, nunca en texto plano):
   ```
   npm run seed:db
   ```
6. Levanta el servidor en desarrollo:
   ```
   npm run dev
   ```
   La API queda en `http://localhost:4000/api` (`/api/health` para comprobar que responde).

## Estructura

```
src/
  api/<recurso>/     routes -> controller -> validator -> service -> repository
  config/            env.js (variables validadas), database.js (instancia Sequelize)
  middlewares/       auth.js (JWT), errorHandler.js
  models/            un archivo por entidad + index.js con las asociaciones
  utils/             AppError, respuestas HTTP, paginación, hashing de contraseñas
scripts/
  dbInit.js          npm run db:init
  seedAdmin.js       npm run seed:db
```

## Roles

`USUARIO` (por defecto al registrarse), `BIBLIOTECARIO`, `ADMIN`. Las rutas de catálogo (libros, autores, editoriales, categorías) son de lectura pública y escritura solo para `BIBLIOTECARIO`/`ADMIN`. Los préstamos requieren sesión; aprobar/rechazar/devolver es solo para staff.

## Cuenta del administrador principal

El usuario creado por `npm run seed:db` (el correo en `ADMIN_EMAIL`) queda por encima de todos, incluidos otros `ADMIN`: el modelo `Usuario` expone un campo virtual `esAdminPrincipal` (`email === config.adminEmail`, sin columna en la base de datos) que `usuarios.service.js` usa para bloquear con 403 cualquier intento —de cualquier usuario, incluida ella misma— de cambiarle el rol, desactivarla, eliminarla o cambiarle la contraseña desde la API. `auth.service.js` hace lo mismo con la recuperación por correo: si el correo es el del admin principal, no se genera token ni se envía nada (se comporta igual que un correo inexistente). Hoy no existe una vía en la app ni un script para rotar esa contraseña una vez creada la cuenta; solo se define una vez, al ejecutar `seed:db` sobre una base de datos donde ese correo todavía no existe.

## Recuperación de contraseña

`POST /api/auth/forgot-password` genera un token aleatorio (no un código), lo guarda hasheado con expiración de 15 minutos, y envía un enlace a `${FRONTEND_URL}/restablecer-password` por correo vía la API HTTP de Brevo (`BREVO_API_KEY`, `MAIL_FROM` en `.env`). Si esas variables no están configuradas, el envío simplemente no ocurre y queda registrado en consola — útil en desarrollo. La respuesta es siempre el mismo mensaje genérico, exista o no una cuenta con ese correo, para no filtrar qué correos están registrados.
