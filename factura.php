<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/facturacion.php';

if (!estaLogueado()) {
    $_SESSION['flash'] = '⚠️ Debes iniciar sesión para ver tus facturas.';
    redirigir('login.php');
}

$usuario   = usuarioActual();
$idFactura = (int) ($_GET['id'] ?? 0);
$factura   = obtenerFactura($pdo, $idFactura);

// Solo el dueño de la factura o un administrador pueden verla
if (!$factura || ((int) $factura['id_usuario'] !== (int) $usuario['id_usuario'] && !esAdmin())) {
    $_SESSION['flash'] = '⚠️ Factura no encontrada.';
    redirigir('mis_facturas.php');
}

require_once __DIR__ . '/includes/header.php';
?>
<style>
  .factura-doc{position:relative;z-index:10;background:#fff;max-width:820px;margin:0 auto;padding:36px;border-radius:12px;text-align:left;font-family:Arial,Helvetica,sans-serif}
  .factura-doc, .factura-doc *{color:#111}
  .factura-doc h2,.factura-doc h3{margin:0 0 6px}
  .factura-doc p{margin:0 0 8px;font-size:14px;line-height:1.5}
  .factura-cab{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px}
  .factura-doc table{width:100%;border-collapse:collapse;margin-top:16px}
  .factura-doc th,.factura-doc td{border:1px solid #ccc;padding:8px 10px;font-size:14px}
  .factura-doc th{background:#f0f0f0;text-align:left}
  .factura-doc .der{text-align:right}
  .factura-doc .factura-sello{color:#c00;border:3px solid #c00;display:inline-block;padding:4px 14px;font-weight:700;font-size:22px;transform:rotate(-6deg);margin-top:8px}
  @media print{
    nav,footer,#starfield,.no-print{display:none !important}
    body{background:#fff !important}
    .factura-doc{padding:0;border-radius:0}
  }
</style>

<section class="search-section" style="padding-top:60px">
  <p class="section-label no-print">🧾 Facturación</p>
  <h2 class="section-title no-print">Factura <?= htmlspecialchars($factura['numero_factura']) ?></h2>

  <div class="factura-doc">
    <div class="factura-cab">
      <div>
        <h2>Sales World Online</h2>
        <p>NIT: 000.000.000-0<br>Tu dirección · Tu ciudad, Colombia<br>ventas@salesworldonline.com</p>
      </div>
      <div class="der">
        <h2>FACTURA <?= htmlspecialchars($factura['numero_factura']) ?></h2>
        <p>Fecha: <?= date('d/m/Y H:i', strtotime($factura['fecha_emision'])) ?><br>
           Pedido n.º <?= (int) $factura['id_pedido'] ?></p>
        <?php if ($factura['estado'] === 'ANULADA'): ?>
          <div class="factura-sello">ANULADA</div>
        <?php endif; ?>
      </div>
    </div>

    <h3>Cliente</h3>
    <p>
      <?= htmlspecialchars($factura['cliente_nombre']) ?><br>
      <?php if ($factura['cliente_documento']): ?>Documento: <?= htmlspecialchars($factura['cliente_documento']) ?><br><?php endif; ?>
      <?= htmlspecialchars($factura['cliente_email']) ?>
      <?php if ($factura['cliente_ciudad']): ?><br><?= htmlspecialchars($factura['cliente_ciudad']) ?><?php endif; ?>
    </p>
    <p>
      Método de pago: <?= htmlspecialchars(str_replace('_', ' ', (string) $factura['metodo_pago'])) ?>
      <?php if ($factura['referencia_pago']): ?> · Ref: <?= htmlspecialchars($factura['referencia_pago']) ?><?php endif; ?>
    </p>

    <table>
      <tr><th>Producto</th><th class="der">Cant.</th><th class="der">Precio unit.</th><th class="der">Total</th></tr>
      <?php foreach ($factura['detalles'] as $d): ?>
        <tr>
          <td><?= htmlspecialchars($d['descripcion']) ?></td>
          <td class="der"><?= (int) $d['cantidad'] ?></td>
          <td class="der"><?= formatoCOP($d['precio_unitario']) ?></td>
          <td class="der"><?= formatoCOP($d['total_linea']) ?></td>
        </tr>
      <?php endforeach; ?>
      <tr><td colspan="3" class="der">Base gravable</td><td class="der"><?= formatoCOP($factura['subtotal']) ?></td></tr>
      <tr><td colspan="3" class="der">IVA 19 %</td><td class="der"><?= formatoCOP($factura['iva']) ?></td></tr>
      <tr><th colspan="3" class="der">TOTAL</th><th class="der"><?= formatoCOP($factura['total']) ?></th></tr>
    </table>

    <?php if ($factura['estado'] === 'ANULADA'): ?>
      <p style="margin-top:16px"><strong>Motivo de anulación:</strong> <?= htmlspecialchars($factura['motivo_anulacion']) ?></p>
    <?php endif; ?>

    <p style="margin-top:24px;font-size:12px">Factura interna generada por Sales World Online. Los precios incluyen IVA.</p>
  </div>

  <div class="no-print" style="display:flex;gap:12px;justify-content:center;margin-top:24px;position:relative;z-index:10">
    <button class="btn-primary" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
    <a href="mis_facturas.php" class="btn-primary">← Mis facturas</a>
  </div>
</section>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
