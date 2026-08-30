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

// Igual que `subir`, pero sin sesión y con la carpeta fija en "avatares" —
// el body no decide la carpeta, así este endpoint público nunca se puede
// usar para llenar otras carpetas de Cloudinary (portadas, banners, etc.).
exports.subirAvatarPublico = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, 'No se recibió ningún archivo', 400);

    const resultado = await service.subirImagen(req.file.buffer, 'avatares');
    return successResponse(res, resultado, 'Imagen subida exitosamente', 201);
  } catch (error) {
    console.error(error);
    const statusCode = error.isAppError ? error.statusCode : 500;
    return errorResponse(res, error.message || 'Error al subir la imagen', statusCode);
  }
};
