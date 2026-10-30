# Sales World Online – Módulo Front-end (Catálogo, Carrito y Checkout)

Evidencia **GA7-220501096-AA4-EV03** · Aprendiz: Brajhan Jacome · Ficha 3186647 · ADSO – SENA

## Descripción
Interfaz web para la tienda en línea Sales World Online: catálogo con búsqueda y filtros,
carrito de compras, formulario de checkout con validaciones y generación de factura imprimible.

## Historias de usuario cubiertas
HU_06 a HU_12 (ver informe GA4-220501095-AA4-EV04): lista de productos, carrito, confirmar compra, método de pago y acceso por navegador.

## Tecnologías
HTML5 · CSS3 (BEM, variables CSS, responsive) · JavaScript ES6 (sin librerías)

## Cómo ejecutarlo
Abrir `index.html` en el navegador (no requiere servidor ni instalación).

## Estructura
```
index.html
css/styles.css
js/productos.js     Datos del catálogo
js/validaciones.js  Reglas del formulario
js/carrito.js       Lógica del carrito
js/factura.js       Generación de factura
js/app.js           Controlador de interfaz
```

## Integración con el back-end (PHP)
El repositorio ya contiene `checkout.php`, `factura.php` y la base de datos. Para conectar,
reemplazar `obtenerProductos()` por un `fetch()` a la API y enviar la compra a `checkout.php`.
