// Lógica de negocio y acceso a datos de banners. No conoce Express
// (nada de req/res) — el controlador es quien traduce esto a HTTP.
const repository = require('./banners.repository');
const autoresRepository = require('../autores/autores.repository');
const AppError = require('../../utils/AppError');

const LAYOUT_SLOTS = {
  single: 1,
  duo: 2,
  trio: 3,
  'grid-4': 4,
  'grid-6': 6,
  'mosaic-8': 8,
  'big-4': 5,
  'duo-big-right': 3,
  'row-5': 5,
  'shelf-4': 4,
  'shelf-6': 6,
  'shelf-featured-4': 5,
  'shelf-featured-6': 7,
};

// IMAGENES: casillas con imagen subida a mano (`images`).
// AUTORES: casillas elegidas a mano, un autor por casilla (`refIds`, en el
// mismo orden que las casillas de la plantilla).
const CONTENT_TYPES = ['IMAGENES', 'AUTORES'];
const TIPOS_CON_REFIDS = ['AUTORES'];

// Solo valida forma (plantilla reconocida, cantidad de elementos acorde a
// la plantilla, referencias presentes). No valida que los ids de refIds
// realmente existan en la base — un id borrado después simplemente no
// aparece al resolver (ver resolverItems).
const validarBanner = ({ layout, contentType, images, refIds, textPosition }) => {
  if (!Object.prototype.hasOwnProperty.call(LAYOUT_SLOTS, layout)) {
    return `Plantilla "${layout}" no reconocida`;
  }
  const slots = LAYOUT_SLOTS[layout];

  if (!CONTENT_TYPES.includes(contentType)) {
    return `Tipo de contenido "${contentType}" no reconocido`;
  }

  if (contentType === 'IMAGENES') {
    if (!Array.isArray(images) || images.length !== slots) {
      return `La plantilla "${layout}" requiere ${slots} imagen(es)`;
    }
    if (images.some((img) => !img || !img.url)) {
      return 'Todas las casillas de imagen deben tener una URL';
    }
  } else if (TIPOS_CON_REFIDS.includes(contentType)) {
    if (!Array.isArray(refIds) || refIds.length !== slots) {
      return `La plantilla "${layout}" requiere ${slots} elemento(s) elegido(s)`;
    }
  }

  if (textPosition && !['left', 'right', 'center', 'none'].includes(textPosition)) {
    return 'Posición de texto inválida';
  }
  return null;
};

const ordenarPorIds = (items, ids) => ids.map((id) => items.find((it) => it.id === id)).filter(Boolean);

// `shape` le dice al frontend qué proporción real respetar (ver
// BannerCollage): 'square' = foto cuadrada (1:1). Así la casilla nunca
// recorta ni estira el contenido, sea cual sea la plantilla elegida.
const autorAItem = (a) => ({ id: a.id, imageUrl: a.fotografiaUrl, label: `${a.nombre} ${a.apellido}`, linkTo: `/catalogo/autores/${a.id}`, shape: 'square' });

// Resuelve, en el momento de la consulta (no se guarda una copia), qué va en
// cada casilla de un banner de tipo AUTORES. Así, si cambia la foto del
// autor, el banner se actualiza solo.
const resolverItems = async (banner) => {
  if (banner.contentType === 'AUTORES') {
    const autores = await autoresRepository.findByIds(banner.refIds || []);
    return ordenarPorIds(autores, banner.refIds).map(autorAItem);
  }
  return null;
};

exports.listar = async ({ isStaff, pagination, search, estado, layout }) => {
  const where = repository.buildWhere({ isStaff, search, estado, layout });
  const { rows, count } = await repository.findAndCountAll({ where, pagination });

  const rowsConItems = await Promise.all(rows.map(async (banner) => {
    const plano = banner.toJSON();
    plano.items = await resolverItems(banner);
    return plano;
  }));

  return { rows: rowsConItems, count };
};

exports.crear = async (data) => {
  const { layout, contentType, images, refIds, titulo, texto, textPosition, displayOrder, estado } = data;
  const tipo = contentType || 'IMAGENES';

  const errorValidacion = validarBanner({ layout, contentType: tipo, images, refIds, textPosition });
  if (errorValidacion) throw new AppError(errorValidacion, 400);

  return repository.create({
    layout,
    contentType: tipo,
    images: tipo === 'IMAGENES' ? images : [],
    refIds: TIPOS_CON_REFIDS.includes(tipo) ? refIds : [],
    titulo,
    texto,
    textPosition: textPosition || 'none',
    displayOrder: displayOrder || 0,
    estado: estado !== undefined ? estado : true,
  });
};

exports.actualizar = async (id, data) => {
  const { layout, contentType, images, refIds, titulo, texto, textPosition, displayOrder, estado } = data;

  const banner = await repository.findById(id);
  if (!banner) throw new AppError('Banner no encontrado', 404);

  const nextLayout = layout || banner.layout;
  const nextContentType = contentType || banner.contentType;
  const nextImages = images !== undefined ? images : banner.images;
  const nextRefIds = refIds !== undefined ? refIds : banner.refIds;

  const errorValidacion = validarBanner({
    layout: nextLayout,
    contentType: nextContentType,
    images: nextImages,
    refIds: nextRefIds,
    textPosition,
  });
  if (errorValidacion) throw new AppError(errorValidacion, 400);

  await banner.update({
    layout: nextLayout,
    contentType: nextContentType,
    images: nextContentType === 'IMAGENES' ? nextImages : [],
    refIds: TIPOS_CON_REFIDS.includes(nextContentType) ? nextRefIds : [],
    titulo: titulo !== undefined ? titulo : banner.titulo,
    texto: texto !== undefined ? texto : banner.texto,
    textPosition: textPosition || banner.textPosition,
    displayOrder: displayOrder !== undefined ? displayOrder : banner.displayOrder,
    estado: estado !== undefined ? estado : banner.estado,
  });

  return banner;
};

exports.eliminar = async (id) => {
  const banner = await repository.findById(id);
  if (!banner) throw new AppError('Banner no encontrado', 404);
  await banner.destroy();
};

exports.LAYOUT_SLOTS = LAYOUT_SLOTS;
