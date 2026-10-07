<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/facturacion.php';

if (!estaLogueado() || !esAdmin()) {
    $_SESSION['flash'] = '⚠️ Acceso solo para administradores.';
    redirigir('index.php');
}

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tokenOk = hash_equals($_SESSION['csrf'], $_POST['csrf'] ?? '');
    $motivo  = trim($_POST['motivo'] ?? '');
    $id      = (int) ($_POST['id_factura'] ?? 0);

    if (!$tokenOk) {
        $_SESSION['flash'] = '⚠️ Solicitud no válida.';
    } elseif ($motivo === '') {
        $_SESSION['flash'] = '⚠️ Debes escribir el motivo de anulación.';
    } elseif (anularFactura($pdo, $id, $motivo)) {
        $_SESSION['flash'] = '✅ Factura anulada correctamente.';
    } else {
        $_SESSION['flash'] = '⚠️ No se pudo anular (¿ya estaba anulada?).';
    }
    redirigir('admin_facturas.php');
}

$facturas = todasLasFacturas($pdo);
require_once __DIR__ . '/includes/header.php';
?>
<section class="search-section" style="padding-top:60px">
  <p class="section-label">🛠️ Administración</p>
  <h2 class="section-title">Todas las facturas</h2>

  <div class="modal wide" style="max-width:980px;margin:0 auto;text-align:left;overflow-x:auto">
    <?php if (empty($facturas)): ?>
      <p style="color:rgba(255,255,255,0.4);text-align:center;padding:30px 0">Aún no hay facturas.</p>
    <?php else: ?>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="text-align:left;color:rgba(255,255,255,0.5);font-size:12px">
        <th style="padding:8px">N.º</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th>
      </tr>
      <?php foreach ($facturas as $f): ?>
      <tr style="border-top:1px solid rgba(255,255,255,0.06)">
        <td style="padding:10px 8px"><strong><?= htmlspecialchars($f['numero_factura']) ?></strong></td>
        <td><?= htmlspecialchars($f['cliente_nombre']) ?></td>
        <td><?= date('d/m/Y', strtotime($f['fecha_emision'])) ?></td>
        <td style="color:var(--star-blue)"><?= formatoCOP($f['total']) ?></td>
        <td style="color:<?= $f['estado'] === 'ANULADA' ? '#ff4d6d' : 'var(--aurora)' ?>"><?= htmlspecialchars($f['estado']) ?></td>
        <td>
          <a href="factura.php?id=<?= (int) $f['id_factura'] ?>" style="color:var(--star-blue)">Ver</a>
          <?php if ($f['estado'] === 'EMITIDA'): ?>
            <form method="post" style="display:inline-flex;gap:6px;margin-left:10px">
              <input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['csrf']) ?>">
              <input type="hidden" name="id_factura" value="<?= (int) $f['id_factura'] ?>">
              <input name="motivo" placeholder="Motivo" required maxlength="255"
                     style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;padding:4px 8px">
              <button type="submit" style="background:rgba(255,77,109,0.15);border:1px solid rgba(255,77,109,0.4);color:#ff4d6d;border-radius:8px;padding:4px 10px;cursor:pointer">Anular</button>
            </form>
          <?php endif; ?>
        </td>
      </tr>
      <?php endforeach; ?>
    </table>
    <?php endif; ?>
  </div>
</section>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
