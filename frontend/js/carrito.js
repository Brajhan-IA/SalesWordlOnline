/**
 * carrito.js - Lógica del carrito de compras (almacenado en localStorage).
 * Cada ítem tiene la forma { id, cantidad }.
 */
'use strict';

const CLAVE_CARRITO = 'swo_carrito';

/** Lee el carrito guardado en el navegador. */
function leerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
  } catch (e) {
    return [];
  }
}

/** Guarda el carrito y actualiza el contador del encabezado. */
function guardarCarrito(items) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
  actualizarContador();
}

/** Agrega una unidad del producto indicado. */
function agregarAlCarrito(idProducto) {
  const items = leerCarrito();
  const existente = items.find((i) => i.id === idProducto);
  if (existente) { existente.cantidad += 1; } else { items.push({ id: idProducto, cantidad: 1 }); }
  guardarCarrito(items);
}

/** Cambia la cantidad de un producto; si llega a 0 se elimina. */
function cambiarCantidad(idProducto, delta) {
  const items = leerCarrito()
    .map((i) => (i.id === idProducto ? { id: i.id, cantidad: i.cantidad + delta } : i))
    .filter((i) => i.cantidad > 0);
  guardarCarrito(items);
}

/** Elimina un producto del carrito. */
function quitarDelCarrito(idProducto) {
  guardarCarrito(leerCarrito().filter((i) => i.id !== idProducto));
}

/** Calcula el total en pesos del carrito. */
function totalCarrito() {
  return leerCarrito().reduce((suma, i) => {
    const producto = PRODUCTOS.find((p) => p.id === i.id);
    return suma + (producto ? producto.precio * i.cantidad : 0);
  }, 0);
}

/** Cantidad total de unidades en el carrito. */
function contarUnidades() {
  return leerCarrito().reduce((suma, i) => suma + i.cantidad, 0);
}
