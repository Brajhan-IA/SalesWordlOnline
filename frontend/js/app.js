/**
 * app.js - Controlador principal del front-end de Sales World Online.
 * Detecta la página actual (data-pagina del <body>) y ejecuta su lógica.
 */
'use strict';

/** Da formato de pesos colombianos. */
const formatoPesos = (valor) => '$' + valor.toLocaleString('es-CO');

/** Dibuja el encabezado común a todas las páginas. */
function renderEncabezado(paginaActual) {
  const enlaces = [
    ['index.html#catalogo', 'Catálogo', 'catalogo'],
    ['index.html#marketplace', '🏪 Marketplace', 'marketplace'],
    ['index.html#credito', 'Crédito', 'credito'],
    ['carrito.html', '🧾 Mis facturas', 'facturas']
  ];
  const menu = enlaces.map(([href, texto, clave]) =>
    `<li><a href="${href}" class="${clave === paginaActual ? 'activo' : ''}">${texto}</a></li>`).join('');
  document.getElementById('encabezado').innerHTML = `
    <a href="index.html" class="logo">SWO ★</a>
    <ul class="menu">${menu}</ul>
    <div class="acciones">
      <span class="insignia">⭐ 8,790 pts</span>
      <a href="login.html" class="usuario">🚪 Brajhan</a>
      <a href="carrito.html" class="boton boton--carrito">🛒 Carrito <span class="contador" id="contador">0</span></a>
    </div>`;
  actualizarContador();
}

/** Dibuja un campo de estrellas que titilan en el fondo (canvas animado). */
function iniciarEstrellas() {
  const lienzo = document.getElementById('estrellas');
  if (!lienzo) return;
  const ctx = lienzo.getContext('2d');
  let estrellas = [];

  // Ajusta el tamaño del lienzo y genera estrellas aleatorias
  function ajustar() {
    lienzo.width = window.innerWidth;
    lienzo.height = window.innerHeight;
    const cantidad = Math.round((lienzo.width * lienzo.height) / 5500);
    estrellas = Array.from({ length: cantidad }, () => ({
      x: Math.random() * lienzo.width,
      y: Math.random() * lienzo.height,
      radio: Math.random() * 1.4 + 0.3,
      fase: Math.random() * Math.PI * 2,
      velocidad: Math.random() * 0.025 + 0.005
    }));
  }

  // Redibuja cada cuadro variando el brillo de cada estrella
  function dibujar() {
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    estrellas.forEach((e) => {
      e.fase += e.velocidad;
      ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(e.fase));
      ctx.fillStyle = '#c8f6ff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radio, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(dibujar);
  }

  ajustar();
  window.addEventListener('resize', ajustar);
  dibujar();
}

/** Refresca el número de unidades mostrado en el botón Carrito. */
function actualizarContador() {
  const el = document.getElementById('contador');
  if (el) el.textContent = contarUnidades();
}

/** Muestra una notificación flotante temporal. */
function mostrarAviso(texto) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.classList.add('aviso--visible');
  setTimeout(() => aviso.classList.remove('aviso--visible'), 1800);
}

/* ---------- Página: catálogo ---------- */
function iniciarCatalogo() {
  const rejilla = document.getElementById('rejilla');
  const buscador = document.getElementById('buscador');
  const selector = document.getElementById('categoria');

  // Llena el selector con las categorías únicas
  [...new Set(PRODUCTOS.map((p) => p.categoria))].forEach((c) => {
    selector.insertAdjacentHTML('beforeend', `<option>${c}</option>`);
  });

  function pintar() {
    const texto = buscador.value.toLowerCase();
    const filtrados = PRODUCTOS.filter((p) =>
      p.nombre.toLowerCase().includes(texto) && (!selector.value || p.categoria === selector.value));
    rejilla.innerHTML = filtrados.length ? filtrados.map((p) => `
      <article class="tarjeta">
        <div class="tarjeta__icono">${p.icono}</div>
        <span class="tarjeta__categoria">${p.categoria}</span>
        <h3>${p.nombre}</h3>
        <span class="tarjeta__precio">${formatoPesos(p.precio)}</span>
        <span class="tarjeta__puntos">+${Math.round(p.precio / 1000)} puntos</span>
        <button class="boton" data-id="${p.id}">Agregar al carrito</button>
      </article>`).join('') : '<p class="vacio">No se encontraron productos.</p>';
  }

  // Delegación de eventos: un solo listener para todos los botones
  rejilla.addEventListener('click', (e) => {
    const boton = e.target.closest('button[data-id]');
    if (!boton) return;
    agregarAlCarrito(Number(boton.dataset.id));
    mostrarAviso('Producto agregado al carrito');
  });
  buscador.addEventListener('input', pintar);
  selector.addEventListener('change', pintar);
  pintar();
}

