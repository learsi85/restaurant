<?php
// =====================================================
// controllers/ProduccionController.php
// Controlador para endpoints de producción
// =====================================================

require_once 'models/Produccion.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class ProduccionController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    // GET /api/produccion - Listar producciones con filtros
    public function index() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'produccion.ver');
        
        $filtros = [];
        if (isset($_GET['fecha_inicio'])) $filtros['fecha_inicio'] = $_GET['fecha_inicio'];
        if (isset($_GET['fecha_fin'])) $filtros['fecha_fin'] = $_GET['fecha_fin'];
        if (isset($_GET['producto'])) $filtros['producto'] = $_GET['producto'];
        if (isset($_GET['tipo_producto'])) $filtros['tipo_producto'] = $_GET['tipo_producto'];
        
        $produccion = new Produccion();
        $result = $produccion->getAll($filtros);
        
        Response::success("Producciones obtenidas correctamente", $result);
    }
    
    // GET /api/produccion/:id - Obtener producción específica
    public function show($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'produccion.ver');
        
        $produccion = new Produccion();
        $result = $produccion->getById($id);
        
        if (!$result) {
            Response::notFound("Producción no encontrada");
        }
        
        Response::success("Producción obtenida correctamente", $result);
    }
    
    // GET /api/produccion/hoy - Obtener producción del día actual
    public function hoy() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'produccion.ver');
        
        $produccion = new Produccion();
        $result = $produccion->getProduccionHoy();
        
        Response::success("Producción de hoy obtenida correctamente", $result);
    }
    
    // POST /api/produccion - Registrar nueva producción
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'produccion.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id_producto) || !isset($data->cantidad_producida)) {
            Response::error("Datos incompletos");
        }
        
        if ($data->cantidad_producida <= 0) {
            Response::error("La cantidad debe ser mayor a 0");
        }
        
        $produccion = new Produccion();
        $produccion->id_producto = $data->id_producto;
        $produccion->cantidad_producida = $data->cantidad_producida;
        $produccion->fecha_produccion = $data->fecha_produccion ?? date('Y-m-d H:i:s');
        $produccion->id_usuario = $user->id_usuario;
        $produccion->notas = $data->notas ?? '';
        
        $resultado = $produccion->create();
        
        if ($resultado['success']) {
            Response::success("Producción registrada correctamente", $resultado);
        } else {
            Response::error($resultado['message'], 400, $resultado);
        }
    }
    
    // POST /api/produccion/verificar - Verificar disponibilidad antes de producir
    public function verificar() {
        $user = $this->auth->verify();
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id_producto) || !isset($data->cantidad)) {
            Response::error("Datos incompletos");
        }
        
        $produccion = new Produccion();
        $resultado = $produccion->verificarDisponibilidad($data->id_producto, $data->cantidad);
        
        Response::success("Disponibilidad verificada", $resultado);
    }
    
    // GET /api/produccion/estadisticas - Obtener estadísticas
    public function estadisticas() {
        $user = $this->auth->verify();
        
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
        
        $produccion = new Produccion();
        $result = $produccion->getEstadisticas($fecha_inicio, $fecha_fin);
        
        Response::success("Estadísticas obtenidas correctamente", $result);
    }
}
?>