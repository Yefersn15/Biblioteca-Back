const { Configuracion } = require('../../models');

exports.obtener = async () => {
  const [config] = await Configuracion.findOrCreate({ where: { id: 1 } });
  return config;
};
