/**
 * app.js
 * Historias de usuario cubiertas: HU_06 (lista de productos), HU_07 (agregar al carrito),
 * HU_08 (modificar carrito), HU_09 (confirmar compra), HU_10 (ver/cancelar carrito),
 * HU_11 (método de pago) y HU_12 (acceso desde el navegador).
 * Controlador de la interfaz: conecta el DOM con la lógica del carrito,
 * las validaciones y la factura.
 */
'use strict';

/* ---------- Referencias al DOM ---------- */
const $ = (id) => document.getElementById(id);
const estado = { categoria: 'Todos', texto: '' };

/* ---------- Catálogo ---------- */

/** Dibuja los botones de categorías. */
function pintarFiltros() {
  $('filtros').innerHTML = CATEGORIAS.map((c) =>
    `<button class="chip ${c === estado.categoria ? 'chip--activo' : ''}" data-categoria="${c}">${c}</button>`
  ).join('');
}

/** Dibuja las tarjetas de producto según los filtros activos. */
function pintarProductos() {
  const lista = obtenerProductos(estado.categoria, estado.texto);
  $('sinResultados').hidden = lista.length > 0;
  $('grillaProductos').innerHTML = lista.map((p) => `
    <article class="tarjeta">
      <div class="tarjeta__icono" aria-hidden="true">${p.icono}</div>
      <span class="tarjeta__categoria">${p.categoria}</span>
      <h3>${p.nombre}</h3>
      <p class="tarjeta__desc">${p.descripcion}</p>
      <p class="tarjeta__precio">${formatearPesos(p.precio)}</p>
      <p class="tarjeta__stock">${p.stock} disponibles</p>
      <button class="btn btn--primario" data-agregar="${p.id}" ${estaDisponible(p) ? '' : 'disabled'}>
        ${estaDisponible(p) ? 'Agregar al carrito' : 'Agotado'}
      </button>
    </article>`).join('');
}

/* ---------- Carrito ---------- */

/** Redibuja el panel del carrito y el contador del encabezado. */
function pintarCarrito() {
  $('contadorCarrito').textContent = Carrito.totalUnidades();
  const vacio = Carrito.items.length === 0;

  $('listaCarrito').innerHTML = vacio
    ? '<li class="vacio">Tu carrito está vacío.</li>'
    : Carrito.items.map((i) => {
        const p = obtenerProductoPorId(i.id);
        return `
        <li class="item">
          <span class="item__icono">${p.icono}</span>
          <div class="item__info">
            <strong>${p.nombre}</strong>
            <small>${formatearPesos(p.precio)} c/u</small>
          </div>
          <div class="item__cantidad">
            <button class="btn-icono" data-menos="${p.id}" aria-label="Quitar una unidad">−</button>
            <span>${i.cantidad}</span>
            <button class="btn-icono" data-mas="${p.id}" aria-label="Agregar una unidad">+</button>
          </div>
          <button class="btn-icono" data-eliminar="${p.id}" aria-label="Eliminar">🗑️</button>
        </li>`;
      }).join('');

  const t = Carrito.calcularTotales();
  $('subtotal').textContent = formatearPesos(t.subtotal);
  $('iva').textContent = formatearPesos(t.iva);
  $('total').textContent = formatearPesos(t.total);
  $('btnPagar').disabled = vacio;
  $('btnVaciar').disabled = vacio;
}

/** Abre o cierra el panel lateral del carrito. */
function mostrarCarrito(abrir) {
  $('panelCarrito').classList.toggle('panel--abierto', abrir);
  $('panelCarrito').setAttribute('aria-hidden', String(!abrir));
  $('fondo').hidden = !abrir;
}

/** Muestra un mensaje temporal al usuario. */
function avisar(mensaje) {
  const toast = $('toast');
  toast.textContent = mensaje;
  toast.hidden = false;
  clearTimeout(avisar.temporizador);
  avisar.temporizador = setTimeout(() => { toast.hidden = true; }, 2200);
}

/* ---------- Checkout ---------- */

/** Lee los valores del formulario como objeto. */
function leerFormulario() {
  return Object.fromEntries(new FormData($('formCheckout')).entries());
}

/** Muestra u oculta los mensajes de error del formulario. */
function pintarErrores(errores) {
  document.querySelectorAll('[data-error]').forEach((el) => {
    el.textContent = errores[el.dataset.error] || '';
  });
}

/** Procesa el envío del formulario: valida, factura y limpia el carrito. */
function confirmarCompra(evento) {
  evento.preventDefault();
  const datos = leerFormulario();
  const errores = validarFormulario(datos);
  pintarErrores(errores);
  if (Object.keys(errores).length > 0) return;

  const factura = generarFactura(datos);
  $('contenidoFactura').innerHTML = renderizarFactura(factura);
  Carrito.vaciar();
  pintarCarrito();
  $('formCheckout').reset();
  $('modalCheckout').close();
  mostrarCarrito(false);
  $('modalFactura').showModal();
}

/* ---------- Eventos (delegación) ---------- */

function registrarEventos() {
  // Buscador
  $('buscador').addEventListener('input', (e) => { estado.texto = e.target.value; pintarProductos(); });

  // Filtros por categoría
  $('filtros').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-categoria]');
    if (!btn) return;
    estado.categoria = btn.dataset.categoria;
    pintarFiltros();
    pintarProductos();
  });

  // Agregar desde el catálogo
  $('grillaProductos').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-agregar]');
    if (!btn) return;
    const ok = Carrito.agregar(Number(btn.dataset.agregar));
    avisar(ok ? 'Producto agregado al carrito' : 'No hay más unidades disponibles');
    pintarCarrito();
  });

  // Acciones dentro del carrito
  $('listaCarrito').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.mas)      Carrito.cambiarCantidad(Number(b.dataset.mas), 1);
    if (b.dataset.menos)    Carrito.cambiarCantidad(Number(b.dataset.menos), -1);
    if (b.dataset.eliminar) Carrito.eliminar(Number(b.dataset.eliminar));
    pintarCarrito();
  });

  $('btnCarrito').addEventListener('click', () => mostrarCarrito(true));
  $('btnCerrarCarrito').addEventListener('click', () => mostrarCarrito(false));
  $('fondo').addEventListener('click', () => mostrarCarrito(false));
  $('btnVaciar').addEventListener('click', () => { Carrito.vaciar(); pintarCarrito(); });
  $('btnPagar').addEventListener('click', () => $('modalCheckout').showModal());
  $('btnCancelarPago').addEventListener('click', () => $('modalCheckout').close());
  $('formCheckout').addEventListener('submit', confirmarCompra);
  $('btnImprimir').addEventListener('click', () => window.print());
  $('btnCerrarFactura').addEventListener('click', () => $('modalFactura').close());
}

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Carrito.cargar();
  pintarFiltros();
  pintarProductos();
  pintarCarrito();
  registrarEventos();
});
