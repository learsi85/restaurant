<?php
// =====================================================
// controllers/CompraController.php
// Controlador para endpoints de compras
// =====================================================

require_once 'models/Compra.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class CompraController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    // GET /api/compras - Listar compras con filtros
    public function index() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'compras.ver');
        
        $filtros = [];
        if (isset($_GET['fecha_inicio'])) $filtros['fecha_inicio'] = $_GET['fecha_inicio'];
        if (isset($_GET['fecha_fin'])) $filtros['fecha_fin'] = $_GET['fecha_fin'];
        if (isset($_GET['proveedor'])) $filtros['proveedor'] = $_GET['proveedor'];
        if (isset($_GET['estado'])) $filtros['estado'] = $_GET['estado'];
        
        $compra = new Compra();
        $result = $compra->getAll($filtros);
        
        Response::success("Compras obtenidas correctamente", $result);
    }
    
    // GET /api/compras/:id - Obtener compra específica
    public function show($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'compras.ver');
        
        $compra = new Compra();
        $result = $compra->getById($id);
        
        if (!$result) {
            Response::notFound("Compra no encontrada");
        }
        
        Response::success("Compra obtenida correctamente", $result);
    }
    
    // POST /api/compras - Crear nueva compra
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'compras.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id_proveedor) || !isset($data->detalles) || empty($data->detalles)) {
            Response::error("Datos incompletos");
        }
        
        $compra = new Compra();
        $compra->id_proveedor = $data->id_proveedor;
        $compra->fecha_compra = $data->fecha_compra ?? date('Y-m-d H:i:s');
        $compra->total_compra = $data->total_compra;
        $compra->id_usuario = $user->id_usuario;
        $compra->notas = $data->notas ?? '';
        $compra->estado = $data->estado ?? 'recibida';
        
        $id = $compra->create($data->detalles);
        //return $id;
        if ($id) {
            Response::success("Compra registrada correctamente", ['id' => $id]);
        } else {
            Response::error("Error al registrar la compra", 500);
        }
    }
    
    // PUT /api/compras/:id/estado - Actualizar estado
    public function actualizarEstado($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'compras.editar');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->estado)) {
            Response::error("Estado no proporcionado");
        }
        
        $compra = new Compra();
        $compra->id_compra = $id;
        
        if ($compra->actualizarEstado($data->estado)) {
            Response::success("Estado actualizado correctamente");
        } else {
            Response::error("Error al actualizar el estado", 500);
        }
    }
    
    // GET /api/compras/estadisticas - Obtener estadísticas
    public function estadisticas() {
        $user = $this->auth->verify();
        
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
        
        $compra = new Compra();
        $result = $compra->getEstadisticas($fecha_inicio, $fecha_fin);
        
        Response::success("Estadísticas obtenidas correctamente", $result);
    }
}
?>