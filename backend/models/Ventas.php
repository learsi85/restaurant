<?php
// models/Venta.php
// Modelo para gestión de ventas

require_once 'config/Database.php';

class Venta {
    private $conn;
    private $table = 'ventas';
    
    public $id_venta;
    public $numero_venta;
    public $fecha_venta;
    public $id_cliente;
    public $subtotal;
    public $descuento;
    public $total_venta;
    public $metodo_pago;
    public $id_usuario;
    public $notas;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todas las ventas con filtros
    public function getAll($filtros = []) {
        $where = "1=1";
        $params = [];
        
        if (isset($filtros['fecha_inicio'])) {
            $where .= " AND DATE(v.fecha_venta) >= :fecha_inicio";
            $params[':fecha_inicio'] = $filtros['fecha_inicio'];
        }
        
        if (isset($filtros['fecha_fin'])) {
            $where .= " AND DATE(v.fecha_venta) <= :fecha_fin";
            $params[':fecha_fin'] = $filtros['fecha_fin'];
        }
        
        if (isset($filtros['metodo_pago'])) {
            $where .= " AND v.metodo_pago = :metodo_pago";
            $params[':metodo_pago'] = $filtros['metodo_pago'];
        }
        
        $query = "SELECT v.*, 
                  COALESCE(c.nombre_cliente, 'Cliente General') as nombre_cliente,
                  u.nombre_completo as usuario
                  FROM " . $this->table . " v
                  LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
                  LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
                  WHERE " . $where . "
                  ORDER BY v.fecha_venta DESC";
        
        $stmt = $this->conn->prepare($query);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener venta por ID con detalles
    public function getById($id) {
        $query = "SELECT v.*, 
                  COALESCE(c.nombre_cliente, 'Cliente General') as nombre_cliente,
                  c.telefono as cliente_telefono,
                  c.email as cliente_email,
                  u.nombre_completo as usuario
                  FROM " . $this->table . " v
                  LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
                  LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
                  WHERE v.id_venta = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $venta = $stmt->fetch();
        
        if ($venta) {
            // Obtener detalles de productos vendidos
            $query = "SELECT dv.*, p.nombre_producto, p.tipo_producto
                      FROM detalle_ventas dv
                      LEFT JOIN productos_terminados p ON dv.id_producto = p.id_producto
                      WHERE dv.id_venta = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $venta['detalles'] = $stmt->fetchAll();

            $query = "SELECT * FROM metodo_pago WHERE id_venta = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $venta['pagos'] = $stmt->fetchAll();
        }
        
        return $venta;
    }
    
    // Verificar disponibilidad de productos antes de vender
    public function verificarDisponibilidad($productos) {
        $no_disponibles = [];
        
        foreach ($productos as $item) {
            $query = "SELECT nombre_producto, stock_actual 
                      FROM productos_terminados 
                      WHERE id_producto = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $item->id_producto);
            $stmt->execute();
            $producto = $stmt->fetch();
            
            if (!$producto) {
                $no_disponibles[] = [
                    'producto' => 'Producto no encontrado',
                    'solicitado' => $item->cantidad,
                    'disponible' => 0
                ];
            } elseif ($producto['stock_actual'] < $item->cantidad) {
                $no_disponibles[] = [
                    'producto' => $producto['nombre_producto'],
                    'solicitado' => $item->cantidad,
                    'disponible' => $producto['stock_actual'],
                    'faltante' => $item->cantidad - $producto['stock_actual']
                ];
            }
        }
        
        return [
            'puede_vender' => empty($no_disponibles),
            'no_disponibles' => $no_disponibles
        ];
    }
    
