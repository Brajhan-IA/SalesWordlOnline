/**
 * factura.js
 * Genera el objeto factura y su representación HTML a partir del carrito
 * y de los datos del cliente. Equivale a facturacion.php / factura.php del
 * back-end, pero aplicado en la capa de presentación.
 */
'use strict';

/** Escapa texto para evitar inyección de HTML (seguridad XSS), también dentro de atributos. */
function escaparHTML(texto) {
  return String(texto).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Construye la factura.
 * @param {Object} cliente - Datos validados del formulario.
 * @returns {Object} Factura con número, fecha, líneas y totales.
 */
function generarFactura(cliente) {
  let consecutivo = 1;
  try {
    consecutivo = Number(localStorage.getItem('swo_consecutivo') || 0) + 1;
    localStorage.setItem('swo_consecutivo', consecutivo);
  } catch (e) { /* sin almacenamiento: se usa consecutivo 1 */ }

  return {
    numero: 'SWO-' + String(consecutivo).padStart(6, '0'),
    fecha: new Date().toLocaleString('es-CO'),
    cliente,
    lineas: Carrito.items.map((i) => {
      const p = obtenerProductoPorId(i.id);
      return { nombre: p.nombre, cantidad: i.cantidad, precio: p.precio, importe: p.precio * i.cantidad };
    }),
    totales: Carrito.calcularTotales()
  };
}

/**
 * Convierte una factura en HTML para mostrarla en pantalla o imprimirla.
 * @param {Object} f - Factura generada por generarFactura().
 * @returns {string} Fragmento HTML.
 */
function renderizarFactura(f) {
  const filas = f.lineas.map((l) => `
    <tr>
      <td>${escaparHTML(l.nombre)}</td>
      <td class="num">${l.cantidad}</td>
      <td class="num">${formatearPesos(l.precio)}</td>
      <td class="num">${formatearPesos(l.importe)}</td>
    </tr>`).join('');

  return `
    <h2>Factura ${f.numero}</h2>
    <p class="factura__meta">Fecha: ${f.fecha}</p>
    <p><strong>Cliente:</strong> ${escaparHTML(f.cliente.nombre)} · CC ${escaparHTML(f.cliente.documento)}<br>
       ${escaparHTML(f.cliente.correo)} · ${escaparHTML(f.cliente.telefono)}<br>
       <strong>Envío:</strong> ${escaparHTML(f.cliente.direccion)}<br>
       <strong>Pago:</strong> ${escaparHTML(f.cliente.metodoPago)}</p>
    <table class="tabla-factura">
      <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <dl class="totales">
      <div><dt>Subtotal</dt><dd>${formatearPesos(f.totales.subtotal)}</dd></div>
      <div><dt>IVA (19%)</dt><dd>${formatearPesos(f.totales.iva)}</dd></div>
      <div class="totales__total"><dt>Total</dt><dd>${formatearPesos(f.totales.total)}</dd></div>
    </dl>
    <p class="factura__meta">¡Gracias por comprar en Sales World Online!</p>`;
}
