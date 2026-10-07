<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/facturacion.php';

if (!estaLogueado()) {
    $_SESSION['flash'] = '⚠️ Debes iniciar sesión para ver tus facturas.';
    redirigir('login.php');
}

$usuario  = usuarioActual();
$facturas = facturasDeUsuario($pdo, (int) $usuario['id_usuario']);

require_once __DIR__ . '/includes/header.php';
?>
<section class="search-section" style="padding-top:60px">
  <p class="section-label">🧾 Facturación</p>
  <h2 class="section-title">Mis facturas</h2>

  <div class="modal wide" style="max-width:720px;margin:0 auto;text-align:left">
    <?php if (empty($facturas)): ?>
      <p style="color:rgba(255,255,255,0.4);text-align:center;padding:30px 0">Aún no tienes facturas.</p>
    <?php else: foreach ($facturas as $f): ?>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px">
        <div style="flex:1">
          <strong><?= htmlspecialchars($f['numero_factura']) ?></strong><br>
          <span style="color:rgba(255,255,255,0.5);font-size:12px"><?= date('d/m/Y H:i', strtotime($f['fecha_emision'])) ?></span>
        </div>
        <div style="color:var(--star-blue);font-weight:700"><?= formatoCOP($f['total']) ?></div>
        <div style="color:<?= $f['estado'] === 'ANULADA' ? '#ff4d6d' : 'var(--aurora)' ?>;font-size:12px"><?= htmlspecialchars($f['estado']) ?></div>
        <a href="factura.php?id=<?= (int) $f['id_factura'] ?>" style="color:var(--star-blue)">Ver</a>
      </div>
    <?php endforeach; endif; ?>
  </div>
</section>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
