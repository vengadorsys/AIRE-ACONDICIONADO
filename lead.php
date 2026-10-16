<?php
// lead.php — guarda el contacto de la calculadora como cliente potencial.
// Se escribe en la carpeta privada (fuera de public_html) en dos formatos:
//   clientes.jsonl (una línea por cliente) y clientes.csv (para Excel).
// El dueño los consulta en leads.php con su contraseña.
require __DIR__ . '/_core.php';

z_guard_post();
$rl = z_rate('lead', 6, 40);
if ($rl !== '') z_json(['ok' => false, 'reason' => $rl]);

$in = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($in)) z_json(['ok' => false, 'reason' => 'input'], 400);

function s($v, $max = 80) { return mb_substr(trim(is_scalar($v) ? (string) $v : ''), 0, $max); }

$email = s($in['email'] ?? '', 160);
$tel   = preg_replace('/\D/', '', s($in['telefono'] ?? '', 20));
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) z_json(['ok' => false, 'reason' => 'email']);
if ($tel !== '' && !(strlen($tel) === 10 || (strlen($tel) === 12 && strpos($tel, '52') === 0))) z_json(['ok' => false, 'reason' => 'telefono']);
if ($email === '' && $tel === '') z_json(['ok' => false, 'reason' => 'contacto']);
if (empty($in['consent'])) z_json(['ok' => false, 'reason' => 'consent']);

$c = is_array($in['calc'] ?? null) ? $in['calc'] : [];
$row = [
  'fecha'        => date('Y-m-d H:i'),
  'nombre'       => s($in['nombre'] ?? ''),
  'email'        => $email,
  'whatsapp'     => $tel,
  'origen'       => s($in['origen'] ?? 'web', 20),
  'toneladas'    => s($c['toneladas'] ?? '', 40),
  'btu'          => is_numeric($c['btu'] ?? null) ? (int) $c['btu'] : '',
  'area_m2'      => is_numeric($c['area_m2'] ?? null) ? round((float) $c['area_m2'], 1) : '',
  'espacio'      => s($c['espacio'] ?? '', 20),
  'sol'          => s($c['sol'] ?? '', 20),
  'personas'     => is_numeric($c['personas'] ?? null) ? (int) $c['personas'] : '',
  'horas_dia'    => is_numeric($c['horas'] ?? null) ? (int) $c['horas'] : '',
  'meses'        => is_numeric($c['meses'] ?? null) ? (int) $c['meses'] : '',
  'tarifa'       => s($c['tarifa'] ?? '', 10),
  'kwh_mes'      => is_numeric($c['kwh_mes'] ?? null) ? (int) $c['kwh_mes'] : '',
  'pago_mes'     => is_numeric($c['pago_mes'] ?? null) ? (int) $c['pago_mes'] : '',
  'ahorro_anual' => is_numeric($c['ahorro_anual'] ?? null) ? (int) $c['ahorro_anual'] : '',
  'instalacion'  => s($c['instalacion'] ?? '', 30),
  'equipo'       => s($c['equipo'] ?? '', 30),
  'recibo_ia'    => !empty($c['recibo_ia']) ? 'sí' : 'no',
];

$dir = z_private_dir();
$stored = @file_put_contents($dir . '/clientes.jsonl', json_encode($row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;

$csv = $dir . '/clientes.csv';
$new = !is_file($csv);
if ($fh = @fopen($csv, 'a')) {
  if (flock($fh, LOCK_EX)) {
    if ($new) { fwrite($fh, "\xEF\xBB\xBF"); fputcsv($fh, array_keys($row)); }
    // evita que Excel interprete fórmulas
    fputcsv($fh, array_map(function ($v) { $v = (string) $v; return preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v; }, array_values($row)));
    flock($fh, LOCK_UN);
  }
  fclose($fh);
}

// Aviso por correo al negocio (opcional): guarda el correo en la carpeta privada como aviso_email.php
$to = z_read_secret('aviso_email');
if ($stored && $to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL) && function_exists('mail')) {
  $body = "Nuevo cliente potencial desde la calculadora:\n\n";
  foreach ($row as $k => $v) $body .= str_pad($k, 14) . ': ' . ($v === '' ? '—' : $v) . "\n";
  $host = preg_replace('/[^a-z0-9.\-]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
  @mail($to, 'Nuevo cliente potencial: ' . ($row['nombre'] ?: ($email ?: $tel)), $body, "From: avisos@$host\r\nContent-Type: text/plain; charset=utf-8");
}

z_json(['ok' => $stored]);
