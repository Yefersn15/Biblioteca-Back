const { cloudinary, configurado } = require('../../config/cloudinary');
const AppError = require('../../utils/AppError');

const FOLDER_VALIDO = /^[a-zA-Z0-9_-]{1,40}$/;

exports.subirImagen = (buffer, folder = 'general') => {
  if (!configurado) {
    throw new AppError('La subida de imágenes no está configurada en el servidor (faltan credenciales de Cloudinary)', 503);
  }
  const carpeta = FOLDER_VALIDO.test(folder) ? folder : 'general';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `biblioteca/${carpeta}`, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

// Borrado best-effort: si Cloudinary no está configurado, si no hay
// publicId (p. ej. la URL guardada es externa, pegada a mano, no subida por
// este sistema) o si la llamada falla, no se lanza error — el registro en la
// base de datos ya se guardó/eliminó y no debe fallar por esto.
exports.eliminarImagen = async (publicId) => {
  if (!publicId || !configurado) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('No se pudo borrar la imagen de Cloudinary:', error);
  }
};
