const service = require('./configuracion.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

exports.obtener = async (req, res) => {
  try {
    const config = await service.obtener();
    return successResponse(res, config);
  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Error al obtener la configuración', 500);
  }
};

exports.actualizar = async (req, res) => {
  try {
    const config = await service.actualizar(req.body);
    return successResponse(res, config, 'Configuración actualizada exitosamente');
  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Error al actualizar la configuración', 500);
  }
};
