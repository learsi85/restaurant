<?php
// =====================================================
// models/Cliente.php
// Modelo para gestión de clientes
// =====================================================
require_once 'config/Database.php';

class Cliente {
    private $conn;
    private $table = 'clientes';
    
    public $id_cliente;
    public $nombre_cliente;
    public $telefono;
    public $email;
    public $direccion;
    public $activo;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getAll() {
        $query = "SELECT * FROM " . $this->table . " WHERE activo = 1 ORDER BY nombre_cliente";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_cliente = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (nombre_cliente, telefono, email, direccion)
                  VALUES (:nombre, :telefono, :email, :direccion)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $this->nombre_cliente);
        $stmt->bindParam(':telefono', $this->telefono);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':direccion', $this->direccion);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
    
    public function buscar($termino) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE activo = 1 
                  AND (nombre_cliente LIKE :termino OR telefono LIKE :termino)
                  ORDER BY nombre_cliente
                  LIMIT 10";
        
        $termino = "%{$termino}%";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':termino', $termino);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>