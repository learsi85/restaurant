<?php
// models/ProductoTerminado.php
// Modelo para gestión de productos terminados

require_once 'config/Database.php';

class ProductoTerminado {
    private $conn;
    private $table = 'productos_terminados';
    
    public $id_producto;
    public $nombre_producto;
    public $descripcion;
    public $tipo_producto;
    public $precio_venta;
    public $stock_actual;
    public $activo;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todos los productos activos
    public function getAll() {
        $query = "SELECT pt.*,
                    (SELECT COUNT(*) FROM recetas r WHERE r.id_producto = pt.id_producto) AS receta 
                  FROM " . $this->table . " pt
                  WHERE activo = 1 
                  ORDER BY tipo_producto, nombre_producto";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener producto por ID con su receta
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_producto = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $producto = $stmt->fetch();
        
        if ($producto) {
            // Obtener receta (insumos necesarios)
            $query = "SELECT r.*, i.nombre_insumo, i.stock_actual, u.abreviatura
                      FROM recetas r
                      LEFT JOIN insumos i ON r.id_insumo = i.id_insumo
                      LEFT JOIN unidades_medida u ON i.id_unidad = u.id_unidad
                      WHERE r.id_producto = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $producto['receta'] = $stmt->fetchAll();
        }
        
        return $producto;
    }
    
    // Crear nuevo producto
    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                  (nombre_producto, descripcion, tipo_producto, precio_venta, stock_actual)
                  VALUES (:nombre, :descripcion, :tipo, :precio, :stock)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre_producto);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':tipo', $this->tipo_producto);
        $stmt->bindParam(':precio', $this->precio_venta);
        $stmt->bindParam(':stock', $this->stock_actual);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }
    
    // Actualizar producto
    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET nombre_producto = :nombre,
                      descripcion = :descripcion,
                      tipo_producto = :tipo,
                      precio_venta = :precio
                  WHERE id_producto = :id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':nombre', $this->nombre_producto);
        $stmt->bindParam(':descripcion', $this->descripcion);
        $stmt->bindParam(':tipo', $this->tipo_producto);
        $stmt->bindParam(':precio', $this->precio_venta);
        $stmt->bindParam(':id', $this->id_producto);
        
        return $stmt->execute();
    }
    
    // Desactivar producto (borrado lógico)
    public function delete() {
        $query = "UPDATE " . $this->table . " SET activo = 0 WHERE id_producto = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id_producto);
        return $stmt->execute();
    }
    
    // Guardar receta completa
    public function guardarReceta($receta) {
        try {
            $this->conn->beginTransaction();
            
            // Eliminar receta anterior
            $query = "DELETE FROM recetas WHERE id_producto = :id_producto";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id_producto', $this->id_producto);
            $stmt->execute();
            
            // Insertar nueva receta
            if (!empty($receta)) {
                $query = "INSERT INTO recetas (id_producto, id_insumo, cantidad_necesaria)
                          VALUES (:id_producto, :id_insumo, :cantidad)";
                $stmt = $this->conn->prepare($query);
                
                foreach ($receta as $item) {
                    $stmt->bindParam(':id_producto', $this->id_producto);
                    $stmt->bindParam(':id_insumo', $item->id_insumo);
                    $stmt->bindParam(':cantidad', $item->cantidad_necesaria);
                    $stmt->execute();
                }
            }
            
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
    
    // Obtener productos por tipo
    public function getByTipo($tipo) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE tipo_producto = :tipo AND activo = 1 
                  ORDER BY nombre_producto";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':tipo', $tipo);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Verificar si se puede producir (hay suficientes insumos)
    public function verificarDisponibilidad($cantidad) {
        $query = "SELECT r.id_insumo, r.cantidad_necesaria, i.nombre_insumo, i.stock_actual
                  FROM recetas r
                  LEFT JOIN insumos i ON r.id_insumo = i.id_insumo
                  WHERE r.id_producto = :id_producto";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_producto', $this->id_producto);
        $stmt->execute();
        $receta = $stmt->fetchAll();
        
        $faltantes = [];
        foreach ($receta as $item) {
            $necesario = $item['cantidad_necesaria'] * $cantidad;
            if ($item['stock_actual'] < $necesario) {
                $faltantes[] = [
                    'insumo' => $item['nombre_insumo'],
                    'necesario' => $necesario,
                    'disponible' => $item['stock_actual'],
                    'faltante' => $necesario - $item['stock_actual']
                ];
            }
        }
        
        return [
            'puede_producir' => empty($faltantes),
            'faltantes' => $faltantes
        ];
    }
}
?>