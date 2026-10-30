/**
 * carrito.js
 * Lógica del carrito de compras. Persiste en localStorage para que el
 * cliente no pierda su selección al recargar la página.
 */
'use strict';

const TASA_IVA = 0.19;
const CLAVE_CARRITO = 'swo_carrito';

/** Formatea un número como moneda colombiana (COP). */
function formatearPesos(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(valor);
}

/*
 * Objeto Carrito = clase Carrito_de_compra del diagrama de clases (Figura 5):
 *   productos: ArrayList -> items      cantidad_total -> totalUnidades()
 *   añadir_producto()    -> agregar()  eliminar_producto() -> eliminar()
 *   comprar()            -> confirmarCompra() en app.js
 */
const Carrito = {
  /** Arreglo de ítems: { id, cantidad } */
  items: [],

  /** Carga el carrito guardado en el navegador. */
  cargar() {
    try {
      this.items = JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
    } catch (e) {
      this.items = [];
    }
  },

  /** Guarda el estado actual del carrito. */
  guardar() {
    try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(this.items)); } catch (e) { /* sin almacenamiento */ }
  },

  /**
   * Agrega una unidad del producto, respetando el stock disponible.
   * @returns {boolean} true si se pudo agregar.
   */
  agregar(id) {
    const producto = obtenerProductoPorId(id);
    const item = this.items.find((i) => i.id === id);
    const cantidadActual = item ? item.cantidad : 0;
    if (!producto || cantidadActual >= producto.stock) return false;
    if (item) { item.cantidad += 1; } else { this.items.push({ id, cantidad: 1 }); }
    this.guardar();
    return true;
  },

  /** Cambia la cantidad de un ítem (+1 / -1). Si llega a 0 se elimina. */
  cambiarCantidad(id, delta) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    const producto = obtenerProductoPorId(id);
    const nueva = item.cantidad + delta;
    if (nueva > producto.stock) return;
    if (nueva <= 0) { this.eliminar(id); return; }
    item.cantidad = nueva;
    this.guardar();
  },

  /** Quita un producto del carrito. */
  eliminar(id) {
    this.items = this.items.filter((i) => i.id !== id);
    this.guardar();
  },

  /** Vacía el carrito completo. */
  vaciar() {
    this.items = [];
    this.guardar();
  },

  /** Total de unidades (para el contador del encabezado). */
  totalUnidades() {
    return this.items.reduce((suma, i) => suma + i.cantidad, 0);
  },

  /** Calcula subtotal, IVA y total. */
  calcularTotales() {
    const subtotal = this.items.reduce(
      (suma, i) => suma + obtenerProductoPorId(i.id).precio * i.cantidad, 0);
    const iva = Math.round(subtotal * TASA_IVA);
    return { subtotal, iva, total: subtotal + iva };
  }
};
