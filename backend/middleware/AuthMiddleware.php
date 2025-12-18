<?php
// =====================================================
// middleware/AuthMiddleware.php
// Middleware para verificar autenticación
// =====================================================
require_once 'config/jwt.php';
require_once 'utils/Response.php';

class AuthMiddleware {
    private $jwt;
    
    public function __construct() {
        $this->jwt = new JWT();
    }
    
    public function verify() {
        $headers = apache_request_headers();
         
        if (!isset($headers['Authorization'])) {
            Response::unauthorized("Token no proporcionado");
        }
        
        $authHeader = $headers['Authorization'];
        $token = str_replace('Bearer ', '', $authHeader);
        
        $decoded = $this->jwt->decode($token);
        
        if (!$decoded) {
            Response::unauthorized("Token inválido o expirado");
        }
        
        return $decoded;  
    }
    
    public function checkRole($user, $allowedRoles) {
        if (!in_array($user->rol, $allowedRoles)) {
            Response::error("No tienes permisos para realizar esta acción", 403);
        }
    }

    public function checkPermisos($user, $allowedPermisos){
        $ban = true;
        foreach ($user->permisos as $p) {
            if ($p->permisos === $allowedPermisos) {
                $ban = false;
                break; // Para detener la búsqueda
            }
        }
        if ($ban) {
            Response::error("No tienes permisos para realizar esta acción", 403);
        }
    }
}
?>