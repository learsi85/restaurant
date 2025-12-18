<?php
// models/Insumo.php
// Modelo para gestión de insumos

require_once 'config/Database.php';

class Insumo {
    private $conn;
    private $table = 'insumos';
    
    public $id_insumo;
    public $nombre_insumo;
    public $descripcion;
    public $id_categoria;
    public $id_unidad;
    public $stock_actual;
    public $stock_minimo;
    public $precio_promedio;
    public $activo;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todos los insumos activos
    public function getAll() {
        $query = "SELECT i.*, c.nombre_categoria, u.nombre_unidad, u.abreviatura,
                  CASE 
                      WHEN i.stock_actual <= i.stock_minimo THEN 'CRÍTICO'
                      WHEN i.stock_actual <= (i.stock_minimo * 1.5) THEN 'BAJO'
                      ELSE 'NORMAL'
                  END AS estado_stock
                  FROM " . $this->table . " i
                  LEFT JOIN categorias_insumos c ON i.id_categoria = c.id_categoria
                  LEFT JOIN unidades_medida u ON i.id_unidad = u.id_unidad
                  WHERE i.activo = 1
                  ORDER BY i.nombre_insumo";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener insumo por ID
    public function getById($id) {
        $query = "SELECT i.*, c.nombre_categoria, u.nombre_unidad, u.abreviatura
                  FROM " . $this->table . " i
                  LEFT JOIN categorias_insumos c ON i.id_categoria = c.id_categoria
                  LEFT JOIN unidades_medida u ON i.id_unidad = u.id_unidad
                  WHERE i.id_insumo = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    // Crear nuevo insumo
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (nombre_insumo, descripcion, id_categoria, id_unidad, stock_actual, stock_minimo, precio_promedio)
                  VALUES (:nombre, :descripcion, :categoria, :unidad, :stock_actual, :stock_minimo, :precio_promedio)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre_insumo);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':categoria', $this->id_categoria);
        $stmt->bindParam(':unidad', $this->id_unidad);
        $stmt->bindParam(':stock_actual', $this->stock_actual);
        $stmt->bindParam(':stock_minimo', $this->stock_minimo);
        $stmt->bindParam(':precio_promedio', $this->precio_promedio);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
    
    // Actualizar insumo
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nombre_insumo = :nombre,
                      descripcion = :descripcion,
                      id_categoria = :categoria,
                      id_unidad = :unidad,
                      stock_minimo = :stock_minimo,
                      precio_promedio = :precio_promedio
                  WHERE id_insumo = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre_insumo);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':categoria', $this->id_categoria);
        $stmt->bindParam(':unidad', $this->id_unidad);
        $stmt->bindParam(':stock_minimo', $this->stock_minimo);
        $stmt->bindParam(':precio_promedio', $this->precio_promedio);
        $stmt->bindParam(':id', $this->id_insumo);
        
        return $stmt->execute();
    }
    
    // Ajuste manual de inventario
    public function ajustarStock($cantidad, $motivo, $id_usuario) {
        try {
            $this->conn->beginTransaction();
            
            // Obtener stock actual
            $query = "SELECT stock_actual FROM " . $this->table . " WHERE id_insumo = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $this->id_insumo);
            $stmt->execute();
            $row = $stmt->fetch();
            $stock_anterior = $row['stock_actual'];
            $stock_nuevo = $stock_anterior + $cantidad;
            
            // Actualizar stock
            $query = "UPDATE " . $this->table . " SET stock_actual = :stock_nuevo WHERE id_insumo = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':stock_nuevo', $stock_nuevo);
            $stmt->bindParam(':id', $this->id_insumo);
            $stmt->execute();
            
            // Registrar movimiento
            $tipo = $cantidad > 0 ? 'entrada' : 'salida';
            $query = "INSERT INTO movimientos_inventario 
                      (id_insumo, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, id_usuario)
                      VALUES (:id_insumo, :tipo, :cantidad, :stock_anterior, :stock_nuevo, :motivo, :id_usuario)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id_insumo', $this->id_insumo);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':cantidad', abs($cantidad));
            $stmt->bindParam(':stock_anterior', $stock_anterior);
            $stmt->bindParam(':stock_nuevo', $stock_nuevo);
            $stmt->bindParam(':motivo', $motivo);
            $stmt->bindParam(':id_usuario', $id_usuario);
            $stmt->execute();
            
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
    
    // Obtener insumos con stock bajo
    public function getStockBajo() {
        $query = "SELECT i.*, c.nombre_categoria, u.abreviatura
                  FROM " . $this->table . " i
                  LEFT JOIN categorias_insumos c ON i.id_categoria = c.id_categoria
                  LEFT JOIN unidades_medida u ON i.id_unidad = u.id_unidad
                  WHERE i.activo = 1 AND i.stock_actual <= i.stock_minimo * 1.5
                  ORDER BY (i.stock_actual - i.stock_minimo) ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Desactivar insumo (borrado lógico)
    public function delete() {
        $query = "UPDATE " . $this->table . " SET activo = 0 WHERE id_insumo = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id_insumo);
        return $stmt->execute();
    }
    
    // Obtener historial de movimientos de un insumo
    public function getMovimientos($limite = 50) {
        $query = "SELECT m.*, u.nombre_completo as usuario
                  FROM movimientos_inventario m
                  LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
                  WHERE m.id_insumo = :id_insumo
                  ORDER BY m.fecha_movimiento DESC
                  LIMIT :limite";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_insumo', $this->id_insumo);
        $stmt->bindParam(':limite', $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
