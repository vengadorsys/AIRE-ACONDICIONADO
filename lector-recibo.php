<?php
// lector-recibo.php — lee un recibo de luz de la CFE (foto o PDF) con IA y
// devuelve solo consumo, tarifa e importe. El archivo no se guarda.
// Respuesta: {ok:true, data:{...}} o {ok:false, reason}
require __DIR__ . '/_core.php';

function fail($reason) { z_json(['ok' => false, 'reason' => $reason]); }

z_guard_post();
if (strlen(z_read_secret('gemini_api_key')) < 20) fail('sin_clave');

$MAX = 10 * 1024 * 1024;
if (empty($_FILES['recibo']) || !is_uploaded_file($_FILES['recibo']['tmp_name'] ?? '')) fail('sin_archivo');
$f = $_FILES['recibo'];
if (($f['error'] ?? 1) !== UPLOAD_ERR_OK) fail(($f['error'] ?? 0) == UPLOAD_ERR_INI_SIZE ? 'tamano' : 'subida');
if (($f['size'] ?? 0) <= 0 || $f['size'] > $MAX) fail('tamano');

$mime = '';
if (function_exists('finfo_open')) { $fi = finfo_open(FILEINFO_MIME_TYPE); $mime = (string) finfo_file($fi, $f['tmp_name']); finfo_close($fi); }
$mime = strtolower($mime ?: (string) ($f['type'] ?? ''));
if ($mime === 'image/jpg') $mime = 'image/jpeg';
$ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
if (!in_array($mime, $ok, true)) fail('tipo');

$rl = z_rate('recibo', 6, 40, 400);
if ($rl !== '') fail($rl);

$bytes = @file_get_contents($f['tmp_name']);
if ($bytes === false || $bytes === '') fail('lectura');

$INSTR = <<<'TXT'
Eres un extractor de datos de recibos de luz de la CFE (Comisión Federal de Electricidad, México). Te doy la foto o el PDF de un recibo. Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional, con EXACTAMENTE estas claves:
{
  "es_recibo_cfe": true o false,
  "tarifa": "1" | "1A" | "1B" | "1C" | "1D" | "1E" | "1F" | "DAC" | "PDBT" | "GDMTO" | "GDMTH" | otra cadena | null,
  "consumo_kwh_periodo": número o null,
  "dias_periodo": número o null,
  "total_pagar": número o null,
  "periodo_texto": cadena corta (por ejemplo "12 MAY 25 - 12 JUL 25") o null
}
Reglas:
- "consumo_kwh_periodo" es la energía consumida (kWh) del periodo facturado (lectura actual menos anterior o el total de kWh del periodo), NO el histórico.
- "dias_periodo" son los días del periodo facturado; si solo ves las fechas, calcula los días. Los recibos domésticos suelen ser bimestrales (~60 días).
- "total_pagar" es el "TOTAL A PAGAR" en pesos del periodo actual.
- Usa PUNTO decimal, sin comas de miles, sin símbolos de $ ni unidades dentro de los números.
- No incluyas nombres, direcciones, número de servicio ni otros datos personales.
- Si un dato no aparece o no se lee con seguridad, pon null. NO inventes.
TXT;

$payload = [
  'contents' => [[
    'role'  => 'user',
    'parts' => [
      ['inline_data' => ['mime_type' => $mime, 'data' => base64_encode($bytes)]],
      ['text' => $INSTR],
    ],
  ]],
  'generationConfig' => ['temperature' => 0.1, 'maxOutputTokens' => 2048, 'responseMimeType' => 'application/json'],
];
unset($bytes);

list($text, $err) = z_gemini($payload, ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash'], 45);
if ($text === null) fail($err === 'sin_clave' ? 'sin_clave' : 'ia');

$s = trim(preg_replace(['/^```(?:json)?/i', '/```$/'], '', trim($text)));
$a = strpos($s, '{'); $b = strrpos($s, '}');
$d = ($a !== false && $b !== false && $b > $a) ? json_decode(substr($s, $a, $b - $a + 1), true) : null;
if (!is_array($d)) fail('ia');
if (isset($d['es_recibo_cfe']) && $d['es_recibo_cfe'] === false) fail('no_recibo');

function n($v, $min, $max) {
  if ($v === null || $v === '') return null;
  if (!is_numeric($v)) { $v = str_replace([',', '$', ' ', 'kWh', 'kwh'], '', (string) $v); if (!is_numeric($v)) return null; }
  $v = (float) $v;
  return ($v >= $min && $v <= $max) ? round($v, 2) : null;
}
$tarifa = is_string($d['tarifa'] ?? null) ? strtoupper(preg_replace('/[^0-9A-Za-z]/', '', $d['tarifa'])) : null;

z_json(['ok' => true, 'data' => [
  'tarifa'              => ($tarifa !== '' ? $tarifa : null),
  'consumo_kwh_periodo' => n($d['consumo_kwh_periodo'] ?? null, 1, 200000),
  'dias_periodo'        => n($d['dias_periodo'] ?? null, 20, 70),
  'total_pagar'         => n($d['total_pagar'] ?? null, 1, 5000000),
  'periodo_texto'       => is_string($d['periodo_texto'] ?? null) ? mb_substr(trim($d['periodo_texto']), 0, 40) : null,
]]);
