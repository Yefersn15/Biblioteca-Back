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
