<?php
// pago.php — crea el pago en Mercado Pago (Checkout Pro) para un paquete.
// El navegador manda SOLO {"producto":"<id>"}; el precio sale de este catálogo,
// nunca de lo que envíe el navegador. El access token vive en la carpeta privada.
require __DIR__ . '/_core.php';

$FALLO = 'El pago con Mercado Pago aún no está activo en esta demostración. Puedes pagar por transferencia o escribirnos por WhatsApp.';

// Catálogo REAL del negocio (MXN). Debe coincidir con los precios de index.html.
$CATALOGO = [
  'mantenimiento'  => ['titulo' => 'Mantenimiento preventivo de minisplit',   'precio' => 899.00],
  'instalacion-1t' => ['titulo' => 'Instalación de minisplit 1 tonelada',     'precio' => 2899.00],
  'anticipo'       => ['titulo' => 'Anticipo de instalación de minisplit',    'precio' => 1000.00],
  // Pago de prueba de $1 (solo se muestra con ?prueba=1). Bórralo cuando ya no lo necesites.
  'prueba'         => ['titulo' => 'Pago de prueba ZUNO Clima',               'precio' => 1.00],
];

z_guard_post();
if (z_rate('pago', 10, 120) !== '') z_json(['ok' => false, 'msg' => 'Demasiados intentos. Espera un minuto, por favor.']);

$in = json_decode((string) file_get_contents('php://input'), true);
$id = is_array($in) ? (string) ($in['producto'] ?? '') : '';
if (!isset($CATALOGO[$id])) z_json(['ok' => false, 'msg' => $FALLO]);
$item = $CATALOGO[$id];

$token = z_read_secret('mp_access_token');
if (strpos($token, 'APP_USR-') !== 0 && strpos($token, 'TEST-') !== 0) z_json(['ok' => false, 'msg' => $FALLO]);
if (!function_exists('curl_init')) z_json(['ok' => false, 'msg' => $FALLO]);

$host = preg_replace('/[^a-z0-9.\-:]/i', '', $_SERVER['HTTP_HOST'] ?? '');
$base = 'https://' . $host . rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$body = [
  'items' => [[
    'id' => $id, 'title' => $item['titulo'], 'quantity' => 1, 'currency_id' => 'MXN', 'unit_price' => (float) $item['precio'],
  ]],
  'back_urls' => [
    'success' => $base . '/gracias.html',
    'pending' => $base . '/pago-pendiente.html',
    'failure' => $base . '/pago-error.html',
  ],
  'auto_return'          => 'approved',
  'statement_descriptor' => 'ZUNO CLIMA',
  'external_reference'   => $id . '-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 6),
];

$ch = curl_init('https://api.mercadopago.com/checkout/preferences');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST           => true,
  CURLOPT_TIMEOUT        => 15,
  CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $token],
  CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_UNICODE),
]);
$res = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$d = json_decode((string) $res, true);
if ($code >= 200 && $code < 300 && !empty($d['init_point'])) {
  $url = (strpos($token, 'TEST-') === 0 && !empty($d['sandbox_init_point'])) ? $d['sandbox_init_point'] : $d['init_point'];
  z_json(['ok' => true, 'url' => $url]);
}
@error_log('[zuno-pago] MP ' . $code . ' ' . substr((string) $res, 0, 300));
z_json(['ok' => false, 'msg' => 'No pudimos abrir el pago en este momento. Intenta de nuevo, paga por transferencia o escríbenos por WhatsApp.']);
