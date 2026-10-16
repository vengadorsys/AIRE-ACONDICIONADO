<?php
// asistente-ia.php — el navegador envía {message, history[]} y recibe {reply}.
// La clave de Gemini vive en el servidor y nunca se envía al navegador.
require __DIR__ . '/_core.php';

function reply($text) { z_json(['reply' => $text]); }

z_guard_post();

$in = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($in)) $in = [];
$message = trim((string) ($in['message'] ?? ''));
$history = is_array($in['history'] ?? null) ? array_slice($in['history'], -8) : [];
if ($message === '' || mb_strlen($message) > 500) z_json(['reply' => 'Escríbeme tu pregunta en un mensaje corto, por favor.'], 400);

if (z_read_secret('gemini_api_key') === '') {
  reply("El asistente se está configurando en este momento. Mientras tanto, usa la **calculadora** (#calculadora) para saber qué minisplit necesitas, o escríbenos por WhatsApp y te atiende una persona.");
}

$rl = z_rate('chat', 8, 100, 1200);
if ($rl === 'rate_min') reply('Vas muy rápido 🙂 Espera unos segundos y vuelve a preguntarme.');
if ($rl === 'rate_day') reply('Ya hiciste muchas preguntas hoy. Para seguir, escríbenos por WhatsApp y te atiende una persona.');
if ($rl === 'rate_global') reply('Estoy muy solicitada ahora mismo. Escríbenos por WhatsApp y te respondemos enseguida.');

$system = include __DIR__ . '/knowledge.php';

$contents = [];
foreach ($history as $h) {
  $role = (($h['role'] ?? '') === 'model') ? 'model' : 'user';
  $text = mb_substr(trim((string) ($h['text'] ?? '')), 0, 1200);
  if ($text === '') continue;
  $contents[] = ['role' => $role, 'parts' => [['text' => $text]]];
}
$contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

$payload = [
  'system_instruction' => ['parts' => [['text' => $system]]],
  'contents'           => $contents,
  'generationConfig'   => ['temperature' => 0.4, 'topP' => 0.9, 'maxOutputTokens' => 900],
  'safetySettings'     => [
    ['category' => 'HARM_CATEGORY_HARASSMENT',        'threshold' => 'BLOCK_ONLY_HIGH'],
    ['category' => 'HARM_CATEGORY_HATE_SPEECH',       'threshold' => 'BLOCK_ONLY_HIGH'],
    ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_ONLY_HIGH'],
    ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
  ],
];

list($text, $err) = z_gemini($payload, ['gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-flash-latest'], 25);
if ($text === null) reply('Ahora mismo no puedo responder. Escríbenos por WhatsApp y te atiende una persona enseguida.');
reply(trim($text));
