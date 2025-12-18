<?php
// =====================================================
// controllers/UnidadController.php
// Controlador para unidades de medida
// =====================================================
require_once 'config/Database.php';
require_once 'middleware/AuthMiddleware.php';

class UnidadController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function index() {
        $auth = new AuthMiddleware();
        $auth->verify();
        
        $query = "SELECT * FROM unidades_medida ORDER BY nombre_unidad";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll();
        
        Response::success("Unidades obtenidas correctamente", $result);
    }
}
?>