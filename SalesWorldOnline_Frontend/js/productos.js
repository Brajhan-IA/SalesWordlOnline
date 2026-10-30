/**
 * productos.js
 * Capa de datos del catálogo.
 * Hoy usa datos de ejemplo; cuando el back-end PHP exponga una API,
 * solo hay que reemplazar obtenerProductos() por un fetch().
 */
'use strict';

const CATEGORIAS = ['Todos', 'Tecnología', 'Hogar', 'Moda', 'Deportes'];

/**
 * Clase Producto del diagrama de clases (Figura 5) -> objeto JS:
 *   codigo_del_producto -> codigo     Nombre_del_producto -> nombre
 *   descripcion         -> descripcion  valor    -> precio
 *   cantidad            -> stock        disponibilidad -> (stock > 0)
 */
const PRODUCTOS = [
  { id: 1, codigo: 'SWO-001', descripcion: 'Sonido envolvente y batería de 20 horas.', nombre: 'Audífonos Bluetooth', categoria: 'Tecnología', precio: 89900,  stock: 15, icono: '🎧' },
  { id: 2, codigo: 'SWO-002', descripcion: 'Monitorea tu ritmo cardíaco y tus entrenamientos.', nombre: 'Smartwatch Deportivo', categoria: 'Tecnología', precio: 159900, stock: 8,  icono: '⌚' },
  { id: 3, codigo: 'SWO-003', descripcion: 'Switches mecánicos y retroiluminación.', nombre: 'Teclado Mecánico',     categoria: 'Tecnología', precio: 129900, stock: 10, icono: '⌨️' },
  { id: 4, codigo: 'SWO-004', descripcion: 'Potente motor para jugos y batidos.', nombre: 'Licuadora 600W',       categoria: 'Hogar',      precio: 119900, stock: 12, icono: '🥤' },
  { id: 5, codigo: 'SWO-005', descripcion: 'Luz regulable de bajo consumo.', nombre: 'Lámpara LED de mesa',  categoria: 'Hogar',      precio: 45900,  stock: 20, icono: '💡' },
  { id: 6, codigo: 'SWO-006', descripcion: 'Tela ligera y transpirable.', nombre: 'Camiseta Deportiva',   categoria: 'Moda',       precio: 39900,  stock: 30, icono: '👕' },
  { id: 7, codigo: 'SWO-007', descripcion: 'Amortiguación para largas distancias.', nombre: 'Tenis Running',        categoria: 'Deportes',   precio: 189900, stock: 6,  icono: '👟' },
  { id: 8, codigo: 'SWO-008', descripcion: 'Balón profesional número 5.', nombre: 'Balón de fútbol',      categoria: 'Deportes',   precio: 59900,  stock: 18, icono: '⚽' }
];

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
