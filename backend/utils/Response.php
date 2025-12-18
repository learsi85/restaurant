<?php
// =====================================================
// utils/Response.php
// Clase helper para respuestas JSON estandarizadas
// =====================================================

class Response {
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    public static function success($message, $data = null) {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
    }
    
    public static function error($message, $statusCode = 400) {
        self::json([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
    
    public static function unauthorized($message = "No autorizado") {
        self::error($message, 401);
    }
    
    public static function notFound($message = "Recurso no encontrado") {
        self::error($message, 404);
    }
}

?>