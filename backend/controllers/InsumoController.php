<?php
// =====================================================
// controllers/InsumoController.php
// Controlador para endpoints de insumos
// =====================================================

require_once 'models/Insumo.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class InsumoController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
     // GET /api/insumos - Listar todos los insumos
    public function index() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'inventario.ver');
        
        $insumo = new Insumo();
        $result = $insumo->getAll();

        Response::success("Insumos obtenidos correctamente", $result);
    }
   
    // GET /api/insumos/:id - Obtener un insumo específico
    public function show($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'inventario.ver');
        
        $insumo = new Insumo();
        $result = $insumo->getById($id);
        
        if (!$result) {
            Response::notFound("Insumo no encontrado");
        }
        
        Response::success("Insumo obtenido correctamente", $result);
    }
    
    // POST /api/insumos - Crear nuevo insumo
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'inventario.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->nombre_insumo) || !isset($data->id_categoria) || !isset($data->id_unidad)) {
            Response::error("Datos incompletos");
        }
        
        $insumo = new Insumo();
        $insumo->nombre_insumo = $data->nombre_insumo;
        $insumo->descripcion = $data->descripcion ?? '';
        $insumo->id_categoria = $data->id_categoria;
        $insumo->id_unidad = $data->id_unidad;
        $insumo->stock_actual = $data->stock_actual ?? 0;
        $insumo->stock_minimo = $data->stock_minimo ?? 0;
        $insumo->precio_promedio = $data->precio_promedio ?? 0;
        
        $id = $insumo->create();
        
        if ($id) {
            Response::success("Insumo creado correctamente", ['id' => $id]);
        } else {
            Response::error("Error al crear el insumo", 500);
        }
    }
    
    // PUT /api/insumos/:id - Actualizar insumo
    public function update($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'inventario.editar');
        
        $data = json_decode(file_get_contents("php://input"));
        
        $insumo = new Insumo();
        $insumo->id_insumo = $id;
        $insumo->nombre_insumo = $data->nombre_insumo;
        $insumo->descripcion = $data->descripcion ?? '';
        $insumo->id_categoria = $data->id_categoria;
        $insumo->id_unidad = $data->id_unidad;
        $insumo->stock_minimo = $data->stock_minimo;
        $insumo->precio_promedio = $data->precio_promedio;
        
        if ($insumo->update()) {
            Response::success("Insumo actualizado correctamente");
        } else {
            Response::error("Error al actualizar el insumo", 500);
        }
    }
    
    // DELETE /api/insumos/:id - Eliminar insumo
    public function delete($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'inventario.eliminar');
        
        $insumo = new Insumo();
        $insumo->id_insumo = $id;
        
        if ($insumo->delete()) {
            Response::success("Insumo eliminado correctamente");
        } else {
            Response::error("Error al eliminar el insumo", 500);
        }
    }
    
    // POST /api/insumos/:id/ajustar - Ajuste manual de inventario
    public function ajustarStock($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'inventario.ajustar');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->cantidad) || !isset($data->motivo)) {
            Response::error("Datos incompletos");
        }
        
        $insumo = new Insumo();
        $insumo->id_insumo = $id;
        
        if ($insumo->ajustarStock($data->cantidad, $data->motivo, $user->id_usuario)) {
            Response::success("Stock ajustado correctamente");
        } else {
            Response::error("Error al ajustar el stock", 500);
        }
    }
    
    // GET /api/insumos/alertas - Obtener insumos con stock bajo
    public function alertas() {
        $user = $this->auth->verify();
        
        $insumo = new Insumo();
        $result = $insumo->getStockBajo();
        
        Response::success("Alertas de inventario obtenidas", $result);
    }
    
    // GET /api/insumos/:id/movimientos - Obtener historial de movimientos
    public function movimientos($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'inventario.ver');
        
        $insumo = new Insumo();
        $insumo->id_insumo = $id;
        $result = $insumo->getMovimientos();
        
        Response::success("Movimientos obtenidos correctamente", $result);
    } 
}
?>