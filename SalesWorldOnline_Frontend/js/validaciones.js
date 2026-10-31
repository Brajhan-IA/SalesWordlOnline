/**
 * validaciones.js
 * Reglas de validación del formulario de checkout (HU: "Como cliente quiero
 * ingresar mis datos para recibir mi factura y mi pedido").
 */
'use strict';

const REGLAS = {
  nombre:     { ok: (v) => v.trim().length >= 3,               msg: 'Ingresa tu nombre completo (mín. 3 letras).' },
  documento:  { ok: (v) => /^\d{6,12}$/.test(v.trim()),        msg: 'El documento debe tener entre 6 y 12 números.' },
  correo:     { ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Ingresa un correo válido.' },
  telefono:   { ok: (v) => /^3\d{9}$/.test(v.trim()),          msg: 'Celular colombiano de 10 dígitos (inicia en 3).' },
  direccion:  { ok: (v) => v.trim().length >= 6,               msg: 'Ingresa una dirección de envío completa.' },
  metodoPago: { ok: (v) => v !== '',                           msg: 'Selecciona un método de pago.' }
};

/**
 * Valida todos los campos del formulario.
 * @param {Object} datos - Pares campo/valor del formulario.
 * @returns {Object} Mapa campo -> mensaje de error (vacío si todo es válido).
 */
function validarFormulario(datos) {
  const errores = {};
  Object.keys(REGLAS).forEach((campo) => {
    if (!REGLAS[campo].ok(datos[campo] || '')) {
      errores[campo] = REGLAS[campo].msg;
    }
  });
  return errores;
}

/**
 * Valida el formulario de producto del administrador (HU_03 y HU_04).
 * @param {Object} datos - nombre, categoria, descripcion, precio y stock.
 * @returns {Object} Mapa campo -> mensaje de error (vacío si todo es válido).
 */
function validarProducto(datos) {
  const errores = {};
  const precio = Number(datos.precio);
  const stock = Number(datos.stock);
  if ((datos.nombre || '').trim().length < 3) errores.nombre = 'El nombre debe tener mínimo 3 letras.';
  if (!datos.categoria) errores.categoria = 'Selecciona una categoría.';
  if ((datos.descripcion || '').trim().length < 5) errores.descripcion = 'Escribe una descripción de mínimo 5 letras.';
  if (!Number.isInteger(precio) || precio <= 0) errores.precio = 'El precio debe ser un número entero mayor que 0.';
  if (String(datos.stock).trim() === '' || !Number.isInteger(stock) || stock < 0) errores.stock = 'El stock debe ser un número entero (0 o más).';
  return errores;
}
