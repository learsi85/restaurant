<?php
// =====================================================
// controllers/UnidadController.php
// Controlador para unidades de medida
// =====================================================

require_once 'models/Unidad.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class UnidadController {
    private $db;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    public function index() {
        $user = $this->auth->verify();
        
        $unidad = new Unidad();
        $result = $unidad->getAll();
        
        Response::success("unidads obtenidas correctamente", $result);
    }
    
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->nombre_unidad)) {
            Response::error("Nombre de unidad requerida");
        }
        
        $unidad = new Unidad();
        $unidad->nombre_unidad = $data->nombre_unidad;
        $unidad->abreviatura = $data->abreviatura ?? '';
        $unidad->tipo = $data->tipo ?? '';
        
        $id = $unidad->create();
        
        if ($id) {
            Response::success("Unidad creada correctamente", ['id' => $id]);
        } else {
            Response::error("Error al crear la unidad", 500);
        }
    }

    // PUT /api/unidad/:id - Actualizar unidad
    public function update($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.editar');
        
        $data = json_decode(file_get_contents("php://input"));
        
        $unidad = new Unidad();
        $unidad->nombre_unidad = $data->nombre_unidad;
        $unidad->abreviatura = $data->abreviatura;
        $unidad->tipo = $data->tipo;
        $unidad->id_unidad = $id;
        
        if ($unidad->update()) {
            Response::success("Unidad actualizada correctamente");
        } else {
            Response::error("Error al actualizar la unidad", 500);
        }
    }

    // DELETE /api/unidad/:id - Eliminar unidad
    public function delete($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.eliminar');
        
        $unidad = new Unidad();
        $unidad->id_unidad = $id;
        
        if ($unidad->delete()) {
            Response::success("Unidad eliminada correctamente");
        } else {
            Response::error("Error al eliminar la unidad", 500);
        }
    }
}
?>