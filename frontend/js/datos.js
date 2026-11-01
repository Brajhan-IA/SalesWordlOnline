/**
 * datos.js - Datos de ejemplo del catálogo de Sales World Online.
 * En la versión integrada con el back-end estos datos provienen de la
 * tabla `productos` de la base de datos MySQL.
 */
'use strict';

/** @type {{id:number,nombre:string,categoria:string,precio:number,icono:string}[]} */
const PRODUCTOS = [
  { id: 1, nombre: 'Auriculares Nebula X',   categoria: 'Audio',       precio: 189000,  icono: '🎧' },
  { id: 2, nombre: 'Teclado Orion RGB',      categoria: 'Periféricos', precio: 249000,  icono: '⌨️' },
  { id: 3, nombre: 'Mouse Pulsar Pro',       categoria: 'Periféricos', precio: 129000,  icono: '🖱️' },
  { id: 4, nombre: 'Monitor Galaxy 27"',     categoria: 'Pantallas',   precio: 1190000, icono: '🖥️' },
  { id: 5, nombre: 'Smartwatch Cometa',      categoria: 'Wearables',   precio: 359000,  icono: '⌚' },
  { id: 6, nombre: 'Parlante Aurora BT',     categoria: 'Audio',       precio: 159000,  icono: '🔊' },
  { id: 7, nombre: 'Cámara Eclipse 4K',      categoria: 'Fotografía',  precio: 899000,  icono: '📷' },
  { id: 8, nombre: 'Tablet Astro 10"',       categoria: 'Pantallas',   precio: 749000,  icono: '📱' }
];
