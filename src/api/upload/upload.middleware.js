const multer = require('multer');

const MAX_SIZE_MB = 8;

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('El archivo debe ser una imagen'));
  }
  cb(null, true);
};

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter,
});
