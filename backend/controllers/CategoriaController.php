<?php
// =====================================================
// controllers/CategoriaController.php
// Controlador para categorías de insumos
// =====================================================
require_once 'config/Database.php';
require_once 'middleware/AuthMiddleware.php';

class CategoriaController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function index() {
        $auth = new AuthMiddleware();
        $auth->verify();
        
        $query = "SELECT * FROM categorias_insumos WHERE activo = 1 ORDER BY nombre_categoria";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(); 
        
        Response::success("Categorías obtenidas correctamente", $result);
    }
}
?>