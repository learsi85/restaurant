<?php
// models/Caja.php
// Modelo para gestión de caja

require_once 'config/Database.php';

class Caja {
    private $conn;
    private $table = 'caja';
    
    public $id_caja;
    public $fecha_apertura;
    public $fecha_cierre;
    public $monto_inicial;
    public $monto_final;
    public $total_ventas;
    public $total_gastos;
    public $diferencia;
    public $id_usuario_apertura;
    public $id_usuario_cierre;
    public $estado;
    public $notas;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Verificar si hay una caja abierta
    public function getCajaAbierta() {
        $query = "SELECT c.*, 
                  u1.nombre_completo as usuario_apertura,
                  u2.nombre_completo as usuario_cierre
                  FROM " . $this->table . " c
                  LEFT JOIN usuarios u1 ON c.id_usuario_apertura = u1.id_usuario
                  LEFT JOIN usuarios u2 ON c.id_usuario_cierre = u2.id_usuario
                  WHERE c.estado = 'abierta'
                  ORDER BY c.fecha_apertura DESC
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    // Abrir caja
    public function abrir() {
        // Verificar si ya hay una caja abierta
        $cajaAbierta = $this->getCajaAbierta();
        
        if ($cajaAbierta) {
            return [
                'success' => false,
                'message' => 'Ya hay una caja abierta',
                'caja' => $cajaAbierta
            ];
        }
        
        try {
            $query = "INSERT INTO " . $this->table . " 
                      (fecha_apertura, monto_inicial, id_usuario_apertura, estado, notas)
                      VALUES (NOW(), :monto_inicial, :id_usuario, 'abierta', :notas)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':monto_inicial', $this->monto_inicial);
            $stmt->bindParam(':id_usuario', $this->id_usuario_apertura);
            $stmt->bindParam(':notas', $this->notas);
            
            if ($stmt->execute()) {
                $id = $this->conn->lastInsertId();
                return [
                    'success' => true,
                    'message' => 'Caja abierta correctamente',
                    'id' => $id
                ];
            }
            
            return [
                'success' => false,
                'message' => 'Error al abrir caja'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    // Obtener resumen de caja abierta
    public function getResumenCajaAbierta() {
        $cajaAbierta = $this->getCajaAbierta();
        
        if (!$cajaAbierta) {
            return null;
        }
        
        // Obtener total de ventas desde la apertura
        $query = "SELECT 
                    SUM(CASE WHEN mp.metodo = 'efectivo' THEN mp.monto ELSE 0 END) as efectivo,
                    SUM(CASE WHEN mp.metodo = 'tarjeta' THEN mp.monto ELSE 0 END) as tarjeta,
                    SUM(CASE WHEN mp.metodo = 'transferencia' THEN mp.monto ELSE 0 END) as transferencia,
                    SUM(mp.monto) as total_ventas
                  FROM metodo_pago mp
                  JOIN ventas v ON mp.id_venta = v.id_venta
                  WHERE fecha_venta >= :fecha_apertura";
        /* $query = "SELECT 
                    COUNT(*) as numero_ventas,
                    SUM(CASE WHEN metodo_pago = 'efectivo' THEN total_venta ELSE 0 END) as efectivo,
                    SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total_venta ELSE 0 END) as tarjeta,
                    SUM(CASE WHEN metodo_pago = 'transferencia' THEN total_venta ELSE 0 END) as transferencia,
                    SUM(total_venta) as total_ventas
                  FROM ventas
                  WHERE fecha_venta >= :fecha_apertura"; */
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_apertura', $cajaAbierta['fecha_apertura']);
        $stmt->execute();
        $ventas = $stmt->fetch();

        $query = "SELECT COUNT(*) as numero_ventas
                FROM ventas
                WHERE fecha_venta >= :fecha_apertura";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':fecha_apertura', $cajaAbierta['fecha_apertura']);
        $stmt->execute();
        $numero_ventas = $stmt->fetch();

        $ventas['numero_ventas'] = $numero_ventas['numero_ventas'];
        
        return [
            'caja' => $cajaAbierta,
            'ventas' => $ventas,
            'monto_esperado' => $cajaAbierta['monto_inicial'] + $ventas['efectivo']
        ];
    }
    
    // Cerrar caja
    public function cerrar() {
        try {
            $this->conn->beginTransaction();
            
            // Obtener caja abierta
            $cajaAbierta = $this->getCajaAbierta();
            
            if (!$cajaAbierta) {
                $this->conn->rollBack();
                return [
                    'success' => false,
                    'message' => 'No hay caja abierta'
                ];
            }
            
            // Calcular totales
            $query = "SELECT 
                        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total_venta ELSE 0 END) as total_efectivo,
                        SUM(total_venta) as total_ventas
                      FROM ventas
                      WHERE fecha_venta >= :fecha_apertura";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':fecha_apertura', $cajaAbierta['fecha_apertura']);
            $stmt->execute();
            $totales = $stmt->fetch();
            
            // Calcular diferencia
            $monto_esperado = $cajaAbierta['monto_inicial'] + $totales['total_efectivo'];
            $diferencia = $this->monto_final - $monto_esperado;
            
            // Actualizar caja
            $query = "UPDATE " . $this->table . "
                      SET fecha_cierre = NOW(),
                          monto_final = :monto_final,
                          total_ventas = :total_ventas,
                          diferencia = :diferencia,
                          id_usuario_cierre = :id_usuario,
                          estado = 'cerrada',
                          notas = CONCAT(COALESCE(notas, ''), ' | Cierre: ', COALESCE(:notas_cierre, ''))
                      WHERE id_caja = :id_caja";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':monto_final', $this->monto_final);
            $stmt->bindParam(':total_ventas', $totales['total_ventas']);
            $stmt->bindParam(':diferencia', $diferencia);
            $stmt->bindParam(':id_usuario', $this->id_usuario_cierre);
            $stmt->bindParam(':notas_cierre', $this->notas);
            $stmt->bindParam(':id_caja', $cajaAbierta['id_caja']);
            
            if ($stmt->execute()) {
                $this->conn->commit();
                return [
                    'success' => true,
                    'message' => 'Caja cerrada correctamente',
                    'diferencia' => $diferencia,
                    'monto_esperado' => $monto_esperado
                ];
            }
            
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error al cerrar caja'
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    // Obtener historial de cajas
    public function getHistorial($limite = 30) {
        $query = "SELECT c.*,
                  u1.nombre_completo as usuario_apertura,
                  u2.nombre_completo as usuario_cierre
                  FROM " . $this->table . " c
                  LEFT JOIN usuarios u1 ON c.id_usuario_apertura = u1.id_usuario
                  LEFT JOIN usuarios u2 ON c.id_usuario_cierre = u2.id_usuario
                  ORDER BY c.fecha_apertura DESC
                  LIMIT :limite";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limite', $limite, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener detalle de caja cerrada
    public function getDetalleCaja($id_caja) {
        $query = "SELECT c.*,
                  u1.nombre_completo as usuario_apertura,
                  u2.nombre_completo as usuario_cierre
                  FROM " . $this->table . " c
                  LEFT JOIN usuarios u1 ON c.id_usuario_apertura = u1.id_usuario
                  LEFT JOIN usuarios u2 ON c.id_usuario_cierre = u2.id_usuario
                  WHERE c.id_caja = :id_caja";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_caja', $id_caja);
        $stmt->execute();
        $caja = $stmt->fetch();
        
        if ($caja) {
            // Obtener ventas de ese período
            $query = "SELECT 
                        COUNT(*) as numero_ventas,
                        SUM(CASE WHEN metodo_pago = 'efectivo' THEN total_venta ELSE 0 END) as efectivo,
                        SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total_venta ELSE 0 END) as tarjeta,
                        SUM(CASE WHEN metodo_pago = 'transferencia' THEN total_venta ELSE 0 END) as transferencia
                      FROM ventas
                      WHERE fecha_venta >= :fecha_apertura";
            
            if ($caja['fecha_cierre']) {
                $query .= " AND fecha_venta <= :fecha_cierre";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':fecha_apertura', $caja['fecha_apertura']);
            if ($caja['fecha_cierre']) {
                $stmt->bindParam(':fecha_cierre', $caja['fecha_cierre']);
            }
            $stmt->execute();
            $caja['ventas_detalle'] = $stmt->fetch();
        }
        
        return $caja;
    }
}

?>