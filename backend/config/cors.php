<?php
// Prevenir envío de headers duplicados
if (!headers_sent()) {
    // Permitir solicitudes desde cualquier origen
    header("Access-Control-Allow-Origin: *");
    
    // Tipo de contenido
    header("Content-Type: application/json; charset=UTF-8");
    
    // Métodos permitidos
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    
    // Tiempo máximo de cache para preflight
    header("Access-Control-Max-Age: 3600");
    
    // Headers permitidos
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    header("Cache-Control: no-cache, must-revalidate");
    header("Expires: Sat, 1 Jul 2000 05:00:00 GMT");
    
    // Si es una petición OPTIONS (preflight), responder inmediatamente
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
?>