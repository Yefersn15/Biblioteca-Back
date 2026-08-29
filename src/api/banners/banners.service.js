// Lógica de negocio y acceso a datos de banners. No conoce Express
// (nada de req/res) — el controlador es quien traduce esto a HTTP.
const repository = require('./banners.repository');
const librosRepository = require('../libros/libros.repository');
const librosService = require('../libros/libros.service');
const autoresRepository = require('../autores/autores.repository');
const editorialesRepository = require('../editoriales/editoriales.repository');
const categoriasRepository = require('../categorias/categorias.repository');
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

// Casilla donde va el autor/editorial/categoría en el contenido "Populares":
// la casilla grande si la plantilla tiene una, si no la primera. Debe
// coincidir con `featuredSlot` en el frontend (bannerTemplates.js).
const LAYOUT_FEATURED_SLOT = {
  single: 0,
  duo: 0,
  trio: 0,
  'grid-4': 0,
  'grid-6': 0,
  'mosaic-8': 0,
  'big-4': 0,
  'duo-big-right': 2,
  'row-5': 0,
  'shelf-4': 0,
  'shelf-6': 0,
  'shelf-featured-4': 0,
  'shelf-featured-6': 0,
};

// IMAGENES: casillas con imagen subida a mano (`images`).
// LIBROS / AUTORES / EDITORIALES / CATEGORIAS: casillas elegidas a mano,
// una por elemento (`refIds`, en el mismo orden que las casillas).
// POPULARES: se elige UNA categoría/autor/editorial (`origen` + `origenId`);
// esa entidad va en la casilla destacada (LAYOUT_FEATURED_SLOT) y el resto
// de casillas se llenan solas con sus libros más prestados.
const CONTENT_TYPES = ['IMAGENES', 'LIBROS', 'AUTORES', 'EDITORIALES', 'CATEGORIAS', 'POPULARES'];
const TIPOS_CON_REFIDS = ['LIBROS', 'AUTORES', 'EDITORIALES', 'CATEGORIAS'];
const ORIGENES_POPULARES = ['CATEGORIA', 'AUTOR', 'EDITORIAL'];

// Solo valida forma (plantilla reconocida, cantidad de elementos acorde a
// la plantilla, referencias presentes). No valida que los ids de refIds/
// origenId realmente existan en la base — un id borrado después simplemente
// no aparece al resolver (ver resolverItems).
const validarBanner = ({ layout, contentType, images, origen, origenId, refIds, textPosition }) => {
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
  } else if (contentType === 'POPULARES') {
    if (!ORIGENES_POPULARES.includes(origen)) {
      return 'Elige si los libros populares son de una categoría, un autor o una editorial';
    }
    if (!origenId) {
      return 'Elige la categoría, autor o editorial de la que salen los libros populares';
    }
  }

  if (textPosition && !['left', 'right', 'center', 'none'].includes(textPosition)) {
    return 'Posición de texto inválida';
  }
  return null;
};

const ordenarPorIds = (items, ids) => ids.map((id) => items.find((it) => it.id === id)).filter(Boolean);

// `shape` le dice al frontend qué proporción real respetar (ver
// BannerCollage): 'book' = portada vertical (2:3), 'square' = foto/logo
// cuadrado (1:1). Así la casilla nunca recorta ni estira el contenido, sea
// cual sea la plantilla elegida.
const libroAItem = (l) => ({ id: l.id, imageUrl: l.portadaUrl, label: l.titulo, linkTo: `/catalogo/${l.id}`, shape: 'book' });
const autorAItem = (a) => ({ id: a.id, imageUrl: a.fotografiaUrl, label: `${a.nombre} ${a.apellido}`, linkTo: `/catalogo/autores/${a.id}`, shape: 'square' });
const editorialAItem = (e) => ({ id: e.id, imageUrl: e.logoUrl, label: e.nombre, linkTo: `/catalogo/editoriales/${e.id}`, shape: 'square' });
const categoriaAItem = (c) => ({ id: c.id, imageUrl: null, label: c.nombre, linkTo: `/catalogo?categoriaId=${c.id}`, shape: 'square' });

