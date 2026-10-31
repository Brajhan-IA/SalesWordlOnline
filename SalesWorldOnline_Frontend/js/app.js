/**
 * app.js
 * Controlador de la interfaz del cliente.
 * Historias de usuario cubiertas: HU_06 (lista de productos), HU_07 (agregar al carrito),
 * HU_08 (modificar carrito), HU_09 (confirmar compra), HU_10 (ver/cancelar carrito),
 * HU_11 (método de pago) y HU_12 (acceso desde el navegador).
 * El módulo del administrador (HU_01 a HU_04) está en admin.js.
 */
'use strict';

/* ---------- Referencias al DOM ---------- */
const $ = (id) => document.getElementById(id);
const estado = { categoria: 'Todos', texto: '' };

/* ---------- Catálogo ---------- */

/**
 * Devuelve el HTML de la foto de un producto. Si no tiene foto o no carga,
 * se muestra el emoji del producto como respaldo (ver el listener 'error').
 * @param {Object} p - Producto.
 * @param {string} clase - Clase CSS de la imagen.
 * @returns {string} Fragmento HTML.
 */
function htmlImagen(p, clase) {
  if (!p.imagen) return `<span class="${clase}">${escaparHTML(p.icono)}</span>`;
  return `<img class="${clase}" src="${escaparHTML(p.imagen)}" alt="${escaparHTML(p.nombre)}"
    data-icono="${escaparHTML(p.icono)}" loading="lazy">`;
}

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
      <div class="tarjeta__foto">${htmlImagen(p, 'tarjeta__imagen')}</div>
      <span class="tarjeta__categoria">${escaparHTML(p.categoria)}</span>
      <h3>${escaparHTML(p.nombre)}</h3>
      <p class="tarjeta__desc">${escaparHTML(p.descripcion)}</p>
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
          <span class="item__foto">${htmlImagen(p, 'item__imagen')}</span>
          <div class="item__info">
            <strong>${escaparHTML(p.nombre)}</strong>
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
  avisar.temporizador = setTimeout(() => { toast.hidden = true; }, 2600);
}

/* ---------- Checkout ---------- */

/** Lee los valores del formulario como objeto. */
function leerFormulario() {
  return Object.fromEntries(new FormData($('formCheckout')).entries());
}

/** Muestra u oculta los mensajes de error del formulario de checkout. */
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

/* ---------- Portada ---------- */

/** Muestra un saludo según la hora del día, seguido del eslogan de la tienda. */
function pintarSaludo() {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : (hora < 19 ? 'Buenas tardes' : 'Buenas noches');
  $('saludo').textContent = saludo + '. Tecnología, moda, hogar y más en un solo lugar.';
}

/** El registro de clientes (HU_05) pertenece a una etapa posterior. */
function avisarModuloUsuarios() {
  avisar('El registro de clientes estará disponible en la siguiente etapa.');
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

  // Si una foto no carga, se reemplaza por el emoji del producto (respaldo)
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.dataset.icono) return;
    const respaldo = document.createElement('span');
    respaldo.className = img.className;
    respaldo.textContent = img.dataset.icono;
    img.replaceWith(respaldo);
  }, true);

  $('btnCarrito').addEventListener('click', () => mostrarCarrito(true));
  $('btnCerrarCarrito').addEventListener('click', () => mostrarCarrito(false));
  $('fondo').addEventListener('click', () => mostrarCarrito(false));
  $('btnVaciar').addEventListener('click', () => { Carrito.vaciar(); pintarCarrito(); });
  $('btnPagar').addEventListener('click', () => $('modalCheckout').showModal());
  $('btnCancelarPago').addEventListener('click', () => $('modalCheckout').close());
  $('formCheckout').addEventListener('submit', confirmarCompra);
  $('btnImprimir').addEventListener('click', () => window.print());
  $('btnCerrarFactura').addEventListener('click', () => $('modalFactura').close());

  // Registro de clientes (módulo futuro)
  ['btnRegistrarse', 'btnCrearCuenta'].forEach((id) =>
    $(id).addEventListener('click', avisarModuloUsuarios));
}

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Carrito.cargar();
  pintarSaludo();
  pintarFiltros();
  pintarProductos();
  pintarCarrito();
  registrarEventos();
});
