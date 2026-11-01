/**
 * validaciones.js - Funciones de validación reutilizables de los formularios.
 * Cada función devuelve '' si el dato es válido o el mensaje de error.
 */
'use strict';

/** Valida un nombre completo (solo letras y espacios, 3 a 60 caracteres). */
function validarNombre(valor) {
  const texto = valor.trim();
  if (texto.length < 3 || texto.length > 60) return 'El nombre debe tener entre 3 y 60 caracteres.';
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(texto)) return 'El nombre solo admite letras y espacios.';
  return '';
}

/** Valida el formato de un correo electrónico. */
function validarCorreo(valor) {
  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return patron.test(valor.trim()) ? '' : 'Ingrese un correo válido (ejemplo@dominio.com).';
}

/** Valida un celular colombiano de 10 dígitos que inicia por 3. */
function validarCelular(valor) {
  return /^3\d{9}$/.test(valor.trim()) ? '' : 'El celular debe tener 10 dígitos e iniciar por 3.';
}

/** Valida la contraseña: mínimo 8 caracteres, una letra y un número. */
function validarClave(valor) {
  if (valor.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
  if (!/[A-Za-z]/.test(valor) || !/\d/.test(valor)) return 'Debe combinar letras y números.';
  return '';
}

/** Valida que la confirmación coincida con la contraseña. */
function validarConfirmacion(clave, confirmacion) {
  return clave === confirmacion ? '' : 'Las contraseñas no coinciden.';
}

/**
 * Muestra u oculta el mensaje de error de un campo del formulario.
 * @param {string} idCampo  id del <input>
 * @param {string} mensaje  texto de error ('' limpia el error)
 * @returns {boolean} true si el campo es válido
 */
function mostrarError(idCampo, mensaje) {
  const contenedor = document.getElementById(idCampo).closest('.campo');
  contenedor.classList.toggle('campo--error', mensaje !== '');
  contenedor.querySelector('.campo__mensaje').textContent = mensaje;
  return mensaje === '';
}
