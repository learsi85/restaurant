<?php
// =====================================================
// models/Categoria.php
// Modelo para gestión de categorias
// =====================================================
require_once 'config/Database.php';

class Categoria {
    private $conn;
    private $table = 'categorias_insumos';
    
    public $id_categoria;
    public $nombre_categoria;
    public $descripcion;
    public $activo;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getAll() {
        $query = "SELECT * FROM " . $this->table . " WHERE activo = 1 ORDER BY nombre_categoria";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_categoria = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (nombre_categoria, descripcion)
                  VALUES (:nombre_categoria, :descripcion)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre_categoria', $this->nombre_categoria);
        $stmt->bindParam(':descripcion', $this->descripcion);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nombre_categoria = :nombre,
                      descripcion = :descripcion
                  WHERE id_categoria = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $this->nombre_categoria);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':id', $this->id_categoria);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "UPDATE " . $this->table . " SET activo = 0 WHERE id_categoria = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id_categoria);
        return $stmt->execute();
    }
}
?>