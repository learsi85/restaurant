<?php
// =====================================================
// models/Proveedor.php
// Modelo para gestión de proveedores
// =====================================================
require_once 'config/Database.php';

class Proveedor {
    private $conn;
    private $table = 'proveedores';
    
    public $id_proveedor;
    public $nombre_proveedor;
    public $contacto;
    public $telefono;
    public $email;
    public $direccion;
    public $activo;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getAll() {
        $query = "SELECT * FROM " . $this->table . " WHERE activo = 1 ORDER BY nombre_proveedor";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_proveedor = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (nombre_proveedor, contacto, telefono, email, direccion)
                  VALUES (:nombre, :contacto, :telefono, :email, :direccion)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $this->nombre_proveedor);
        $stmt->bindParam(':contacto', $this->contacto);
        $stmt->bindParam(':telefono', $this->telefono);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':direccion', $this->direccion);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
    
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nombre_proveedor = :nombre,
                      contacto = :contacto,
                      telefono = :telefono,
                      email = :email,
                      direccion = :direccion
                  WHERE id_proveedor = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $this->nombre_proveedor);
        $stmt->bindParam(':contacto', $this->contacto);
        $stmt->bindParam(':telefono', $this->telefono);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':direccion', $this->direccion);
        $stmt->bindParam(':id', $this->id_proveedor);
        
        return $stmt->execute();
    }
    
    public function delete() {
        $query = "UPDATE " . $this->table . " SET activo = 0 WHERE id_proveedor = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id_proveedor);
        return $stmt->execute();
    }
}
?>