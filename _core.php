<?php
// _core.php — utilidades compartidas por los archivos del servidor.
// No es una página: el .htaccess bloquea el acceso directo a los archivos "_*.php".
//
// Las claves (Gemini, Mercado Pago) y los clientes potenciales se guardan en una
// carpeta privada FUERA de public_html (../zuno_privado). Si el hosting no deja
// escribir ahí, se usa ./privado, protegida con su propio .htaccess.

if (!defined('ZUNO')) define('ZUNO', 1);

function z_json($arr, $code = 200) {
  if (!headers_sent()) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
  }
  echo json_encode($arr, JSON_UNESCAPED_UNICODE);
  exit;
}

// Solo POST y solo desde este mismo sitio (evita que otras webs gasten la cuota).
function z_guard_post() {
  if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') z_json(['ok' => false, 'reason' => 'method'], 405);
  $host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
  $src  = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
  if ($src !== '') {
    $srcHost = strtolower((string) parse_url($src, PHP_URL_HOST));
    if ($srcHost === '' || $srcHost !== $host) z_json(['ok' => false, 'reason' => 'origin'], 403);
  }
}

// Carpeta privada para claves y clientes potenciales.
function z_private_dir() {
  static $dir = null;
  if ($dir !== null) return $dir;
  $out = dirname(__DIR__) . '/zuno_privado';
  if (is_dir($out) || @mkdir($out, 0750, true)) {
    if (is_writable($out)) return $dir = $out;
  }
  $in = __DIR__ . '/privado';
  if (!is_dir($in)) @mkdir($in, 0750, true);
  if (!is_file($in . '/.htaccess')) @file_put_contents($in . '/.htaccess', "Require all denied\nDeny from all\n");
  return $dir = $in;
}

function z_read_secret($name) {
  $env = getenv(strtoupper($name));
  if ($env) return trim($env);
  $f = z_private_dir() . '/' . $name . '.php';
  if (is_file($f)) { $v = @include $f; if (is_string($v)) return trim($v); }
  return '';
}

function z_write_secret($name, $value) {
  $f = z_private_dir() . '/' . $name . '.php';
  $content = "<?php return " . var_export((string) $value, true) . ";\n";
  $ok = @file_put_contents($f, $content, LOCK_EX) !== false;
  if ($ok) @chmod($f, 0640);
  return $ok;
}

// Límite de uso por IP (minuto/día) y tope global diario. Devuelve '' o el motivo.
function z_rate($bucket, $perMin, $perDay, $globalDay = 0) {
  $ip  = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
  $tmp = sys_get_temp_dir();
  $now = time();
  $f = $tmp . '/zuno_' . $bucket . '_' . md5($ip) . '.json';
  $stamps = is_file($f) ? json_decode((string) @file_get_contents($f), true) : [];
  if (!is_array($stamps)) $stamps = [];
  $min = count(array_filter($stamps, function ($t) use ($now) { return $t > $now - 60; }));
  $day = count(array_filter($stamps, function ($t) use ($now) { return $t > $now - 86400; }));
  if ($min >= $perMin) return 'rate_min';
  if ($day >= $perDay) return 'rate_day';
  if ($globalDay > 0) {
    $g = $tmp . '/zuno_' . $bucket . '_global_' . date('Ymd') . '.txt';
    $gc = is_file($g) ? (int) @file_get_contents($g) : 0;
    if ($gc >= $globalDay) return 'rate_global';
    @file_put_contents($g, (string) ($gc + 1), LOCK_EX);
  }
  $stamps[] = $now;
  @file_put_contents($f, json_encode(array_slice(array_values(array_filter($stamps, function ($t) use ($now) { return $t > $now - 86400; })), -300)), LOCK_EX);
  return '';
}

// Llama a Gemini probando varios modelos (capa gratuita). Devuelve [texto, error].
function z_gemini($payload, $models, $timeout = 30) {
  $key = z_read_secret('gemini_api_key');
  if (strlen($key) < 20) return [null, 'sin_clave'];
  if (!function_exists('curl_init')) return [null, 'sin_curl'];
  $last = '';
  foreach ($models as $model) {
    $p = $payload;
    // Solo los modelos 2.5 aceptan thinkingBudget; en ellos lo apagamos para responder rápido.
    if (strpos($model, 'gemini-2.5') === 0) {
      $p['generationConfig']['thinkingConfig'] = ['thinkingBudget' => 0];
    }
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST           => true,
      CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'x-goog-api-key: ' . $key],
      CURLOPT_POSTFIELDS     => json_encode($p, JSON_UNESCAPED_UNICODE),
      CURLOPT_TIMEOUT        => $timeout,
      CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $resp = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($resp === false || $code >= 400) { $last = "$model http $code $err " . substr((string) $resp, 0, 240); continue; }
    $data = json_decode($resp, true);
    $text = '';
    foreach (($data['candidates'][0]['content']['parts'] ?? []) as $part) {
      if (isset($part['text']) && empty($part['thought'])) $text .= $part['text'];
    }
    if (trim($text) !== '') return [$text, ''];
    $last = "$model vacío (" . ($data['promptFeedback']['blockReason'] ?? ($data['candidates'][0]['finishReason'] ?? '?')) . ')';
  }
  @error_log('[zuno-ia] ' . $last);
  return [null, 'ia'];
}
