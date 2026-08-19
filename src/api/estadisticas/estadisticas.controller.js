const service = require('./estadisticas.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

exports.resumen = async (req, res) => {
  try {
    const datos = await service.resumen();
    return successResponse(res, datos);
  } catch (error) {
    console.error(error);
    return errorResponse(res, 'Error al calcular estadísticas', 500);
  }
};
