<?php
// ─── Módulo de facturación ───────────────────────────────────
// Los precios de la tienda ya incluyen IVA: la factura lo discrimina (no lo suma),
// así el total de la factura siempre coincide con el total pagado.
const TASA_IVA = 0.19;

// Por si helpers.php aún no tiene esta función (1 = ADMIN según sales_world_online_db.sql)
if (!function_exists('esAdmin')) {
    function esAdmin(): bool {
        $u = $_SESSION['usuario'] ?? null;
        return $u && (int) $u['id_rol'] === 1;
    }
}

/**
 * Genera la factura de un pedido pagado.
 * Si el pedido ya tiene factura, devuelve la existente (no duplica).
 * Se puede llamar dentro de una transacción abierta (como en checkout.php).
 */
function generarFactura(PDO $pdo, int $idPedido): array {
    // ¿Ya tiene factura?
    $st = $pdo->prepare("SELECT id_factura, numero_factura FROM facturas WHERE id_pedido = :p");
    $st->execute(['p' => $idPedido]);
    if ($existente = $st->fetch()) {
        return [
            'id_factura'     => (int) $existente['id_factura'],
            'numero_factura' => $existente['numero_factura'],
        ];
    }

    // Datos del pedido, cliente y pago
    $st = $pdo->prepare(
        "SELECT p.id_pedido, p.id_usuario, p.estado, p.total,
                u.nombre, u.apellido, u.email, u.documento, u.ciudad,
                mp.nombre_metodo, pg.referencia_transaccion
           FROM pedidos p
           JOIN usuarios u           ON u.id_usuario = p.id_usuario
           LEFT JOIN pagos pg        ON pg.id_pedido = p.id_pedido
           LEFT JOIN metodos_pago mp ON mp.id_metodo = pg.id_metodo
          WHERE p.id_pedido = :p"
    );
    $st->execute(['p' => $idPedido]);
    $pedido = $st->fetch();

    if (!$pedido) {
        throw new Exception('El pedido no existe.');
    }
    if (!in_array($pedido['estado'], ['pagado', 'enviado', 'entregado'], true)) {
        throw new Exception('El pedido aún no está pagado.');
    }

    // Productos del pedido
    $st = $pdo->prepare(
        "SELECT dp.id_producto, pr.nombre_producto, dp.cantidad, dp.precio_unitario
           FROM detalle_pedido dp
           JOIN productos pr ON pr.id_producto = dp.id_producto
          WHERE dp.id_pedido = :p"
    );
    $st->execute(['p' => $idPedido]);
    $items = $st->fetchAll();

    if (empty($items)) {
        throw new Exception('El pedido no tiene productos.');
    }

    // Totales (el precio ya incluye IVA)
    $total    = round((float) $pedido['total'], 2);
    $subtotal = round($total / (1 + TASA_IVA), 2);
    $iva      = round($total - $subtotal, 2);

    $propia = !$pdo->inTransaction();
    if ($propia) $pdo->beginTransaction();

    try {
        $st = $pdo->prepare(
            "INSERT INTO facturas
               (id_pedido, id_usuario, cliente_nombre, cliente_documento, cliente_email,
                cliente_ciudad, metodo_pago, referencia_pago, subtotal, iva, total)
             VALUES
               (:pedido, :usuario, :nombre, :doc, :email,
                :ciudad, :metodo, :ref, :sub, :iva, :tot)"
        );
        $st->execute([
            'pedido'  => $idPedido,
            'usuario' => $pedido['id_usuario'],
            'nombre'  => trim($pedido['nombre'] . ' ' . $pedido['apellido']),
            'doc'     => $pedido['documento'],
            'email'   => $pedido['email'],
            'ciudad'  => $pedido['ciudad'],
            'metodo'  => $pedido['nombre_metodo'],
            'ref'     => $pedido['referencia_transaccion'],
            'sub'     => $subtotal,
            'iva'     => $iva,
            'tot'     => $total,
        ]);
        $idFactura = (int) $pdo->lastInsertId();

        // Número consecutivo: FAC-000001
        $numero = 'FAC-' . str_pad((string) $idFactura, 6, '0', STR_PAD_LEFT);
        $pdo->prepare("UPDATE facturas SET numero_factura = :n WHERE id_factura = :id")
            ->execute(['n' => $numero, 'id' => $idFactura]);

        // Detalle
        $stDet = $pdo->prepare(
            "INSERT INTO detalle_factura
               (id_factura, id_producto, descripcion, cantidad, precio_unitario, total_linea)
             VALUES (:f, :prod, :desc, :cant, :precio, :linea)"
        );
        foreach ($items as $it) {
            $stDet->execute([
                'f'      => $idFactura,
                'prod'   => $it['id_producto'],
                'desc'   => $it['nombre_producto'],
                'cant'   => $it['cantidad'],
                'precio' => $it['precio_unitario'],
                'linea'  => round($it['cantidad'] * $it['precio_unitario'], 2),
            ]);
        }

        if ($propia) $pdo->commit();
        return ['id_factura' => $idFactura, 'numero_factura' => $numero];
    } catch (Throwable $e) {
        if ($propia && $pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

/** Factura con su detalle (o null si no existe). */
function obtenerFactura(PDO $pdo, int $idFactura): ?array {
    $st = $pdo->prepare("SELECT * FROM facturas WHERE id_factura = :id");
    $st->execute(['id' => $idFactura]);
    $f = $st->fetch();
    if (!$f) return null;

    $st = $pdo->prepare("SELECT * FROM detalle_factura WHERE id_factura = :id ORDER BY id_detalle_factura");
    $st->execute(['id' => $idFactura]);
    $f['detalles'] = $st->fetchAll();
    return $f;
}

function facturasDeUsuario(PDO $pdo, int $idUsuario): array {
    $st = $pdo->prepare("SELECT * FROM facturas WHERE id_usuario = :u ORDER BY fecha_emision DESC");
    $st->execute(['u' => $idUsuario]);
    return $st->fetchAll();
}

function todasLasFacturas(PDO $pdo): array {
    return $pdo->query("SELECT * FROM facturas ORDER BY fecha_emision DESC")->fetchAll();
}

/** Anula (nunca borra) una factura EMITIDA. Devuelve true si se anuló. */
function anularFactura(PDO $pdo, int $idFactura, string $motivo): bool {
    $st = $pdo->prepare(
        "UPDATE facturas
            SET estado = 'ANULADA', motivo_anulacion = :m, fecha_anulacion = NOW()
          WHERE id_factura = :id AND estado = 'EMITIDA'"
    );
    $st->execute(['m' => mb_substr($motivo, 0, 255), 'id' => $idFactura]);
    return $st->rowCount() > 0;
}