    // Crear nueva venta
    public function create($detalles, $metodos_pago) {
        try {
            $this->conn->beginTransaction();
            
            // Verificar disponibilidad
            $disponibilidad = $this->verificarDisponibilidad($detalles);
            
            if (!$disponibilidad['puede_vender']) {
                $this->conn->rollBack();
                return [
                    'success' => false,
                    'message' => 'Productos no disponibles',
                    'no_disponibles' => $disponibilidad['no_disponibles']
                ];
            }
            
            // Generar número de venta
            $this->numero_venta = $this->generarNumeroVenta();
            
            // Insertar venta
            $query = "INSERT INTO " . $this->table . " 
                      (numero_venta, fecha_venta, id_cliente, subtotal, descuento, total_venta, id_usuario, notas)
                      VALUES (:numero, :fecha, :cliente, :subtotal, :descuento, :total, :usuario, :notas)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':numero', $this->numero_venta);
            $stmt->bindParam(':fecha', $this->fecha_venta);
            $stmt->bindParam(':cliente', $this->id_cliente);
            $stmt->bindParam(':subtotal', $this->subtotal);
            $stmt->bindParam(':descuento', $this->descuento);
            $stmt->bindParam(':total', $this->total_venta);
            //$stmt->bindParam(':metodo', $this->metodo_pago);
            $stmt->bindParam(':usuario', $this->id_usuario);
            $stmt->bindParam(':notas', $this->notas);
            $stmt->execute();
            
            $id_venta = $this->conn->lastInsertId();
            
            // Insertar detalles de la venta
            $query = "INSERT INTO detalle_ventas 
                      (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                      VALUES (:id_venta, :id_producto, :cantidad, :precio, :subtotal)";
            
            $stmt = $this->conn->prepare($query);
            
            foreach ($detalles as $detalle) {
                $stmt->bindParam(':id_venta', $id_venta);
                $stmt->bindParam(':id_producto', $detalle->id_producto);
                $stmt->bindParam(':cantidad', $detalle->cantidad);
                $stmt->bindParam(':precio', $detalle->precio_unitario);
                $stmt->bindParam(':subtotal', $detalle->subtotal);
                $stmt->execute();
            }

            // Insertar metodos de pago de la venta
            $query = "INSERT INTO metodo_pago 
                      (id_venta, metodo, monto, numero_autorizacion)
                      VALUES (:id_venta, :metodo, :monto, :numero_autorizacion)";
            
            $stmt = $this->conn->prepare($query);

            foreach ($metodos_pago as $metodos) {
                $stmt->bindParam(':id_venta', $id_venta);
                $stmt->bindParam(':metodo', $metodos->metodo);
                $stmt->bindParam(':monto', $metodos->monto);
                $stmt->bindParam(':numero_autorizacion', $metodos->numero_autorizacion);
                $stmt->execute();
            }
            
            // El trigger after_detalle_venta_insert se encarga de descontar el stock
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'id' => $id_venta,
                'numero_venta' => $this->numero_venta
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error al registrar venta: ' . $e->getMessage()
            ];
        }
    }
    
    // Generar número de venta automático
    private function generarNumeroVenta() {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " WHERE YEAR(fecha_venta) = YEAR(CURDATE())";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch();
        
        $numero = $row['total'] + 1;
        return 'V' . date('Y') . '-' . str_pad($numero, 5, '0', STR_PAD_LEFT);
    }
    
    // Obtener estadísticas de ventas
    public function getEstadisticas($fecha_inicio, $fecha_fin) {
        // Estadísticas generales
        $query = "SELECT 
                    COUNT(*) as total_ventas,
                    SUM(total_venta) as monto_total,
                    SUM(descuento) as descuentos_total,
                    AVG(total_venta) as ticket_promedio
                  FROM " . $this->table . "
                  WHERE DATE(fecha_venta) BETWEEN :fecha_inicio AND :fecha_fin";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        $general = $stmt->fetch();

        // Obtener totales reales de pagos mixtos
        $query = "SELECT 
                    mp.metodo,
                    SUM(mp.monto) as total
                  FROM metodo_pago mp
                  JOIN ventas v ON mp.id_venta = v.id_venta
                  WHERE DATE(v.fecha_venta) BETWEEN :fecha_inicio AND :fecha_fin
                  GROUP BY mp.metodo";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        $pagos = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // Sumar totales
        $totales = [
            'efectivo' => $pagos['efectivo'] ?? 0,
            'tarjeta' => $pagos['tarjeta'] ?? 0,
            'transferencia' => $pagos['transferencia'] ?? 0
        ];
        
        // Top productos vendidos
        $query = "SELECT p.nombre_producto, p.tipo_producto,
                  SUM(dv.cantidad) as cantidad_vendida,
                  SUM(dv.subtotal) as total_vendido,
                  COUNT(DISTINCT dv.id_venta) as numero_ventas
                  FROM detalle_ventas dv
                  LEFT JOIN productos_terminados p ON dv.id_producto = p.id_producto
                  LEFT JOIN ventas v ON dv.id_venta = v.id_venta
                  WHERE DATE(v.fecha_venta) BETWEEN :fecha_inicio AND :fecha_fin
                  GROUP BY dv.id_producto, p.nombre_producto, p.tipo_producto
                  ORDER BY cantidad_vendida DESC
                  LIMIT 10";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        $top_productos = $stmt->fetchAll();
        
        // Ventas por día
        $query = "SELECT 
                    DATE(fecha_venta) as fecha,
                    COUNT(*) as ventas,
                    SUM(total_venta) as monto
                  FROM " . $this->table . "
                  WHERE DATE(fecha_venta) BETWEEN :fecha_inicio AND :fecha_fin
                  GROUP BY DATE(fecha_venta)
                  ORDER BY fecha ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_inicio', $fecha_inicio);
        $stmt->bindParam(':fecha_fin', $fecha_fin);
        $stmt->execute();
        $por_dia = $stmt->fetchAll();
        
        return [
            'general' => $general,
            'totales' => $totales,
            'top_productos' => $top_productos,
            'por_dia' => $por_dia
        ];
    }
    
    // Obtener ventas del día
    public function getVentasHoy() {
        $query = "SELECT v.*, 
                  COALESCE(c.nombre_cliente, 'Cliente General') as nombre_cliente,
                  u.nombre_completo as usuario
                  FROM " . $this->table . " v
                  LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
                  LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
                  WHERE DATE(v.fecha_venta) = CURDATE()
                  ORDER BY v.fecha_venta DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>