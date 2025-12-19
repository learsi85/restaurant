<?php
// =====================================================
// models/unidad.php
// Modelo para gestión de unidades
// =====================================================
require_once 'config/Database.php';

class Unidad {
    private $conn;
    private $table = 'unidades_medida';
    
    public $id_unidad;
    public $nombre_unidad;
    public $abreviatura;
    public $tipo;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getAll() {
        $query = "SELECT * FROM " . $this->table . " ORDER BY nombre_unidad";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_unidad = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (nombre_unidad, abreviatura, tipo)
                  VALUES (:nombre_unidad, :abreviatura, :tipo)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre_unidad', $this->nombre_unidad);
        $stmt->bindParam(':abreviatura', $this->abreviatura);
        $stmt->bindParam(':tipo', $this->tipo);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nombre_unidad = :nombre,
                      abreviatura = :abreviatura,
                      tipo = :tipo
                  WHERE id_unidad = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $this->nombre_unidad);
        $stmt->bindParam(':abreviatura', $this->abreviatura);
        $stmt->bindParam(':tipo', $this->tipo);
        $stmt->bindParam(':id', $this->id_unidad);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id_unidad = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id_unidad);
        return $stmt->execute();
    }
}
?>