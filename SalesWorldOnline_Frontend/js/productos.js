/**
 * productos.js
 * Capa de datos del catálogo.
 * Los productos se guardan en el navegador (localStorage) para que el administrador
 * pueda agregar, editar y eliminar. Cuando el back-end PHP exponga una API,
 * solo hay que reemplazar estas funciones por llamadas fetch().
 */
'use strict';

const CATEGORIAS = ['Todos', 'Tecnología', 'Hogar', 'Moda', 'Deportes'];
const CLAVE_PRODUCTOS = 'swo_productos';
const EMOJI_PRODUCTO = '📦';

/**
 * Clase Producto del diagrama de clases (Figura 5) -> objeto JS:
 *   codigo_del_producto -> codigo     Nombre_del_producto -> nombre
 *   descripcion         -> descripcion  valor    -> precio
 *   cantidad            -> stock        disponibilidad -> (stock > 0)
 *   imagen              -> ruta o dato de la foto; el emoji 'icono' es el respaldo
 */
const PRODUCTOS_INICIALES = [
  { id: 1, imagen: 'img/audifonos.jpg',  codigo: 'SWO-001', descripcion: 'Sonido envolvente y batería de 20 horas.',  nombre: 'Audífonos Bluetooth',  categoria: 'Tecnología', precio: 89900,  stock: 15, icono: '🎧' },
  { id: 2, imagen: 'img/smartwatch.jpg', codigo: 'SWO-002', descripcion: 'Monitorea tu ritmo cardíaco y tus entrenamientos.', nombre: 'Smartwatch Deportivo', categoria: 'Tecnología', precio: 159900, stock: 8,  icono: '⌚' },
  { id: 3, imagen: 'img/teclado.jpg',    codigo: 'SWO-003', descripcion: 'Switches mecánicos y retroiluminación.',    nombre: 'Teclado Mecánico',     categoria: 'Tecnología', precio: 129900, stock: 10, icono: '⌨️' },
  { id: 4, imagen: 'img/licuadora.jpg',  codigo: 'SWO-004', descripcion: 'Potente motor para jugos y batidos.',       nombre: 'Licuadora 600W',       categoria: 'Hogar',      precio: 119900, stock: 12, icono: '🥤' },
  { id: 5, imagen: 'img/lampara.jpg',    codigo: 'SWO-005', descripcion: 'Luz regulable de bajo consumo.',            nombre: 'Lámpara LED de mesa',  categoria: 'Hogar',      precio: 45900,  stock: 20, icono: '💡' },
  { id: 6, imagen: 'img/camiseta.jpg',   codigo: 'SWO-006', descripcion: 'Tela ligera y transpirable.',               nombre: 'Camiseta Deportiva',   categoria: 'Moda',       precio: 39900,  stock: 30, icono: '👕' },
  { id: 7, imagen: 'img/tenis.jpg',      codigo: 'SWO-007', descripcion: 'Cuero blanco y suela resistente.',          nombre: 'Tenis Clásicos',       categoria: 'Deportes',   precio: 189900, stock: 6,  icono: '👟' },
  { id: 8, imagen: 'img/balon.jpg',      codigo: 'SWO-008', descripcion: 'Balón profesional número 5.',               nombre: 'Balón de fútbol',      categoria: 'Deportes',   precio: 59900,  stock: 18, icono: '⚽' }
];

/**
 * Lee el catálogo guardado en el navegador; si no hay, usa el catálogo inicial.
 * @returns {Array<Object>} Lista de productos.
 */
function cargarProductos() {
  try {
    const guardados = JSON.parse(localStorage.getItem(CLAVE_PRODUCTOS));
    if (Array.isArray(guardados)) return guardados;
  } catch (e) { /* sin almacenamiento o datos dañados */ }
  return PRODUCTOS_INICIALES.map((p) => ({ ...p }));
}

let PRODUCTOS = cargarProductos();

/**
 * Guarda el catálogo en el navegador.
 * @returns {boolean} true si se pudo guardar.
 */
function guardarProductos() {
  try {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(PRODUCTOS));
    return true;
  } catch (e) {
    return false; // por ejemplo, almacenamiento lleno
  }
}

/**
 * Devuelve los productos filtrados por categoría y texto de búsqueda.
 * @param {string} categoria - Categoría seleccionada ('Todos' = sin filtro).
 * @param {string} texto - Texto digitado en el buscador.
 * @returns {Array<Object>} Lista de productos que cumplen el filtro.
 */
function obtenerProductos(categoria = 'Todos', texto = '') {
  const busqueda = texto.trim().toLowerCase();
  return PRODUCTOS.filter((p) =>
    (categoria === 'Todos' || p.categoria === categoria) &&
    p.nombre.toLowerCase().includes(busqueda)
  );
}

/**
 * Busca un producto por su identificador.
 * @param {number} id
 * @returns {Object|undefined}
 */
function obtenerProductoPorId(id) {
  return PRODUCTOS.find((p) => p.id === id);
}

/**
 * Indica si un producto está disponible (atributo "disponibilidad" del diagrama de clases).
 * @param {Object} producto
 * @returns {boolean}
 */
function estaDisponible(producto) {
  return producto.stock > 0;
}

/**
 * Crea un producto nuevo (HU_04: agregar productos a la lista).
 * @param {Object} datos - nombre, categoria, descripcion, precio, stock e imagen.
 * @returns {Object} El producto creado.
 */
function crearProducto(datos) {
  const id = PRODUCTOS.reduce((mayor, p) => Math.max(mayor, p.id), 0) + 1;
  const producto = {
    id,
    imagen: datos.imagen || '',
    codigo: 'SWO-' + String(id).padStart(3, '0'),
    descripcion: datos.descripcion,
    nombre: datos.nombre,
    categoria: datos.categoria,
    precio: datos.precio,
    stock: datos.stock,
    icono: EMOJI_PRODUCTO
  };
  PRODUCTOS.push(producto);
  guardarProductos();
  return producto;
}

/**
 * Modifica un producto existente (HU_03: modificar productos de la lista).
 * @param {number} id
 * @param {Object} datos - Campos a cambiar.
 * @returns {Object|undefined} El producto actualizado.
 */
function actualizarProducto(id, datos) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return undefined;
  Object.assign(producto, datos);
  guardarProductos();
  return producto;
}

/**
 * Elimina un producto del catálogo (HU_04: eliminar).
 * @param {number} id
 */
function eliminarProducto(id) {
  PRODUCTOS = PRODUCTOS.filter((p) => p.id !== id);
  guardarProductos();
}

/** Restaura el catálogo de ejemplo. */
function restaurarProductos() {
  PRODUCTOS = PRODUCTOS_INICIALES.map((p) => ({ ...p }));
  try { localStorage.removeItem(CLAVE_PRODUCTOS); } catch (e) { /* ignorar */ }
}
