<?php
// =====================================================
// controllers/CategoriaController.php
// Controlador para categorías de insumos
// =====================================================

require_once 'models/Categoria.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class CategoriaController {
    private $db;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    public function index() {
        $user = $this->auth->verify();
        
        $categoria = new Categoria();
        $result = $categoria->getAll();
        
        Response::success("Categorias obtenidas correctamente", $result);
    }
    
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->nombre_categoria)) {
            Response::error("Nombre de categoria requerido");
        }
        
        $categoria = new Categoria();
        $categoria->nombre_categoria = $data->nombre_categoria;
        $categoria->descripcion = $data->descripcion ?? '';
        
        $id = $categoria->create();
        
        if ($id) {
            Response::success("Categoria creada correctamente", ['id' => $id]);
        } else {
            Response::error("Error al crear la categoria", 500);
        }
    }

    // PUT /api/categoria/:id - Actualizar categoria
    public function update($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.editar');
        
        $data = json_decode(file_get_contents("php://input"));
        
        $categoria = new Categoria();
        $categoria->nombre_categoria = $data->nombre_categoria;
        $categoria->descripcion = $data->descripcion;
        $categoria->id_categoria = $id;
        
        if ($categoria->update()) {
            Response::success("Categoria actualizada correctamente");
        } else {
            Response::error("Error al actualizar la categoria", 500);
        }
    }

    // DELETE /api/categoria/:id - Eliminar categoria
    public function delete($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'catalogos.eliminar');
        
        $categoria = new Categoria();
        $categoria->id_categoria = $id;
        
        if ($categoria->delete()) {
            Response::success("Categoria eliminada correctamente");
        } else {
            Response::error("Error al eliminar la categoria", 500);
        }
    }
}
?>