// Resuelve, en el momento de la consulta (no se guarda una copia), qué va en
// cada casilla de un banner que no sea de tipo IMAGENES. Así, si cambia la
// portada de un libro o la popularidad, el banner se actualiza solo.
const resolverItems = async (banner) => {
  if (banner.contentType === 'LIBROS') {
    const libros = await librosRepository.findByIds(banner.refIds || []);
    return ordenarPorIds(libros, banner.refIds).map(libroAItem);
  }
  if (banner.contentType === 'AUTORES') {
    const autores = await autoresRepository.findByIds(banner.refIds || []);
    return ordenarPorIds(autores, banner.refIds).map(autorAItem);
  }
  if (banner.contentType === 'EDITORIALES') {
    const editoriales = await editorialesRepository.findByIds(banner.refIds || []);
    return ordenarPorIds(editoriales, banner.refIds).map(editorialAItem);
  }
  if (banner.contentType === 'CATEGORIAS') {
    const categorias = await categoriasRepository.findByIds(banner.refIds || []);
    return ordenarPorIds(categorias, banner.refIds).map(categoriaAItem);
  }
  if (banner.contentType === 'POPULARES') {
    const slots = LAYOUT_SLOTS[banner.layout] || 0;
    const featuredSlot = LAYOUT_FEATURED_SLOT[banner.layout] ?? 0;

    const [entidad, libros] = await Promise.all([
      {
        CATEGORIA: () => categoriasRepository.findById(banner.origenId),
        AUTOR: () => autoresRepository.findById(banner.origenId),
        EDITORIAL: () => editorialesRepository.findById(banner.origenId),
      }[banner.origen]?.(),
      librosService.listarPopulares({
        limit: Math.max(slots - 1, 0),
        ...({
          CATEGORIA: { categoriaId: banner.origenId },
          AUTOR: { autorId: banner.origenId },
          EDITORIAL: { editorialId: banner.origenId },
        }[banner.origen] || {}),
      }),
    ]);

    const entidadItem = entidad && {
      CATEGORIA: categoriaAItem,
      AUTOR: autorAItem,
      EDITORIAL: editorialAItem,
    }[banner.origen](entidad);

    const items = new Array(slots).fill(null);
    items[featuredSlot] = entidadItem || null;
    let li = 0;
    for (let i = 0; i < slots; i++) {
      if (i === featuredSlot) continue;
      items[i] = libros[li] ? libroAItem(libros[li]) : null;
      li++;
    }
    return items;
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
  const { layout, contentType, images, origen, origenId, refIds, titulo, texto, textPosition, displayOrder, estado } = data;
  const tipo = contentType || 'IMAGENES';

  const errorValidacion = validarBanner({ layout, contentType: tipo, images, origen, origenId, refIds, textPosition });
  if (errorValidacion) throw new AppError(errorValidacion, 400);

  return repository.create({
    layout,
    contentType: tipo,
    images: tipo === 'IMAGENES' ? images : [],
    origen: tipo === 'POPULARES' ? origen : null,
    origenId: tipo === 'POPULARES' ? origenId : null,
    refIds: TIPOS_CON_REFIDS.includes(tipo) ? refIds : [],
    titulo,
    texto,
    textPosition: textPosition || 'none',
    displayOrder: displayOrder || 0,
    estado: estado !== undefined ? estado : true,
  });
};

exports.actualizar = async (id, data) => {
  const { layout, contentType, images, origen, origenId, refIds, titulo, texto, textPosition, displayOrder, estado } = data;

  const banner = await repository.findById(id);
  if (!banner) throw new AppError('Banner no encontrado', 404);

  const nextLayout = layout || banner.layout;
  const nextContentType = contentType || banner.contentType;
  const nextImages = images !== undefined ? images : banner.images;
  const nextOrigen = origen !== undefined ? origen : banner.origen;
  const nextOrigenId = origenId !== undefined ? origenId : banner.origenId;
  const nextRefIds = refIds !== undefined ? refIds : banner.refIds;

  const errorValidacion = validarBanner({
    layout: nextLayout,
    contentType: nextContentType,
    images: nextImages,
    origen: nextOrigen,
    origenId: nextOrigenId,
    refIds: nextRefIds,
    textPosition,
  });
  if (errorValidacion) throw new AppError(errorValidacion, 400);

  await banner.update({
    layout: nextLayout,
    contentType: nextContentType,
    images: nextContentType === 'IMAGENES' ? nextImages : [],
    origen: nextContentType === 'POPULARES' ? nextOrigen : null,
    origenId: nextContentType === 'POPULARES' ? nextOrigenId : null,
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
