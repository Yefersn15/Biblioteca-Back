const prestamosService = require('../api/prestamos/prestamos.service');

const UN_DIA_MS = 24 * 60 * 60 * 1000;

const ejecutar = async () => {
  try {
    const enviados = await prestamosService.enviarRecordatoriosVencimiento();
    if (enviados > 0) console.log(`[recordatorios] ${enviados} correo(s) de vencimiento enviado(s)`);
  } catch (error) {
    console.error('[recordatorios] Error enviando recordatorios de vencimiento:', error);
  }
};

// Revisa una vez al arrancar y luego cada 24h: la fecha de devolución es de
// día completo (sin hora), así que no hace falta más granularidad que esa.
module.exports = function iniciarRecordatoriosPrestamos() {
  ejecutar();
  setInterval(ejecutar, UN_DIA_MS);
};
