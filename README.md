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
