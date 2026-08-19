const COLOR = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const colorParaEstado = (status) => {
  if (status >= 500) return COLOR.red;
  if (status >= 400) return COLOR.yellow;
  if (status >= 300) return COLOR.cyan;
  return COLOR.green;
};

// Log de una línea por request: método, ruta, código de estado y duración.
// Se apoya en el evento 'finish' de la respuesta, así que registra el
// resultado real (incluye errores capturados por el globalErrorHandler),
// no solo que la petición entró.
module.exports = function requestLogger(req, res, next) {
  const inicio = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - inicio;
    const hora = new Date().toLocaleTimeString('es-CO', { hour12: false });
    const color = colorParaEstado(res.statusCode);
    console.log(
      `${COLOR.gray}[${hora}]${COLOR.reset} ${req.method} ${req.originalUrl} ${color}${res.statusCode}${COLOR.reset} ${COLOR.gray}${ms}ms${COLOR.reset}`,
    );
  });

  next();
};
