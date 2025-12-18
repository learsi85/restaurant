<?php
// =====================================================
// models/Permiso.php
// =====================================================
require_once 'config/Database.php';

class Permiso {
    private $conn;
    private $table = 'permisos';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todos los permisos agrupados por módulo
    public function getAllAgrupados() {
        $query = "SELECT * FROM " . $this->table . " WHERE activo = 1 ORDER BY modulo, accion";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $permisos = $stmt->fetchAll();
        
        // Agrupar por módulo
        $agrupados = [];
        foreach ($permisos as $permiso) {
            $modulo = $permiso['modulo'];
            if (!isset($agrupados[$modulo])) {
                $agrupados[$modulo] = [];
            }
            $agrupados[$modulo][] = $permiso;
        }
        
        return $agrupados;
    }
}
?>