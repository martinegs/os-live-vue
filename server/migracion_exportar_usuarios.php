<?php
// Script PHP para exportar usuarios y contraseñas desencriptadas desde CodeIgniter
// Ejecutar en el entorno del sistema original (con acceso a la librería encryption)

// Cargar framework y modelos
require_once('index.php'); // o el bootstrap de tu app

$this->load->model('dtex_model');
$this->load->library('encryption');
$this->encryption->initialize(array('driver' => 'mcrypt'));

$usuarios = $this->dtex_model->get_all_users(); // Debe devolver todos los usuarios

$output = fopen('usuarios_export.csv', 'w');
fputcsv($output, ['idUsuarios', 'email', 'senha_desencriptada']);

foreach ($usuarios as $user) {
    $senha = $this->encryption->decrypt($user->senha);
    fputcsv($output, [$user->idUsuarios, $user->email, $senha]);
}

fclose($output);
echo "Exportación completada. Archivo: usuarios_export.csv\n";
