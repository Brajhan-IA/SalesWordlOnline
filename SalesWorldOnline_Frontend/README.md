# Sales World Online – Módulo Front-end (Catálogo, Carrito y Checkout)

Evidencia **GA7-220501096-AA4-EV03** · Aprendiz: Brajhan Jacome · Ficha 3186647 · ADSO – SENA

## Descripción
Interfaz web para la tienda en línea Sales World Online: catálogo con búsqueda y filtros,
carrito de compras, formulario de checkout con validaciones y generación de factura imprimible.

## Módulo del administrador
Botón **Ingresar** → correo `admin@salesworld.com` y contraseña `Admin2026` (solo demostración).
Desde el panel se pueden **agregar, editar y eliminar productos** con su fotografía. Los cambios se guardan en el navegador.

## Historias de usuario cubiertas
HU_01 a HU_04 (administrador) y HU_06 a HU_12 (cliente) (ver informe GA4-220501095-AA4-EV04). La HU_05 (registro de clientes) queda para la siguiente etapa.

## Tecnologías
HTML5 · CSS3 (BEM, variables CSS, tema oscuro, responsive) · JavaScript ES6 (sin librerías)

## Cómo ejecutarlo
Abrir `index.html` en el navegador (no requiere servidor ni instalación).

## Estructura
```
index.html
css/styles.css
img/                Fotografías de los productos
js/productos.js     Datos del catálogo
js/validaciones.js  Reglas del formulario
js/carrito.js       Lógica del carrito
js/factura.js       Generación de factura
js/app.js           Controlador de interfaz del cliente
js/admin.js         Módulo del administrador
```

## Integración con el back-end (PHP)
El repositorio ya contiene `checkout.php`, `factura.php` y la base de datos. Para conectar,
reemplazar `obtenerProductos()` por un `fetch()` a la API y enviar la compra a `checkout.php`.
