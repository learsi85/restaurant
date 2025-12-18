<?php
// =====================================================
// controllers/RolController.php
// =====================================================

require_once 'models/Rol.php';
require_once 'models/Permiso.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class RolController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    // GET /api/roles
    public function index() {
        $user = $this->auth->verify();
        
        $rol = new Rol();
        $result = $rol->getAll();
        
        Response::success("Roles obtenidos correctamente", $result);
    }
    
    // GET /api/roles/:id
    public function show($id) {
        $user = $this->auth->verify();
        
        $rol = new Rol();
        $result = $rol->getById($id);
        
        if (!$result) {
            Response::notFound("Rol no encontrado");
        }
        
        Response::success("Rol obtenido correctamente", $result);
    }
    
    // POST /api/roles
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $data = json_decode(file_get_contents("php://input"));
        
        $rol = new Rol();
        $resultado = $rol->create([
            'nombre_rol' => $data->nombre_rol,
            'descripcion' => $data->descripcion,
            'activo' => $data->activo
        ]);
        
        if ($resultado['success']) {
            Response::success("Rol creado correctamente", $resultado);
        } else {
            Response::error($resultado['message']);
        }
    }

    // PUT /api/roles/:id
    public function update($id) {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $data = json_decode(file_get_contents("php://input"));
        
        $rol = new Rol();
        $resultado = $rol->update($id, [
            'nombre_rol' => $data->nombre_rol,
            'descripcion' => $data->descripcion,
            'activo' => $data->activo
        ]);
        
        if ($resultado) {
            Response::success("Usuario actualizado correctamente");
        } else {
            Response::error("Error al actualizar usuario");
        }
    }

    // PUT /api/roles/:id/permisos
    public function actualizarPermisos($id) {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $data = json_decode(file_get_contents("php://input"));
        
        $rol = new Rol();
        
        if ($rol->actualizarPermisos($id, $data)) {
            Response::success("Permisos actualizados correctamente");
        } else {
            Response::error("Error al actualizar permisos");
        } 
    }
    
    // GET /api/permisos
    public function permisos() {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $permiso = new Permiso();
        $result = $permiso->getAllAgrupados();
        
        Response::success("Permisos obtenidos correctamente", $result);
    }
    // GET /api/permisos del Rol
    public function permisoRol($id) {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $rol = new Rol();
        $result = $rol->getPermisosRol($id);
        
        if (!$result) {
            Response::success("Rol nuevo", $result);
        }
        
        Response::success("Permisos del rol obtenido correctamente", $result); 
    }

    // DELETE /api/rol/:id
    public function delete($id) {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $rol = new Rol();
        
        if ($rol->delete($id)) {
            Response::success("Rol desactivado correctamente");
        } else {
            Response::error("Error al desactivar rol");
        }
    }
}

?>