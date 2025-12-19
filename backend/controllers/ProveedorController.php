<?php
// =====================================================
// controllers/ProveedorController.php
// Controlador para endpoints de proveedores
// =====================================================

require_once 'models/Proveedor.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class ProveedorController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    public function index() {
        $user = $this->auth->verify();
        
        $proveedor = new Proveedor();
        $result = $proveedor->getAll();
        
        Response::success("Proveedores obtenidos correctamente", $result);
    }
    
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->nombre_proveedor)) {
            Response::error("Nombre de proveedor requerido");
        }
        
        $proveedor = new Proveedor();
        $proveedor->nombre_proveedor = $data->nombre_proveedor;
        $proveedor->contacto = $data->contacto ?? '';
        $proveedor->telefono = $data->telefono ?? '';
        $proveedor->email = $data->email ?? '';
        $proveedor->direccion = $data->direccion ?? '';
        
        $id = $proveedor->create();
        
        if ($id) {
            Response::success("Proveedor creado correctamente", ['id' => $id]);
        } else {
            Response::error("Error al crear el proveedor", 500);
        }
    }

    // PUT /api/proveedor/:id - Actualizar proveedor
    public function update($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.editar');
        
        $data = json_decode(file_get_contents("php://input"));
        
        $proveedor = new Proveedor();
        $proveedor->nombre_proveedor = $data->nombre_proveedor;
        $proveedor->contacto = $data->contacto;
        $proveedor->telefono = $data->telefono;
        $proveedor->email = $data->email;
        $proveedor->direccion = $data->direccion;
        $proveedor->id_proveedor = $id;
        
        if ($proveedor->update()) {
            Response::success("Proveedor actualizado correctamente");
        } else {
            Response::error("Error al actualizar el proveedor", 500);
        }
    }

    // DELETE /api/proveedor/:id - Eliminar proveedor
    public function delete($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.eliminar');
        
        $proveedor = new Proveedor();
        $proveedor->id_proveedor = $id;
        
        if ($proveedor->delete()) {
            Response::success("Proveedor eliminado correctamente");
        } else {
            Response::error("Error al eliminar el proveedor", 500);
        }
    }
}
?>