<?php
// leads.php — panel privado del negocio para ver y descargar los clientes potenciales.
// La contraseña se guarda cifrada en _admin.php (no se sube al repositorio).
require __DIR__ . '/_core.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
header('X-Frame-Options: DENY');

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_name('zuno_panel');
session_start();

$admin = is_file(__DIR__ . '/_admin.php') ? include __DIR__ . '/_admin.php' : [];
$hash = is_array($admin) ? (string) ($admin['panel_hash'] ?? '') : '';
$err = '';

if (isset($_GET['salir'])) { $_SESSION = []; session_destroy(); header('Location: leads.php'); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['pass'])) {
  if (z_rate('panel', 5, 30) !== '') $err = 'Demasiados intentos. Espera un minuto.';
  elseif ($hash !== '' && password_verify((string) $_POST['pass'], $hash)) { session_regenerate_id(true); $_SESSION['ok'] = 1; header('Location: leads.php'); exit; }
  else $err = 'Contraseña incorrecta.';
}
$in = !empty($_SESSION['ok']);

$rows = [];
if ($in) {
  $f = z_private_dir() . '/clientes.jsonl';
  if (is_file($f)) foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $l) { $r = json_decode($l, true); if (is_array($r)) $rows[] = $r; }
  $rows = array_reverse($rows);
  if (isset($_GET['csv'])) {
    $csv = z_private_dir() . '/clientes.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="clientes-zuno-clima-' . date('Ymd') . '.csv"');
    if (is_file($csv)) readfile($csv);
    exit;
  }
}
function h($v) { return htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8'); }
?><!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Clientes potenciales · ZUNO Clima</title>
<style>
:root{--ink:#0b1b3a;--soft:#4a5a78;--line:#dbe6f5;--blue:#1677ff;--bg:#f4f8ff}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
.wrap{max-width:1200px;margin:0 auto;padding:28px 18px}
.login{max-width:380px;margin:12vh auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px}
h1{font-size:1.4rem;margin:0 0 6px}input{width:100%;padding:11px;border:1.5px solid var(--line);border-radius:10px;font:inherit;margin:10px 0}
button,.btn{display:inline-block;padding:10px 16px;border:0;border-radius:999px;background:var(--blue);color:#fff;font-weight:700;text-decoration:none;font:inherit;cursor:pointer}
.btn--ghost{background:#fff;color:var(--blue);border:1.5px solid var(--line)}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.err{color:#c0263d;font-weight:600}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;font-size:.88rem}
th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;white-space:nowrap}
th{background:#eef4ff;font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--soft)}
.scroll{overflow-x:auto;border-radius:14px}.muted{color:var(--soft)}
</style></head><body>
<?php if (!$in): ?>
<form class="login" method="post"><h1>Panel de clientes</h1><p class="muted">ZUNO Clima · acceso privado</p>
<?php if ($err): ?><p class="err"><?= h($err) ?></p><?php endif; ?>
<label for="p">Contraseña</label><input id="p" name="pass" type="password" autocomplete="current-password" required autofocus><button>Entrar</button></form>
<?php else: ?>
<div class="wrap">
  <div class="top"><div><h1>Clientes potenciales</h1><span class="muted"><?= count($rows) ?> registros · los más recientes primero</span></div>
  <div><a class="btn" href="?csv=1">Descargar Excel (CSV)</a> <a class="btn btn--ghost" href="?salir=1">Salir</a></div></div>
  <?php if (!$rows): ?><p class="muted">Aún no hay clientes. Aparecerán aquí cuando alguien use la calculadora.</p><?php else: ?>
  <div class="scroll"><table><thead><tr><th>Fecha</th><th>Nombre</th><th>WhatsApp</th><th>Correo</th><th>Recomendación</th><th>Área</th><th>Tarifa</th><th>Pago/mes</th><th>Ahorro/año</th><th>Instalación</th><th>Recibo IA</th></tr></thead><tbody>
  <?php foreach ($rows as $r): ?><tr>
    <td><?= h($r['fecha'] ?? '') ?></td><td><?= h($r['nombre'] ?? '') ?></td>
    <td><?php if (!empty($r['whatsapp'])): $w = strlen($r['whatsapp']) === 10 ? '52' . $r['whatsapp'] : $r['whatsapp']; ?><a href="https://wa.me/<?= h($w) ?>" target="_blank" rel="noopener"><?= h($r['whatsapp']) ?></a><?php endif; ?></td>
    <td><?php if (!empty($r['email'])): ?><a href="mailto:<?= h($r['email']) ?>"><?= h($r['email']) ?></a><?php endif; ?></td>
    <td><?= h($r['toneladas'] ?? '') ?> <span class="muted"><?= h($r['btu'] ?? '') ?> BTU</span></td>
    <td><?= h($r['area_m2'] ?? '') ?> m²</td><td><?= h($r['tarifa'] ?? '') ?></td>
    <td><?= ($r['pago_mes'] ?? '') !== '' ? '$' . number_format((float) $r['pago_mes']) : '—' ?></td>
    <td><?= ($r['ahorro_anual'] ?? '') !== '' ? '$' . number_format((float) $r['ahorro_anual']) : '—' ?></td>
    <td><?= h($r['instalacion'] ?? '') ?></td><td><?= h($r['recibo_ia'] ?? '') ?></td>
  </tr><?php endforeach; ?></tbody></table></div>
  <?php endif; ?>
</div>
<?php endif; ?>
</body></html>
