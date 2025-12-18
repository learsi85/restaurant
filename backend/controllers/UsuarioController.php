<?php
// =====================================================
// controllers/UsuarioController.php
// =====================================================

require_once 'models/Usuario.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class UsuarioController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    // GET /api/usuarios
    public function index() {
        $user = $this->auth->verify();
        
        // Solo admin puede ver usuarios
        if ($user->rol !== 'Administrador') {
            Response::error("No tienes permisos", 403);
        }
        
        $usuario = new Usuario();
        $result = $usuario->getAll();
        
        Response::success("Usuarios obtenidos correctamente", $result);
    }
    
    // GET /api/usuarios/:id
    public function show($id) {
        $user = $this->auth->verify();
        
        if ($user->rol !== 'Administrador' && $user->id_usuario != $id) {
            Response::error("No tienes permisos", 403);
        }
        
        $usuario = new Usuario();
        $result = $usuario->getById($id);
        
        if (!$result) {
            Response::notFound("Usuario no encontrado");
        }
        
        Response::success("Usuario obtenido correctamente", $result);
    }
    
    // POST /api/usuarios
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $data = json_decode(file_get_contents("php://input"));
        
        $usuario = new Usuario();
        $resultado = $usuario->create([
            'nombre_completo' => $data->nombre_completo,
            'email' => $data->email,
            'username' => $data->username,
            'password' => $data->password,
            'id_rol' => $data->id_rol
        ]);
        
        if ($resultado['success']) {
            Response::success("Usuario creado correctamente", $resultado);
        } else {
            Response::error($resultado['message']);
        }
    }
    
    // PUT /api/usuarios/:id
    public function update($id) {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $data = json_decode(file_get_contents("php://input"));
        
        $usuario = new Usuario();
        $resultado = $usuario->update($id, [
            'nombre_completo' => $data->nombre_completo,
            'email' => $data->email,
            'username' => $data->username,
            'password' => $data->password ?? '',
            'id_rol' => $data->id_rol
        ]);
        
        if ($resultado) {
            Response::success("Usuario actualizado correctamente");
        } else {
            Response::error("Error al actualizar usuario");
        }
    }
    
    // DELETE /api/usuarios/:id
    public function delete($id) {
        $user = $this->auth->verify();
        $this->auth->checkRole($user, ['Administrador']);
        
        $usuario = new Usuario();
        
        if ($usuario->delete($id)) {
            Response::success("Usuario desactivado correctamente");
        } else {
            Response::error("Error al desactivar usuario");
        }
    }
}
?>