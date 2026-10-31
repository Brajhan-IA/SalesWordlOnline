/**
 * admin.js
 * Módulo del administrador (HU_01 a HU_04):
 *   HU_01 ingresar como administrador con sus credenciales,
 *   HU_02 ver la lista de productos registrados,
 *   HU_03 modificar productos,
 *   HU_04 agregar nuevos productos y eliminar.
 *
 * SEGURIDAD (prototipo sin servidor): el correo y la contraseña del administrador NO están
 * escritos en el código. La primera vez, cada persona crea su cuenta; la contraseña se guarda
 * cifrada (PBKDF2 + SHA-256 + sal) solo en el navegador de esa persona (localStorage) y nunca
 * se envía a ningún servidor. Un sitio sin back-end no puede garantizar seguridad real: en el
 * sistema final el ingreso se validará en el back-end PHP con la base de datos.
 */
'use strict';

const CLAVE_SESION = 'swo_admin';
const CLAVE_CUENTA = 'swo_admin_cuenta';
const ITERACIONES_HASH = 100000;
const LADO_IMAGEN = 480; // píxeles del lado de la foto guardada (cuadrada)

/** Estado del formulario de producto: id en edición (null = producto nuevo) y foto actual. */
const edicion = { id: null, imagenActual: '' };

/* ---------- Sesión ---------- */

/** @returns {boolean} true si hay una sesión de administrador activa. */
function esAdmin() {
  try { return sessionStorage.getItem(CLAVE_SESION) === '1'; } catch (e) { return false; }
}

/** Muestra u oculta los botones del encabezado según la sesión. */
function actualizarEncabezadoAdmin() {
  const activo = esAdmin();
  $('btnIngresar').hidden = activo;
  $('btnPanelAdmin').hidden = !activo;
  $('btnSalir').hidden = !activo;
}

/* ---------- Cuenta del administrador (cifrada, solo en este navegador) ---------- */

/** @returns {Object|null} Cuenta guardada: { correo, sal, hash } o null si aún no existe. */
function cuentaAdmin() {
  try { return JSON.parse(localStorage.getItem(CLAVE_CUENTA)); } catch (e) { return null; }
}

/** Convierte bytes en texto hexadecimal. */
function aHex(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Convierte texto hexadecimal en bytes. */
function deHex(hex) {
  return new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));
}

/**
 * Calcula el hash PBKDF2-SHA256 de una contraseña.
 * @param {string} clave
 * @param {string} salHex - Sal aleatoria en hexadecimal.
 * @returns {Promise<string>} Hash en hexadecimal.
 */
async function calcularHash(clave, salHex) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: deHex(salHex), iterations: ITERACIONES_HASH }, material, 256);
  return aHex(bits);
}

/** Prepara la ventana de ingreso: "crear cuenta" la primera vez, "ingresar" después. */
function abrirLogin() {
  const existe = Boolean(cuentaAdmin());
  $('tituloLogin').textContent = existe ? 'Ingreso de administrador' : 'Crear cuenta de administrador';
  $('btnEnviarLogin').textContent = existe ? 'Ingresar' : 'Crear cuenta';
  $('filaConfirmar').hidden = existe;
  $('btnRestablecer').hidden = !existe;
  $('loginClave').autocomplete = existe ? 'current-password' : 'new-password';
  $('notaLogin').textContent = existe
    ? 'Ingresa con el correo y la contraseña que creaste en este navegador.'
    : 'Primera vez: crea tu correo y tu contraseña (mínimo 8 caracteres). Se guardan cifrados solo en este navegador y no se envían a ningún servidor.';
  $('loginError').textContent = '';
  $('formLogin').reset();
  if (!$('modalLogin').open) $('modalLogin').showModal();
}

/** Crea la cuenta (primera vez) o valida las credenciales, y abre el panel (HU_01). */
async function iniciarSesion(evento) {
  evento.preventDefault();
  if (!window.crypto || !crypto.subtle) {
    $('loginError').textContent = 'Este navegador no permite el cifrado necesario. Usa Chrome o Edge.';
    return;
  }
  const datos = {
    correo: $('loginUsuario').value.trim().toLowerCase(),
    clave: $('loginClave').value,
    confirmar: $('loginConfirmar').value
  };
  const cuenta = cuentaAdmin();
  const error = validarCuentaAdmin(datos, !cuenta);
  if (error) { $('loginError').textContent = error; return; }

  if (!cuenta) {
    const sal = aHex(crypto.getRandomValues(new Uint8Array(16)));
    const nueva = { correo: datos.correo, sal, hash: await calcularHash(datos.clave, sal) };
    try { localStorage.setItem(CLAVE_CUENTA, JSON.stringify(nueva)); }
    catch (e) { $('loginError').textContent = 'No se pudo guardar la cuenta en este navegador.'; return; }
  } else if (datos.correo !== cuenta.correo || await calcularHash(datos.clave, cuenta.sal) !== cuenta.hash) {
    $('loginError').textContent = 'Usuario o contraseña incorrectos.';
    return;
  }

  try { sessionStorage.setItem(CLAVE_SESION, '1'); } catch (e) { /* ignorar */ }
  $('formLogin').reset();
  $('loginError').textContent = '';
  $('modalLogin').close();
  actualizarEncabezadoAdmin();
  abrirPanelAdmin();
  avisar(cuenta ? 'Sesión de administrador iniciada' : 'Cuenta de administrador creada');
}

