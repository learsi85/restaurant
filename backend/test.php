<?php
// test.php
// Archivo para probar que CORS y la API funcionan correctamente
// Colocar en la raíz de tu API: http://localhost/pollos-api/test.php

require_once 'config/cors.php';
require_once 'controllers/InsumoController.php'; 

// Test 1: Verificar que los headers de CORS se están enviando
$response = [
    'success' => true,
    'message' => '¡La API está funcionando correctamente!',
    'tests' => [
        'cors_headers' => 'OK - Headers CORS configurados',
        'json_response' => 'OK - Respuesta en JSON',
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => PHP_VERSION,
            'request_method' => $_SERVER['REQUEST_METHOD'],
            'request_uri' => $_SERVER['REQUEST_URI']
        ]
    ],
    'next_steps' => [
        '1. Si ves este mensaje, CORS está funcionando',
        '2. Prueba el login en /auth/login',
        '3. Verifica que puedas acceder a /insumos con un token'
    ]
];

// http_response_code(200);
// echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

//$insumoController = new InsumoController();
//$insumoController->index();
//var_dump($insumoController);

$permisos = [
    '0permisos' => 'caja.abrir',
    '1permisos' => 'caja.cerrar',
    '2permisos' => 'caja.historial',
    '3permisos' => 'caja.ver',
    '4permisos' => 'catalogos.crear', 
    '5permisos' => 'catalogos.editar', 
    '6permisos' => 'catalogos.eliminar', 
    '7permisos' => 'catalogos.ver',
];
var_dump($response);
var_dump($permisos);

if (!in_array('catalogos.ver', $permisos)) {
    echo $allowedPermisos." No tienes permisos para realizar esta acción ".$user->permisos;
}
?>