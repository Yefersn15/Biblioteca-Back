const repository = require('./configuracion.repository');

exports.obtener = () => repository.obtener();

exports.actualizar = async (data) => {
  const config = await repository.obtener();
  // Los campos de texto opcionales llegan como '' cuando el admin los deja
  // vacíos a propósito (para "borrar" el dato, ej. quitar el logo); se
  // guardan tal cual en vez de null para no complicar el validator con dos
  // formas distintas de "vacío".
  await config.update(data);
  return config;
};
