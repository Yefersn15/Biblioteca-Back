const { Op, fn, col } = require('sequelize');
const { Prestamo, Libro, Autor, Editorial } = require('../../models');

const ESTADOS_CUMPLIDOS = { estado: { [Op.in]: ['APROBADO', 'DEVUELTO'] } };
const TOP_N = 5;

const inicioDeMes = () => {
  const fecha = new Date();
  fecha.setDate(1);
  return fecha.toISOString().slice(0, 10);
};

// Cuenta préstamos (aprobados o devueltos, nunca los que se quedaron en
// solicitud) agrupados por libro, opcionalmente solo desde una fecha.
const conteoPorLibro = async (desde) => {
  const where = { ...ESTADOS_CUMPLIDOS };
  if (desde) where.fechaPrestamo = { [Op.gte]: desde };

  return Prestamo.findAll({
    attributes: ['libroId', [fn('COUNT', col('id')), 'total']],
    where,
    group: ['libroId'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    raw: true,
  });
};

const conMasPrestados = async (conteos, limite) => {
  const top = conteos.slice(0, limite);
  if (top.length === 0) return [];

  const libros = await Libro.findAll({ where: { id: top.map((c) => c.libroId) } });
  return top
    .map((c) => {
      const libro = libros.find((l) => l.id === c.libroId);
      if (!libro) return null;
      return { id: libro.id, titulo: libro.titulo, portadaUrl: libro.portadaUrl, total: Number(c.total) };
    })
    .filter(Boolean);
};

exports.resumen = async () => {
  const [conteosTotales, conteosMes] = await Promise.all([
    conteoPorLibro(),
    conteoPorLibro(inicioDeMes()),
  ]);

  const [librosMasPrestados, librosMasPrestadosMes] = await Promise.all([
    conMasPrestados(conteosTotales, TOP_N),
    conMasPrestados(conteosMes, TOP_N),
  ]);

  // Autor y editorial "más prestados" se derivan de los mismos conteos por
  // libro (no piden su propia query): se reparte el total de cada libro
  // entre su editorial y cada uno de sus autores, y se toma el mayor de
  // cada grupo. Se hace en JS porque autor es N:M con libro (un libro con
  // dos autores debe sumarle el préstamo a ambos), lo cual complica bastante
  // hacerlo en una sola consulta agregada.
  let editorialMasPrestada = null;
  let autorMasPrestado = null;

  if (conteosTotales.length > 0) {
    const libros = await Libro.findAll({
      where: { id: conteosTotales.map((c) => c.libroId) },
      include: [
        { model: Editorial, as: 'editorial' },
        { model: Autor, as: 'autores', through: { attributes: [] } },
      ],
    });

    const porEditorial = new Map();
    const porAutor = new Map();

    for (const { libroId, total } of conteosTotales) {
      const libro = libros.find((l) => l.id === libroId);
      if (!libro) continue;

      if (libro.editorial) {
        const acumulado = porEditorial.get(libro.editorial.id) || { nombre: libro.editorial.nombre, total: 0 };
        acumulado.total += Number(total);
        porEditorial.set(libro.editorial.id, acumulado);
      }

      for (const autor of libro.autores) {
        const nombre = `${autor.nombre} ${autor.apellido || ''}`.trim();
        const acumulado = porAutor.get(autor.id) || { nombre, total: 0 };
        acumulado.total += Number(total);
        porAutor.set(autor.id, acumulado);
      }
    }

    const mayor = (mapa) => [...mapa.values()].sort((a, b) => b.total - a.total)[0] || null;
    editorialMasPrestada = mayor(porEditorial);
    autorMasPrestado = mayor(porAutor);
  }

  return { librosMasPrestados, librosMasPrestadosMes, editorialMasPrestada, autorMasPrestado };
};
