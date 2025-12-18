<?php
// models/Compra.php
// Modelo para gestión de compras

require_once 'config/Database.php';

class Compra {
    private $conn;
    private $table = 'compras';
    
    public $id_compra;
    public $numero_compra;
    public $id_proveedor;
    public $fecha_compra;
    public $total_compra;
    public $id_usuario;
    public $notas;
    public $estado;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todas las compras
    public function getAll($filtros = []) {
        $where = "1=1";
        $params = [];
        
        if (isset($filtros['fecha_inicio'])) {
            $where .= " AND DATE(c.fecha_compra) >= :fecha_inicio";
            $params[':fecha_inicio'] = $filtros['fecha_inicio'];
        }
        
        if (isset($filtros['fecha_fin'])) {
            $where .= " AND DATE(c.fecha_compra) <= :fecha_fin";
            $params[':fecha_fin'] = $filtros['fecha_fin'];
        }
        
        if (isset($filtros['proveedor'])) {
            $where .= " AND c.id_proveedor = :proveedor";
            $params[':proveedor'] = $filtros['proveedor'];
        }
        
        if (isset($filtros['estado'])) {
            $where .= " AND c.estado = :estado";
            $params[':estado'] = $filtros['estado'];
        }
        
        $query = "SELECT c.*, p.nombre_proveedor, u.nombre_completo as usuario
                  FROM " . $this->table . " c
                  LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
                  LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
                  WHERE " . $where . "
                  ORDER BY c.fecha_compra DESC";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener compra por ID con detalles
    public function getById($id) {
        $query = "SELECT c.*, p.nombre_proveedor, p.telefono, p.email, u.nombre_completo as usuario
                  FROM " . $this->table . " c
                  LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
                  LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
                  WHERE c.id_compra = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $compra = $stmt->fetch();
        
        if ($compra) {
            // Obtener detalles
            $query = "SELECT dc.*, i.nombre_insumo, u.abreviatura
                      FROM detalle_compras dc
                      LEFT JOIN insumos i ON dc.id_insumo = i.id_insumo
                      LEFT JOIN unidades_medida u ON i.id_unidad = u.id_unidad
                      WHERE dc.id_compra = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $compra['detalles'] = $stmt->fetchAll();
        }
        
        return $compra;
    }
    
    // Crear nueva compra
    public function create($detalles) {
        try {
            $this->conn->beginTransaction();
            
            // Generar número de compra
            $this->numero_compra = $this->generarNumeroCompra();
            
            // Insertar compra
            $query = "INSERT INTO " . $this->table . " 
                      (numero_compra, id_proveedor, fecha_compra, total_compra, id_usuario, notas, estado)
                      VALUES (:numero, :proveedor, :fecha, :total, :usuario, :notas, :estado)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':numero', $this->numero_compra);
            $stmt->bindParam(':proveedor', $this->id_proveedor);
            $stmt->bindParam(':fecha', $this->fecha_compra);
            $stmt->bindParam(':total', $this->total_compra);
            $stmt->bindParam(':usuario', $this->id_usuario);
            $stmt->bindParam(':notas', $this->notas);
            $stmt->bindParam(':estado', $this->estado);
            $stmt->execute();
            
            $id_compra = $this->conn->lastInsertId();
            
            // Insertar detalles
            $query = "INSERT INTO detalle_compras 
                      (id_compra, id_insumo, cantidad, precio_unitario, subtotal)
                      VALUES (:id_compra, :id_insumo, :cantidad, :precio, :subtotal)";
            
            $stmt = $this->conn->prepare($query);
            
            foreach ($detalles as $detalle) {
                $stmt->bindParam(':id_compra', $id_compra);
                $stmt->bindParam(':id_insumo', $detalle->id_insumo);
                $stmt->bindParam(':cantidad', $detalle->cantidad);
                $stmt->bindParam(':precio', $detalle->precio_unitario);
                $stmt->bindParam(':subtotal', $detalle->subtotal);
                $stmt->execute();
            }
            
            $this->conn->commit();
            return $id_compra;
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
    
    // Actualizar estado de compra
    public function actualizarEstado($estado) {
        $query = "UPDATE " . $this->table . " SET estado = :estado WHERE id_compra = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':estado', $estado);
        $stmt->bindParam(':id', $this->id_compra);
        return $stmt->execute();
    }
    
    // Generar número de compra automático
    private function generarNumeroCompra() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " WHERE YEAR(fecha_compra) = YEAR(CURDATE())";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch();
        
        $numero = $row['total'] + 1;
        return 'C' . date('Y') . '-' . str_pad($numero, 4, '0', STR_PAD_LEFT);
    }
    
    // Obtener estadísticas de compras
    public function getEstadisticas($fecha_inicio, $fecha_fin) {
        $query = "SELECT 
                    COUNT(*) as total_compras,
                    SUM(total_compra) as monto_total,
                    AVG(total_compra) as promedio_compra,
                    COUNT(DISTINCT id_proveedor) as proveedores_distintos
                  FROM " . $this->table . "
                  WHERE DATE(fecha_compra) BETWEEN :fecha_inicio AND :fecha_fin
                  AND estado != 'cancelada'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        return $stmt->fetch();
    }
}
