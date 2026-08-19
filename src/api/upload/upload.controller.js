const service = require('./upload.service');
const { successResponse, errorResponse } = require('../../utils/helpers');

exports.subir = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);

    const resultado = await service.subirImagen(req.file.buffer, req.body.folder);
    return successResponse(res, resultado, 'Imagen subida exitosamente', 201);
  } catch (error) {
    console.error(error);
    const statusCode = error.isAppError ? error.statusCode : 500;
    return errorResponse(res, error.message || 'Error al subir la imagen', statusCode);
  }
};
