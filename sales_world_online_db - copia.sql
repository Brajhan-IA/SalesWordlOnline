-- =====================================================================
--  SALES WORLD ONLINE — BASE DE DATOS
--  Motor: MySQL 8.0+  |  Codificación: utf8mb4
--  Proyecto: Sales World Online (Java/Spring Boot + MySQL)
--  Generado a partir del prototipo: Untitled-1.html
--  Aprendiz: Brajhan Alejandro Jacome — Ficha 3186647
-- =====================================================================

DROP DATABASE IF EXISTS sales_world_online;
CREATE DATABASE sales_world_online
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;
USE sales_world_online;

-- =====================================================================
-- 1. ROLES
-- =====================================================================
CREATE TABLE roles (
  id_rol       INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol   VARCHAR(30) NOT NULL UNIQUE   -- ADMIN, CLIENTE, CLIENTE_PREFERENCIAL
) ENGINE=InnoDB;

-- =====================================================================
-- 2. NIVELES DE FIDELIZACIÓN (Bronce / Plata / Oro / Platino)
-- =====================================================================
CREATE TABLE niveles_fidelizacion (
  id_nivel        INT AUTO_INCREMENT PRIMARY KEY,
  nombre_nivel    VARCHAR(20) NOT NULL UNIQUE,   -- Bronce, Plata, Oro, Platino
  puntos_minimos  INT NOT NULL,
  descripcion     VARCHAR(150)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. USUARIOS
-- =====================================================================
CREATE TABLE usuarios (
  id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(80)  NOT NULL,
  apellido        VARCHAR(80)  NOT NULL,
  email           VARCHAR(120) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  telefono        VARCHAR(20),
  documento       VARCHAR(20)  UNIQUE,           -- CC/NIT
  ciudad          VARCHAR(100),
  id_rol          INT NOT NULL,
  id_nivel        INT NOT NULL DEFAULT 1,
  puntos_totales  INT NOT NULL DEFAULT 0,
  fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_usuario_rol   FOREIGN KEY (id_rol)   REFERENCES roles(id_rol),
  CONSTRAINT fk_usuario_nivel FOREIGN KEY (id_nivel) REFERENCES niveles_fidelizacion(id_nivel)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. CATEGORÍAS
-- =====================================================================
CREATE TABLE categorias (
  id_categoria    INT AUTO_INCREMENT PRIMARY KEY,
  nombre_categoria VARCHAR(50) NOT NULL UNIQUE,  -- Tecnología, Ropa, Zapatos, Autos, Herramientas, Electrodomésticos, Marketplace
  slug            VARCHAR(50) NOT NULL UNIQUE,   -- tecnologia, ropa, zapatos, autos, herramientas, electrodomesticos, cliente
  icono           VARCHAR(10)                    -- emoji usado en la tarjeta de producto
) ENGINE=InnoDB;

-- =====================================================================
-- 5. PRODUCTOS (catálogo propio + publicados por clientes en el marketplace)
-- =====================================================================
CREATE TABLE productos (
  id_producto       INT AUTO_INCREMENT PRIMARY KEY,
  nombre_producto   VARCHAR(150) NOT NULL,
  descripcion       TEXT,
  precio_actual     DECIMAL(14,2) NOT NULL,
  precio_anterior   DECIMAL(14,2),
  id_categoria      INT NOT NULL,
  imagen_url        VARCHAR(500),
  badge             ENUM('hot','new','client','ninguno') NOT NULL DEFAULT 'ninguno',
  puntos_otorgados  INT GENERATED ALWAYS AS (FLOOR(precio_actual / 1000)) STORED,
  origen            ENUM('tienda','marketplace') NOT NULL DEFAULT 'tienda',
  id_vendedor       INT NULL,                    -- FK a usuarios; NULL si es producto propio de la tienda
  nombre_vendedor   VARCHAR(150),                 -- marca o vendedor mostrado en la tarjeta
  stock             INT NOT NULL DEFAULT 100,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
  CONSTRAINT fk_producto_vendedor  FOREIGN KEY (id_vendedor)  REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. LISTA DE DESEOS (wishlist / ♥)
-- =====================================================================
CREATE TABLE lista_deseos (
  id_deseo       INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  id_producto    INT NOT NULL,
  fecha_agregado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_deseo_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuarios(id_usuario)   ON DELETE CASCADE,
  CONSTRAINT fk_deseo_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
  UNIQUE KEY uq_usuario_producto (id_usuario, id_producto)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. CARRITOS E ÍTEMS DE CARRITO
-- =====================================================================
CREATE TABLE carritos (
  id_carrito     INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NULL,                        -- NULL mientras el usuario navega como invitado
  session_token  VARCHAR(100),                     -- identifica el carrito de un invitado
  estado         ENUM('activo','convertido','abandonado') NOT NULL DEFAULT 'activo',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE items_carrito (
  id_item          INT AUTO_INCREMENT PRIMARY KEY,
  id_carrito       INT NOT NULL,
  id_producto      INT NOT NULL,
  cantidad         INT NOT NULL DEFAULT 1,
  precio_unitario  DECIMAL(14,2) NOT NULL,         -- precio "congelado" al momento de agregar
  CONSTRAINT fk_item_carrito  FOREIGN KEY (id_carrito)  REFERENCES carritos(id_carrito)   ON DELETE CASCADE,
  CONSTRAINT fk_item_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. MÉTODOS DE PAGO Y PLANES DE CUOTAS
-- =====================================================================
CREATE TABLE metodos_pago (
  id_metodo     INT AUTO_INCREMENT PRIMARY KEY,
  nombre_metodo VARCHAR(30) NOT NULL UNIQUE        -- tarjeta_credito, tarjeta_debito, pse, cuotas
) ENGINE=InnoDB;

CREATE TABLE planes_cuota (
  id_plan               INT AUTO_INCREMENT PRIMARY KEY,
  numero_cuotas         INT NOT NULL UNIQUE,        -- 3, 6, 12, 24
  tasa_interes_mensual  DECIMAL(5,4) NOT NULL,       -- 0.0000, 0.0080, 0.0120, 0.0150
  id_nivel_minimo       INT NOT NULL,                -- nivel mínimo para acceder al plan
  CONSTRAINT fk_plan_nivel FOREIGN KEY (id_nivel_minimo) REFERENCES niveles_fidelizacion(id_nivel)
) ENGINE=InnoDB;

-- =====================================================================
-- 9. PEDIDOS Y DETALLE DE PEDIDO
-- =====================================================================
CREATE TABLE pedidos (
  id_pedido      INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT NOT NULL,
  fecha_pedido   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado         ENUM('pendiente','pagado','enviado','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  subtotal       DECIMAL(14,2) NOT NULL,
  total          DECIMAL(14,2) NOT NULL,
  puntos_ganados INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE detalle_pedido (
  id_detalle       INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido        INT NOT NULL,
  id_producto      INT NOT NULL,
  cantidad         INT NOT NULL DEFAULT 1,
  precio_unitario  DECIMAL(14,2) NOT NULL,
  subtotal         DECIMAL(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  CONSTRAINT fk_detalle_pedido   FOREIGN KEY (id_pedido)   REFERENCES pedidos(id_pedido)   ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
) ENGINE=InnoDB;

-- =====================================================================
-- 10. PAGOS (contado, tarjeta o crédito a cuotas)
-- =====================================================================
CREATE TABLE pagos (
  id_pago                     INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido                   INT NOT NULL UNIQUE,
  id_metodo                   INT NOT NULL,
  id_plan                     INT NULL,             -- solo aplica si el método es "cuotas"
  monto                       DECIMAL(14,2) NOT NULL,
  valor_cuota                 DECIMAL(14,2) NULL,
  numero_tarjeta_enmascarado  VARCHAR(25),           -- ej. **** **** **** 3456 (nunca el número completo)
  estado_pago                 ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  referencia_transaccion      VARCHAR(100),
  fecha_pago                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pago_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_pago_metodo FOREIGN KEY (id_metodo) REFERENCES metodos_pago(id_metodo),
  CONSTRAINT fk_pago_plan   FOREIGN KEY (id_plan)   REFERENCES planes_cuota(id_plan)
) ENGINE=InnoDB;

-- =====================================================================
-- 11. SOLICITUDES DE CRÉDITO (cupo preferencial)
-- =====================================================================
CREATE TABLE solicitudes_credito (
  id_solicitud     INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario       INT NOT NULL,
  cupo_solicitado  DECIMAL(14,2),
  estado           ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_solicitud  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta  DATETIME NULL,
  observaciones    VARCHAR(255),
  CONSTRAINT fk_solicitud_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

-- =====================================================================
-- 12. HISTORIAL DE PUNTOS (ganados por compra / canjeados por recompensas)
-- =====================================================================
CREATE TABLE historial_puntos (
  id_historial     INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario       INT NOT NULL,
  tipo_movimiento  ENUM('ganado','canjeado') NOT NULL,
  puntos           INT NOT NULL,
  id_pedido        INT NULL,
  descripcion      VARCHAR(200),
  fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_historial_pedido  FOREIGN KEY (id_pedido)  REFERENCES pedidos(id_pedido)
) ENGINE=InnoDB;

-- =====================================================================
-- TRIGGER: mantener puntos_totales y nivel de fidelización sincronizados
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_actualizar_puntos_usuario
AFTER INSERT ON historial_puntos
FOR EACH ROW
BEGIN
  DECLARE v_puntos_actuales INT;

  IF NEW.tipo_movimiento = 'ganado' THEN
    UPDATE usuarios SET puntos_totales = puntos_totales + NEW.puntos WHERE id_usuario = NEW.id_usuario;
  ELSE
    UPDATE usuarios SET puntos_totales = puntos_totales - NEW.puntos WHERE id_usuario = NEW.id_usuario;
  END IF;

  SELECT puntos_totales INTO v_puntos_actuales FROM usuarios WHERE id_usuario = NEW.id_usuario;

  UPDATE usuarios
  SET id_nivel = (
    SELECT id_nivel FROM niveles_fidelizacion
    WHERE puntos_minimos <= v_puntos_actuales
    ORDER BY puntos_minimos DESC
    LIMIT 1
  )
  WHERE id_usuario = NEW.id_usuario;
END$$

DELIMITER ;

-- =====================================================================
-- DATOS INICIALES (seed) — catálogos base
-- =====================================================================
INSERT INTO roles (nombre_rol) VALUES
  ('ADMIN'), ('CLIENTE'), ('CLIENTE_PREFERENCIAL');

INSERT INTO niveles_fidelizacion (nombre_nivel, puntos_minimos, descripcion) VALUES
  ('Bronce',  0,    'Nivel inicial de todo cliente registrado'),
  ('Plata',   500,  'Acceso a beneficios intermedios'),
  ('Oro',     2000, 'Cuotas sin interés hasta 3 meses'),
  ('Platino', 5000, 'Máximo nivel: mejores tasas y cupo de crédito preferencial');

INSERT INTO categorias (nombre_categoria, slug, icono) VALUES
  ('Tecnología',        'tecnologia',        '📱'),
  ('Ropa',               'ropa',              '👔'),
  ('Zapatos',            'zapatos',           '👟'),
  ('Autos',              'autos',             '🚗'),
  ('Herramientas',       'herramientas',      '🔧'),
  ('Electrodomésticos',  'electrodomesticos', '🏠'),
  ('Marketplace Cliente','cliente',           '🏪');

INSERT INTO metodos_pago (nombre_metodo) VALUES
  ('tarjeta_credito'), ('tarjeta_debito'), ('pse'), ('cuotas');

INSERT INTO planes_cuota (numero_cuotas, tasa_interes_mensual, id_nivel_minimo) VALUES
  (3,  0.0000, 3),  -- sin interés: requiere nivel Oro
  (6,  0.0080, 1),  -- disponible desde Bronce
  (12, 0.0120, 1),
  (24, 0.0150, 1);

-- Usuarios de ejemplo
INSERT INTO usuarios (nombre, apellido, email, password_hash, telefono, documento, ciudad, id_rol, id_nivel) VALUES
  ('Admin', 'Sistema', 'admin@salesworldonline.com', 'HASH_PENDIENTE', NULL, NULL, 'Cúcuta', 1, 4),
  ('Brajhan', 'Jácome Sáenz', 'brajhan@example.com', 'HASH_PENDIENTE', '+57 300 000 0000', '12345678', 'Cúcuta, Norte de Santander', 3, 1);

-- Productos del catálogo propio (tomados del prototipo Untitled-1.html)
INSERT INTO productos (nombre_producto, descripcion, precio_actual, precio_anterior, id_categoria, imagen_url, badge, origen) VALUES
  ('Smartphone Premium X12', 'Pantalla AMOLED 6.7", procesador octa-core 3.2GHz, cámara 200MP, batería 6000mAh. 5G Dual SIM.', 4195800, 5040000, 1, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', 'ninguno', 'tienda'),
  ('Laptop Gaming RTX 4090', 'Intel Core i9, 64GB RAM DDR5, SSD 2TB NVMe, pantalla 4K 240Hz.', 9235800, 10920000, 1, 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89', 'hot', 'tienda'),
  ('Nike Air Max 270 React', 'Cámara de aire de 270° con foam React para máximo retorno de energía.', 350000, 550000, 3, 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111', 'new', 'tienda'),
  ('Cocina Smart Inducción 5 Zonas', 'Control WiFi, 5 zonas independientes, modo automático con IA, ahorro de energía 40%.', 2935800, 3570000, 6, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136', 'new', 'tienda'),
  ('Ferrari SF90 Stradale', 'V8 biturbo + 3 motores eléctricos, 1.000 CV totales. Híbrido plug-in, 0-100 en 2.5s.', 2053800000, 2310000000, 4, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888', 'hot', 'tienda'),
  ('Mercedes-Benz S-Class S580', 'V8 biturbo 496 CV, masajes en 5 zonas, pantalla MBUX Hyperscreen 56".', 512400000, 567000000, 4, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8', 'ninguno', 'tienda'),
  ('Studio F — Vestido Verano 2026', 'Tela fluida premium con estampado exclusivo. Colección Primavera-Verano 2026.', 625800, 793800, 2, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d', 'new', 'tienda'),
  ('Arturo Calle — Chaqueta Cuero', 'Cuero genuino curtido al vegetal. Forro interior polar desmontable.', 987000, 1176000, 2, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea', 'hot', 'tienda'),
  ('Moto Eléctrica Sport 100', '200 km de autonomía, carga rápida en 2h, velocidad máx 150 km/h.', 30240000, 35700000, 4, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 'new', 'tienda');

-- Producto de ejemplo publicado en el Marketplace por un cliente
INSERT INTO productos (nombre_producto, descripcion, precio_actual, precio_anterior, id_categoria, imagen_url, badge, origen, id_vendedor, nombre_vendedor) VALUES
  ('Mochila Wayuu Auténtica', 'Tejida a mano por artesanas de La Guajira. Colores vibrantes, 100% algodón. Certificado de autenticidad.', 180000, 280000, 7, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5ELsa5P4km5e23Kr8Rbbu8ua4ZGigrZbkuw&s', 'client', 'marketplace', 2, 'Artesanías La Guajira');

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================
