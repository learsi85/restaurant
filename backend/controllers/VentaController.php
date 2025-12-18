<?php
// =====================================================
// controllers/VentaController.php
// Controlador para endpoints de ventas
// =====================================================

require_once 'models/Ventas.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class VentaController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    // GET /api/ventas - Listar ventas con filtros
    public function index() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'ventas.ver');
        
        $filtros = [];
        if (isset($_GET['fecha_inicio'])) $filtros['fecha_inicio'] = $_GET['fecha_inicio'];
        if (isset($_GET['fecha_fin'])) $filtros['fecha_fin'] = $_GET['fecha_fin'];
        if (isset($_GET['metodo_pago'])) $filtros['metodo_pago'] = $_GET['metodo_pago'];
        
        $venta = new Venta();
        $result = $venta->getAll($filtros);
        
        Response::success("Ventas obtenidas correctamente", $result);
    }
    
    // GET /api/ventas/:id - Obtener venta específica
    public function show($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'ventas.ver');
        
        $venta = new Venta();
        $result = $venta->getById($id);
        
        if (!$result) {
            Response::notFound("Venta no encontrada");
        }
        
        Response::success("Venta obtenida correctamente", $result);
    }
    
    // GET /api/ventas/hoy - Obtener ventas del día
    public function hoy() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'ventas.ver');
        
        $venta = new Venta();
        $result = $venta->getVentasHoy();
        
        Response::success("Ventas de hoy obtenidas correctamente", $result);
    }
    
    // POST /api/ventas - Registrar nueva venta
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'ventas.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->productos) || empty($data->productos)) {
            Response::error("Debe agregar al menos un producto");
        }
        
        if (!isset($data->metodos_pago)) {
            Response::error("Método de pago requerido");
        }
        
        $venta = new Venta();
        $venta->fecha_venta = $data->fecha_venta ?? date('Y-m-d H:i:s');
        $venta->id_cliente = $data->id_cliente ?? null;
        $venta->subtotal = $data->subtotal;
        $venta->descuento = $data->descuento ?? 0;
        $venta->total_venta = $data->total_venta;
        //$venta->metodo_pago = $data->metodo_pago;
        $venta->id_usuario = $user->id_usuario;
        $venta->notas = $data->notas ?? '';
        
        $resultado = $venta->create($data->productos, $data->metodos_pago);
        
        if ($resultado['success']) {
            Response::success("Venta registrada correctamente", $resultado);
        } else {
            Response::error($resultado['message'], 400, $resultado);
        }
    }
    
    // POST /api/ventas/verificar - Verificar disponibilidad de productos
    public function verificar() {
        $user = $this->auth->verify();
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->productos) || empty($data->productos)) {
            Response::error("Debe proporcionar productos");
        }
        
        $venta = new Venta();
        $resultado = $venta->verificarDisponibilidad($data->productos);
        
        Response::success("Disponibilidad verificada", $resultado);
    }
    
    // GET /api/ventas/estadisticas - Obtener estadísticas
    public function estadisticas() {
        $user = $this->auth->verify();
        
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
        
        $venta = new Venta();
        $result = $venta->getEstadisticas($fecha_inicio, $fecha_fin);
        
        Response::success("Estadísticas obtenidas correctamente", $result);
    }
}

?>