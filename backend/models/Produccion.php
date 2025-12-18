<?php
// models/Produccion.php
// Modelo para gestión de producción

require_once 'config/Database.php';

class Produccion {
    private $conn;
    private $table = 'produccion';
    
    public $id_produccion;
    public $id_producto;
    public $cantidad_producida;
    public $fecha_produccion;
    public $id_usuario;
    public $costo_produccion;
    public $notas;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todas las producciones con filtros
    public function getAll($filtros = []) {
        $where = "1=1";
        $params = [];
        
        if (isset($filtros['fecha_inicio'])) {
            $where .= " AND DATE(pr.fecha_produccion) >= :fecha_inicio";
            $params[':fecha_inicio'] = $filtros['fecha_inicio'];
        }
        
        if (isset($filtros['fecha_fin'])) {
            $where .= " AND DATE(pr.fecha_produccion) <= :fecha_fin";
            $params[':fecha_fin'] = $filtros['fecha_fin'];
        }
        
        if (isset($filtros['producto'])) {
            $where .= " AND pr.id_producto = :producto";
            $params[':producto'] = $filtros['producto'];
        }
        
        if (isset($filtros['tipo_producto'])) {
            $where .= " AND p.tipo_producto = :tipo_producto";
            $params[':tipo_producto'] = $filtros['tipo_producto'];
        }
        
        $query = "SELECT pr.*, p.nombre_producto, p.tipo_producto, p.precio_venta,
                  u.nombre_completo as usuario
                  FROM " . $this->table . " pr
                  LEFT JOIN productos_terminados p ON pr.id_producto = p.id_producto
                  LEFT JOIN usuarios u ON pr.id_usuario = u.id_usuario
                  WHERE " . $where . "
                  ORDER BY pr.fecha_produccion DESC";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener producción por ID con detalles
    public function getById($id) {
        $query = "SELECT pr.*, p.nombre_producto, p.tipo_producto, p.precio_venta,
                  u.nombre_completo as usuario
                  FROM " . $this->table . " pr
                  LEFT JOIN productos_terminados p ON pr.id_producto = p.id_producto
                  LEFT JOIN usuarios u ON pr.id_usuario = u.id_usuario
                  WHERE pr.id_produccion = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $produccion = $stmt->fetch();
        
        if ($produccion) {
            // Obtener insumos usados (de la receta)
            $query = "SELECT r.*, i.nombre_insumo, u.abreviatura,
                      (r.cantidad_necesaria * :cantidad) as cantidad_usada,
                      i.precio_promedio,
                      (r.cantidad_necesaria * :cantidad * i.precio_promedio) as costo_insumo
                      FROM recetas r
                      LEFT JOIN insumos i ON r.id_insumo = i.id_insumo
                      LEFT JOIN unidades_medida u ON i.id_unidad = u.id_unidad
                      WHERE r.id_producto = :id_producto";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':cantidad', $produccion['cantidad_producida']);
            $stmt->bindParam(':id_producto', $produccion['id_producto']);
            $stmt->execute();
            $produccion['insumos_usados'] = $stmt->fetchAll();
        }
        
        return $produccion;
    }
    
    // Verificar disponibilidad de insumos antes de producir
    public function verificarDisponibilidad($id_producto, $cantidad) {
        $query = "SELECT r.id_insumo, r.cantidad_necesaria, i.nombre_insumo, 
                  i.stock_actual, u.abreviatura,
                  (r.cantidad_necesaria * :cantidad) as cantidad_necesaria_total
                  FROM recetas r
                  LEFT JOIN insumos i ON r.id_insumo = i.id_insumo
                  LEFT JOIN unidades_medida u ON i.id_unidad = u.id_unidad
                  WHERE r.id_producto = :id_producto";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_producto', $id_producto);
        $stmt->bindParam(':cantidad', $cantidad);
        $stmt->execute();
        $receta = $stmt->fetchAll();
        
        $faltantes = [];
        $costo_total = 0;
        
        foreach ($receta as $item) {
            $necesario = $item['cantidad_necesaria_total'];
            
            if ($item['stock_actual'] < $necesario) {
                $faltantes[] = [
                    'insumo' => $item['nombre_insumo'],
                    'necesario' => $necesario,
                    'disponible' => $item['stock_actual'],
                    'faltante' => $necesario - $item['stock_actual'],
                    'unidad' => $item['abreviatura']
                ];
            }
            
            // Calcular costo (aproximado con precio promedio)
            $query = "SELECT precio_promedio FROM insumos WHERE id_insumo = :id";
            $stmt2 = $this->conn->prepare($query);
            $stmt2->bindParam(':id', $item['id_insumo']);
            $stmt2->execute();
            $insumo = $stmt2->fetch();
            
            if ($insumo) {
                $costo_total += $necesario * $insumo['precio_promedio'];
            }
        }
        
        return [
            'puede_producir' => empty($faltantes),
            'faltantes' => $faltantes,
            'costo_estimado' => $costo_total
        ];
    }
    
    // Crear nueva producción
    public function create() {
        try {
            $this->conn->beginTransaction();
            
            // Verificar disponibilidad
            $disponibilidad = $this->verificarDisponibilidad($this->id_producto, $this->cantidad_producida);
            
            if (!$disponibilidad['puede_producir']) {
                $this->conn->rollBack();
                return [
                    'success' => false,
                    'message' => 'No hay suficientes insumos',
                    'faltantes' => $disponibilidad['faltantes']
                ];
            }
            
            // Calcular costo de producción
            $this->costo_produccion = $disponibilidad['costo_estimado'];
            
            // Insertar producción
            $query = "INSERT INTO " . $this->table . " 
                      (id_producto, cantidad_producida, fecha_produccion, id_usuario, costo_produccion, notas)
                      VALUES (:id_producto, :cantidad, :fecha, :id_usuario, :costo, :notas)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id_producto', $this->id_producto);
            $stmt->bindParam(':cantidad', $this->cantidad_producida);
            $stmt->bindParam(':fecha', $this->fecha_produccion);
            $stmt->bindParam(':id_usuario', $this->id_usuario);
            $stmt->bindParam(':costo', $this->costo_produccion);
            $stmt->bindParam(':notas', $this->notas);
            $stmt->execute();
            
            $id_produccion = $this->conn->lastInsertId();
            
            // El trigger after_produccion_insert se encarga de:
            // 1. Descontar insumos del inventario
            // 2. Aumentar stock del producto terminado
            // 3. Registrar movimientos de inventario
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'id' => $id_produccion,
                'costo_produccion' => $this->costo_produccion
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error al registrar producción: ' . $e->getMessage()
            ];
        }
    }
    