/** Borra la cuenta guardada en este navegador para crear una nueva (por ejemplo, si olvidó la contraseña). */
function restablecerCuenta() {
  if (!window.confirm('Se borrará la cuenta de administrador de este navegador y podrás crear otra. ¿Continuar?')) return;
  try { localStorage.removeItem(CLAVE_CUENTA); sessionStorage.removeItem(CLAVE_SESION); } catch (e) { /* ignorar */ }
  actualizarEncabezadoAdmin();
  abrirLogin();
}

/** Cierra la sesión del administrador. */
function cerrarSesion() {
  try { sessionStorage.removeItem(CLAVE_SESION); } catch (e) { /* ignorar */ }
  $('modalAdmin').close();
  actualizarEncabezadoAdmin();
  avisar('Sesión cerrada');
}

/* ---------- Lista de productos (HU_02) ---------- */

/** Abre el panel solo si hay sesión de administrador. */
function abrirPanelAdmin() {
  if (!esAdmin()) { abrirLogin(); return; }
  pintarTablaAdmin();
  if (!$('modalAdmin').open) $('modalAdmin').showModal();
}

/** Dibuja la tabla con todos los productos registrados. */
function pintarTablaAdmin() {
  $('totalProductos').textContent = PRODUCTOS.length;
  $('filasAdmin').innerHTML = PRODUCTOS.length === 0
    ? '<tr><td colspan="6" class="vacio">No hay productos. Usa "Agregar producto".</td></tr>'
    : PRODUCTOS.map((p) => `
      <tr>
        <td><span class="miniatura">${htmlImagen(p, 'miniatura__img')}</span></td>
        <td><strong>${escaparHTML(p.nombre)}</strong><small>${escaparHTML(p.codigo)}</small></td>
        <td>${escaparHTML(p.categoria)}</td>
        <td class="num">${formatearPesos(p.precio)}</td>
        <td class="num">${p.stock}</td>
        <td class="acciones-fila">
          <button class="btn btn--secundario btn--chico" data-editar="${p.id}">Editar</button>
          <button class="btn btn--peligro btn--chico" data-borrar="${p.id}">Eliminar</button>
        </td>
      </tr>`).join('');
}

/** Refresca todo lo que depende del catálogo (tienda, carrito y panel). */
function refrescarTodo() {
  Carrito.sanear();
  pintarProductos();
  pintarCarrito();
  pintarTablaAdmin();
}

/* ---------- Formulario de producto (HU_03 y HU_04) ---------- */

/**
 * Abre el formulario para crear (sin id) o editar (con id) un producto.
 * @param {number|null} id
 */
function abrirFormularioProducto(id = null) {
  const form = $('formProducto');
  form.reset();
  pintarErroresProducto({});
  edicion.id = id;
  edicion.imagenActual = '';

  const producto = id === null ? null : obtenerProductoPorId(id);
  $('tituloProducto').textContent = producto ? 'Editar producto' : 'Agregar producto';
  $('btnGuardarProducto').textContent = producto ? 'Guardar cambios' : 'Agregar producto';
  if (producto) {
    form.nombre.value = producto.nombre;
    form.categoria.value = producto.categoria;
    form.descripcion.value = producto.descripcion;
    form.precio.value = producto.precio;
    form.stock.value = producto.stock;
    edicion.imagenActual = producto.imagen || '';
  }
  pintarVistaPrevia(edicion.imagenActual);
  $('modalProducto').showModal();
}

/** Muestra la foto actual o seleccionada. */
function pintarVistaPrevia(src) {
  $('vistaPrevia').innerHTML = src
    ? `<img src="${escaparHTML(src)}" alt="Vista previa de la foto del producto">`
    : '<span>Sin foto: se mostrará un ícono</span>';
}

/** Muestra los mensajes de error del formulario de producto. */
function pintarErroresProducto(errores) {
  document.querySelectorAll('[data-error-prod]').forEach((el) => {
    el.textContent = errores[el.dataset.errorProd] || '';
  });
}

