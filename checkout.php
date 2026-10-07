<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/facturacion.php';

if (!estaLogueado()) {
    $_SESSION['flash'] = '⚠️ Debes iniciar sesión para pagar.';
    redirigir('login.php');
}

$carrito = carritoSesion();
if (empty($carrito)) redirigir('carrito.php');

$usuario = usuarioActual();
$total = totalCarrito($carrito);

// Planes de cuota disponibles para el nivel del usuario
$stmt = $pdo->prepare(
    "SELECT pc.*, nf.nombre_nivel FROM planes_cuota pc
     JOIN niveles_fidelizacion nf ON nf.id_nivel = pc.id_nivel_minimo
     WHERE pc.id_nivel_minimo <= :nivel ORDER BY pc.numero_cuotas"
);
$stmt->execute(['nivel' => $usuario['id_nivel']]);
$planes = $stmt->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $metodo = $_POST['metodo']; // tarjeta_credito | tarjeta_debito | pse | cuotas
    $idPlan = $_POST['id_plan'] ?? null;
    $numTarjeta = preg_replace('/\D/', '', $_POST['numero_tarjeta'] ?? '');

    $pdo->beginTransaction();
    try {
        $puntosGanados = calcularPuntos($total);

        // 1) Pedido
        $stmt = $pdo->prepare(
            "INSERT INTO pedidos (id_usuario, estado, subtotal, total, puntos_ganados)
             VALUES (:u,'pagado',:sub,:tot,:pts)"
        );
        $stmt->execute(['u' => $usuario['id_usuario'], 'sub' => $total, 'tot' => $total, 'pts' => $puntosGanados]);
        $idPedido = (int) $pdo->lastInsertId();

        // 2) Detalle del pedido
        $stmtDet = $pdo->prepare(
            "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (:p,:prod,:cant,:precio)"
        );
        foreach ($carrito as $item) {
            $stmtDet->execute([
                'p' => $idPedido, 'prod' => $item['id_producto'],
                'cant' => $item['cantidad'], 'precio' => $item['precio'],
            ]);
        }

        // 3) Pago
        $idMetodo = ['tarjeta_credito' => 1, 'tarjeta_debito' => 2, 'pse' => 3, 'cuotas' => 4][$metodo];
        $valorCuota = null;
        if ($metodo === 'cuotas' && $idPlan) {
            $plan = $pdo->prepare("SELECT * FROM planes_cuota WHERE id_plan = :id");
            $plan->execute(['id' => $idPlan]);
            $plan = $plan->fetch();
            $r = (float) $plan['tasa_interes_mensual'];
            $n = (int) $plan['numero_cuotas'];
            $valorCuota = $r == 0 ? $total / $n : $total * ($r * pow(1 + $r, $n)) / (pow(1 + $r, $n) - 1);
        }
        $stmt = $pdo->prepare(
            "INSERT INTO pagos (id_pedido, id_metodo, id_plan, monto, valor_cuota, numero_tarjeta_enmascarado, estado_pago, referencia_transaccion)
             VALUES (:pedido,:metodo,:plan,:monto,:cuota,:tarjeta,'aprobado',:ref)"
        );
        $stmt->execute([
            'pedido' => $idPedido, 'metodo' => $idMetodo, 'plan' => $metodo === 'cuotas' ? $idPlan : null,
            'monto' => $total, 'cuota' => $valorCuota,
            'tarjeta' => $numTarjeta ? '**** **** **** ' . substr($numTarjeta, -4) : null,
            'ref' => 'SWO-' . strtoupper(bin2hex(random_bytes(4))),
        ]);

        // 4) Puntos ganados (el trigger actualiza usuarios.puntos_totales y nivel)
        $pdo->prepare(
            "INSERT INTO historial_puntos (id_usuario, tipo_movimiento, puntos, id_pedido, descripcion)
             VALUES (:u,'ganado',:pts,:pedido,'Compra en Sales World Online')"
        )->execute(['u' => $usuario['id_usuario'], 'pts' => $puntosGanados, 'pedido' => $idPedido]);

        // 5) Factura (dentro de la misma transacción: si falla, se revierte todo)
        $factura = generarFactura($pdo, $idPedido);

        $pdo->commit();

        // Refrescar usuario en sesión con sus puntos actualizados
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id_usuario = :id");
        $stmt->execute(['id' => $usuario['id_usuario']]);
        $_SESSION['usuario'] = $stmt->fetch();
        $_SESSION['carrito'] = [];

        $_SESSION['flash'] = "✅ ¡Pago procesado! Ganaste ⭐{$puntosGanados} puntos 🚀 — Factura {$factura['numero_factura']} 🧾";
        redirigir('factura.php?id=' . $factura['id_factura']);
    } catch (Exception $e) {
        $pdo->rollBack();
        $_SESSION['flash'] = '⚠️ No se pudo procesar el pago: ' . $e->getMessage();
    }
}
require_once __DIR__ . '/includes/header.php';
?>
<section class="search-section" style="padding-top:60px">
  <p class="section-label">💳 Pago</p>
  <h2 class="section-title">Total a pagar: <?= formatoCOP($total) ?></h2>

  <div class="modal" style="max-width:560px;margin:0 auto;text-align:left">
    <form method="post" id="payForm">
      <div class="form-group">
        <label>MÉTODO DE PAGO</label>
        <select name="metodo" id="metodo" onchange="toggleCuotas()">
          <option value="tarjeta_credito">💳 Tarjeta de Crédito</option>
          <option value="tarjeta_debito">💳 Tarjeta Débito</option>
          <option value="pse">🏦 PSE</option>
          <?php if (!empty($planes)): ?><option value="cuotas">📅 Crédito a Cuotas (Preferencial)</option><?php endif; ?>
        </select>
      </div>

      <div id="cardFields">
        <div class="form-group"><label>NÚMERO DE TARJETA</label><input type="text" name="numero_tarjeta" maxlength="19" placeholder="1234 5678 9012 3456"></div>
      </div>

      <div id="cuotasFields" style="display:none">
        <div class="form-group">
          <label>NÚMERO DE CUOTAS</label>
          <select name="id_plan">
            <?php foreach ($planes as $p): ?>
              <option value="<?= $p['id_plan'] ?>"><?= $p['numero_cuotas'] ?> cuotas — <?= $p['tasa_interes_mensual'] == 0 ? 'sin interés' : ($p['tasa_interes_mensual'] * 100) . '% mensual' ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <button type="submit" class="btn-primary" style="width:100%">Confirmar pago</button>
    </form>
  </div>
</section>
<script>
  function toggleCuotas() {
    const m = document.getElementById('metodo').value;
    document.getElementById('cardFields').style.display = m === 'cuotas' ? 'none' : 'block';
    document.getElementById('cuotasFields').style.display = m === 'cuotas' ? 'block' : 'none';
  }
</script>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
