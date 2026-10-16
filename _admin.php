<?php
// Solo huellas cifradas (no las claves). Seguro aunque el repositorio sea público.
// Para cambiar la contraseña del panel: php -r "echo password_hash('NUEVA', PASSWORD_DEFAULT);" y pega el resultado.
return array (
  'setup_hash' => '$2y$10$m2ZQ3CbljhIuqUO7Yx2rgOJPymG2x3CRIbnsD37qFCXEzwMcOUUpi',
  'panel_hash' => '$2y$10$TQCKa1qWZqWIRyAaP7w9sOLuabIFVVrnlz/GPR61gjYt6hNwc63/C',
);