    // Obtener estadísticas de producción
    public function getEstadisticas($fecha_inicio, $fecha_fin) {
        $query = "SELECT 
                    COUNT(*) as total_producciones,
                    SUM(cantidad_producida) as unidades_producidas,
                    SUM(costo_produccion) as costo_total,
                    COUNT(DISTINCT id_producto) as productos_distintos,
                    AVG(cantidad_producida) as promedio_cantidad
                  FROM " . $this->table . "
                  WHERE DATE(fecha_produccion) BETWEEN :fecha_inicio AND :fecha_fin";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        $general = $stmt->fetch();
        
        // Top productos producidos
        $query = "SELECT p.nombre_producto, p.tipo_producto,
                  SUM(pr.cantidad_producida) as total_producido,
                  COUNT(pr.id_produccion) as veces_producido,
                  SUM(pr.costo_produccion) as costo_total
                  FROM " . $this->table . " pr
                  LEFT JOIN productos_terminados p ON pr.id_producto = p.id_producto
                  WHERE DATE(pr.fecha_produccion) BETWEEN :fecha_inicio AND :fecha_fin
                  GROUP BY pr.id_producto, p.nombre_producto, p.tipo_producto
                  ORDER BY total_producido DESC
                  LIMIT 10";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        $top_productos = $stmt->fetchAll();
        
        return [
            'general' => $general,
            'top_productos' => $top_productos
        ];
    }
    
    // Obtener producción del día
    public function getProduccionHoy() {
        $query = "SELECT pr.*, p.nombre_producto, p.tipo_producto, p.precio_venta,
                  u.nombre_completo as usuario
                  FROM " . $this->table . " pr
                  LEFT JOIN productos_terminados p ON pr.id_producto = p.id_producto
                  LEFT JOIN usuarios u ON pr.id_usuario = u.id_usuario
                  WHERE DATE(pr.fecha_produccion) = CURDATE()
                  ORDER BY pr.fecha_produccion DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}

?>