/**
 * Convierte la foto elegida en una imagen cuadrada de LADO_IMAGEN px (JPEG) para que
 * ocupe poco espacio en el navegador.
 * @param {File} archivo
 * @returns {Promise<string>} Imagen como data URL.
 */
function procesarImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    if (!archivo.type.startsWith('image/')) { rechazar(new Error('El archivo debe ser una imagen.')); return; }
    const lector = new FileReader();
    lector.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => rechazar(new Error('La imagen no es válida.'));
      img.onload = () => {
        const lienzo = document.createElement('canvas');
        lienzo.width = lienzo.height = LADO_IMAGEN;
        const ctx = lienzo.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, LADO_IMAGEN, LADO_IMAGEN);
        const k = Math.min(LADO_IMAGEN / img.width, LADO_IMAGEN / img.height);
        const w = img.width * k, h = img.height * k;
        ctx.drawImage(img, (LADO_IMAGEN - w) / 2, (LADO_IMAGEN - h) / 2, w, h);
        resolver(lienzo.toDataURL('image/jpeg', 0.82));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

/** Valida y guarda el producto (crear o actualizar). */
async function guardarFormularioProducto(evento) {
  evento.preventDefault();
  const form = $('formProducto');
  const datos = {
    nombre: form.nombre.value.trim(),
    categoria: form.categoria.value,
    descripcion: form.descripcion.value.trim(),
    precio: form.precio.value,
    stock: form.stock.value
  };
  const errores = validarProducto(datos);
  pintarErroresProducto(errores);
  if (Object.keys(errores).length > 0) return;

  let imagen = edicion.imagenActual;
  const archivo = form.imagen.files[0];
  if (archivo) {
    try {
      imagen = await procesarImagen(archivo);
    } catch (e) {
      pintarErroresProducto({ imagen: e.message });
      return;
    }
  }

  const producto = { ...datos, precio: Number(datos.precio), stock: Number(datos.stock), imagen };
  if (edicion.id === null) {
    crearProducto(producto);
    avisar('Producto agregado al catálogo');
  } else {
    actualizarProducto(edicion.id, producto);
    avisar('Producto actualizado');
  }
  if (!guardarProductos()) avisar('No se pudo guardar: el almacenamiento del navegador está lleno.');
  $('modalProducto').close();
  refrescarTodo();
}

/** Elimina un producto después de confirmar. */
function borrarProducto(id) {
  const producto = obtenerProductoPorId(id);
  if (!producto || !window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) return;
  eliminarProducto(id);
  refrescarTodo();
  avisar('Producto eliminado');
}

/* ---------- Eventos ---------- */

function registrarEventosAdmin() {
  // Categorías disponibles para el formulario (sin "Todos")
  $('selectCategoria').innerHTML = '<option value="">Selecciona...</option>' +
    CATEGORIAS.filter((c) => c !== 'Todos').map((c) => `<option>${c}</option>`).join('');

  $('btnIngresar').addEventListener('click', abrirLogin);
  $('btnRestablecer').addEventListener('click', restablecerCuenta);
  $('btnCancelarLogin').addEventListener('click', () => $('modalLogin').close());
  $('formLogin').addEventListener('submit', iniciarSesion);
  $('btnPanelAdmin').addEventListener('click', abrirPanelAdmin);
  $('btnSalir').addEventListener('click', cerrarSesion);
  $('btnSalirPanel').addEventListener('click', cerrarSesion);
  $('btnCerrarAdmin').addEventListener('click', () => $('modalAdmin').close());

  $('btnNuevoProducto').addEventListener('click', () => abrirFormularioProducto(null));
  $('btnRestaurar').addEventListener('click', () => {
    if (!window.confirm('Se borrarán los cambios y volverá el catálogo de ejemplo. ¿Continuar?')) return;
    restaurarProductos();
    refrescarTodo();
    avisar('Catálogo restaurado');
  });

  $('filasAdmin').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.editar) abrirFormularioProducto(Number(b.dataset.editar));
    if (b.dataset.borrar) borrarProducto(Number(b.dataset.borrar));
  });

  $('formProducto').addEventListener('submit', guardarFormularioProducto);
  $('btnCancelarProducto').addEventListener('click', () => $('modalProducto').close());
  $('inputImagen').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) { pintarVistaPrevia(edicion.imagenActual); return; }
    try {
      pintarVistaPrevia(await procesarImagen(archivo));
      pintarErroresProducto({});
    } catch (err) {
      pintarErroresProducto({ imagen: err.message });
      e.target.value = '';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  registrarEventosAdmin();
  actualizarEncabezadoAdmin();
});