/* ---------- Página: carrito ---------- */
function iniciarCarrito() {
  const cuerpo = document.getElementById('contenido-carrito');

  function pintar() {
    const items = leerCarrito();
    if (!items.length) {
      cuerpo.innerHTML = '<p class="vacio">Tu carrito está vacío. <a href="index.html">Ir al catálogo</a></p>';
      return;
    }
    const filas = items.map((i) => {
      const p = PRODUCTOS.find((x) => x.id === i.id);
      return `<tr>
        <td>${p.icono} ${p.nombre}</td><td>${formatoPesos(p.precio)}</td>
        <td><button class="boton boton--borde" data-accion="menos" data-id="${p.id}">−</button>
            ${i.cantidad}
            <button class="boton boton--borde" data-accion="mas" data-id="${p.id}">+</button></td>
        <td>${formatoPesos(p.precio * i.cantidad)}</td>
        <td><button class="boton boton--peligro" data-accion="quitar" data-id="${p.id}">Quitar</button></td>
      </tr>`;
    }).join('');
    cuerpo.innerHTML = `
      <table class="tabla"><thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>${filas}</tbody></table>
      <div class="resumen"><span>Total:</span><span class="resumen__total">${formatoPesos(totalCarrito())}</span>
      <button class="boton" id="pagar">Finalizar compra</button></div>`;
  }

  cuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'pagar') {
      guardarCarrito([]);
      mostrarAviso('¡Compra registrada! Se generará tu factura.');
      pintar();
      return;
    }
    const id = Number(b.dataset.id);
    if (b.dataset.accion === 'mas') cambiarCantidad(id, 1);
    if (b.dataset.accion === 'menos') cambiarCantidad(id, -1);
    if (b.dataset.accion === 'quitar') quitarDelCarrito(id);
    pintar();
  });
  pintar();
}

/* ---------- Página: login ---------- */
function iniciarLogin() {
  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const v1 = mostrarError('correo', validarCorreo(document.getElementById('correo').value));
    const v2 = mostrarError('clave', validarClave(document.getElementById('clave').value));
    if (v1 && v2) { mostrarAviso('Datos válidos: enviando al servidor...'); }
  });
}

/* ---------- Página: registro ---------- */
function iniciarRegistro() {
  document.getElementById('form-registro').addEventListener('submit', (e) => {
    e.preventDefault();
    const clave = document.getElementById('clave').value;
    const resultados = [
      mostrarError('nombre', validarNombre(document.getElementById('nombre').value)),
      mostrarError('correo', validarCorreo(document.getElementById('correo').value)),
      mostrarError('celular', validarCelular(document.getElementById('celular').value)),
      mostrarError('clave', validarClave(clave)),
      mostrarError('confirmacion', validarConfirmacion(clave, document.getElementById('confirmacion').value))
    ];
    if (resultados.every(Boolean)) { mostrarAviso('Registro válido: creando cuenta...'); }
  });
}

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const pagina = document.body.dataset.pagina;
  iniciarEstrellas();
  renderEncabezado(pagina);
  const rutas = { catalogo: iniciarCatalogo, facturas: iniciarCarrito, login: iniciarLogin, registro: iniciarRegistro };
  if (rutas[pagina]) rutas[pagina]();
});
