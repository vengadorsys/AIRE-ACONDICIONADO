<?php
// setup.php — configurar las claves desde el navegador, sin tocar código.
// Acceso: setup.php?t=<código de configuración> (en _admin.php solo está su huella cifrada). Las claves se guardan en la carpeta privada,
// fuera de public_html, y nunca se muestran.
require __DIR__ . '/_core.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$admin = is_file(__DIR__ . '/_admin.php') ? include __DIR__ . '/_admin.php' : [];
$hash  = is_array($admin) ? (string) ($admin['setup_hash'] ?? '') : '';
$given = (string) ($_GET['t'] ?? $_POST['t'] ?? '');
if ($hash === '' || strlen($given) < 16 || z_rate('setup', 10, 60) !== '' || !password_verify($given, $hash)) { http_response_code(404); exit('No encontrado'); }

function gemini_valid($k) {
  if (!function_exists('curl_init')) return false;
  $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models');
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => ['x-goog-api-key: ' . $k]]);
  $r = curl_exec($ch); $c = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return $r !== false && $c === 200;
}

$msg = ''; $tone = 'info';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  if (isset($_POST['gemini'])) {
    $k = trim((string) $_POST['gemini']);
    if (!preg_match('/^[A-Za-z0-9._\-]{20,200}$/', $k)) { $msg = 'Esa clave no parece válida. Cópiala completa desde AI Studio.'; $tone = 'warn'; }
    elseif (!gemini_valid($k)) { $msg = 'Google no aceptó esa clave. Revísala en AI Studio.'; $tone = 'warn'; }
    elseif (z_write_secret('gemini_api_key', $k)) { $msg = '✅ Clave de Gemini activada. El asistente y el lector de recibos ya funcionan.'; $tone = 'ok'; }
    else { $msg = 'La clave es válida pero no se pudo guardar (permisos de la carpeta).'; $tone = 'warn'; }
  } elseif (isset($_POST['mp'])) {
    $k = trim((string) $_POST['mp']);
    if (strpos($k, 'APP_USR-') !== 0 && strpos($k, 'TEST-') !== 0) { $msg = 'El access token de Mercado Pago empieza por «APP_USR-» (o «TEST-» para pruebas).'; $tone = 'warn'; }
    elseif (z_write_secret('mp_access_token', $k)) { $msg = '✅ Mercado Pago activado.'; $tone = 'ok'; }
    else { $msg = 'No se pudo guardar el token (permisos de la carpeta).'; $tone = 'warn'; }
  } elseif (isset($_POST['aviso'])) {
    $k = trim((string) $_POST['aviso']);
    if (!filter_var($k, FILTER_VALIDATE_EMAIL)) { $msg = 'Escribe un correo válido.'; $tone = 'warn'; }
    elseif (z_write_secret('aviso_email', $k)) { $msg = '✅ Te avisaremos de cada cliente nuevo en ese correo.'; $tone = 'ok'; }
  }
}
$gSet = strlen(z_read_secret('gemini_api_key')) >= 20;
$mSet = z_read_secret('mp_access_token') !== '';
$aSet = z_read_secret('aviso_email') !== '';
$t = htmlspecialchars($given, ENT_QUOTES, 'UTF-8');
?><!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Configuración · ZUNO Clima</title>
<style>
:root{--ink:#0b1b3a;--soft:#4a5a78;--line:#dbe6f5;--blue:#1677ff;--bg:#f4f8ff}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);display:grid;place-items:center;min-height:100vh;padding:24px;line-height:1.55}
main{width:100%;max-width:520px;background:#fff;border:1px solid var(--line);border-radius:22px;padding:28px;box-shadow:0 30px 60px -30px rgba(13,47,104,.35)}
h1{font-size:1.4rem;margin:0 0 4px}p.sub{color:var(--soft);margin:0 0 18px;font-size:.94rem}
.card{border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
.card h2{font-size:1rem;margin:0 0 6px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.pill{font-size:.72rem;padding:3px 9px;border-radius:999px;background:#fff4d6;color:#8a5a00}.pill.ok{background:#e3f7ee;color:#0b6b44}
.hint{color:var(--soft);font-size:.85rem;margin:0 0 10px}a{color:var(--blue)}
input{width:100%;padding:11px 12px;border-radius:10px;border:1.5px solid var(--line);font:inherit}
button{margin-top:8px;width:100%;padding:11px;border:0;border-radius:999px;background:var(--blue);color:#fff;font-weight:700;font:inherit;cursor:pointer}
.msg{padding:11px 13px;border-radius:11px;margin-bottom:14px;font-size:.92rem;background:#eef4ff}.msg.ok{background:#e3f7ee}.msg.warn{background:#fff4e5}
</style></head><body><main>
<h1>Configuración de la web</h1>
<p class="sub">Las claves se guardan en el servidor, fuera de la carpeta pública, y nunca se muestran a los visitantes.</p>
<?php if ($msg): ?><div class="msg <?= $tone ?>"><?= htmlspecialchars($msg, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<div class="card"><h2>IA de Google (Gemini) <span class="pill <?= $gSet ? 'ok' : '' ?>"><?= $gSet ? 'Activa' : 'Pendiente' ?></span></h2>
<p class="hint">Clave gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (empieza por <code>AIza</code> o <code>AQ.</code>). Puedes reemplazarla cuando quieras.</p>
<form method="post" autocomplete="off"><input type="hidden" name="t" value="<?= $t ?>"><input name="gemini" type="password" placeholder="AIza… o AQ.…" required><button>Guardar clave de Gemini</button></form></div>
<div class="card"><h2>Mercado Pago <span class="pill <?= $mSet ? 'ok' : '' ?>"><?= $mSet ? 'Activo' : 'Pendiente' ?></span></h2>
<p class="hint">Access token de producción (Tus integraciones → Credenciales). Empieza por <code>APP_USR-</code>.</p>
<form method="post" autocomplete="off"><input type="hidden" name="t" value="<?= $t ?>"><input name="mp" type="password" placeholder="APP_USR-…" required><button>Guardar token</button></form></div>
<div class="card"><h2>Aviso de clientes nuevos <span class="pill <?= $aSet ? 'ok' : '' ?>"><?= $aSet ? 'Activo' : 'Opcional' ?></span></h2>
<p class="hint">Correo donde quieres recibir cada cliente potencial de la calculadora.</p>
<form method="post" autocomplete="off"><input type="hidden" name="t" value="<?= $t ?>"><input name="aviso" type="email" placeholder="ventas@tunegocio.mx" required><button>Guardar correo</button></form></div>
<p class="hint">Clientes potenciales: <a href="leads.php">abrir el panel</a>.</p>
</main></body></html>
