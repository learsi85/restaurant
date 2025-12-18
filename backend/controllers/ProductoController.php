<?php
// =====================================================
// controllers/ProductoController.php
// Controlador para endpoints de productos
// =====================================================

require_once 'models/ProductoTerminado.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class ProductoController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    // GET /api/productos - Listar todos los productos
    public function index() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'productos.ver');
        
        $producto = new ProductoTerminado();
        $result = $producto->getAll();
        
        Response::success("Productos obtenidos correctamente", $result);
    }
    
    // GET /api/productos/:id - Obtener un producto específico con receta
    public function show($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'productos.ver');
        
        $producto = new ProductoTerminado();
        $result = $producto->getById($id);
        
        if (!$result) {
            Response::notFound("Producto no encontrado");
        }
        
        Response::success("Producto obtenido correctamente", $result);
    }
    
    // GET /api/productos/tipo/:tipo - Obtener productos por tipo
    public function porTipo($tipo) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'productos.ver');
        
        $producto = new ProductoTerminado();
        $result = $producto->getByTipo($tipo);
        
        Response::success("Productos obtenidos correctamente", $result);
    }
    
    // POST /api/productos - Crear nuevo producto
    public function store() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'productos.crear');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->nombre_producto) || !isset($data->tipo_producto) || !isset($data->precio_venta)) {
            Response::error("Datos incompletos");
        }
        
        $producto = new ProductoTerminado();
        $producto->nombre_producto = $data->nombre_producto;
        $producto->descripcion = $data->descripcion ?? '';
        $producto->tipo_producto = $data->tipo_producto;
        $producto->precio_venta = $data->precio_venta;
        $producto->stock_actual = $data->stock_actual ?? 0;
        
        $id = $producto->create();
        
        if ($id) {
            // Si hay receta, guardarla
            if (isset($data->receta) && !empty($data->receta)) {
                $producto->id_producto = $id;
                $producto->guardarReceta($data->receta);
            }
            
            Response::success("Producto creado correctamente", ['id' => $id]);
        } else {
            Response::error("Error al crear el producto", 500);
        }
    }
    
    // PUT /api/productos/:id - Actualizar producto
    public function update($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'productos.editar');
        
        $data = json_decode(file_get_contents("php://input"));
         
        $producto = new ProductoTerminado();
        $producto->id_producto = $id;
        $producto->nombre_producto = $data->nombre_producto;
        $producto->descripcion = $data->descripcion ?? '';
        $producto->tipo_producto = $data->tipo_producto;
        $producto->precio_venta = $data->precio_venta;
        
        if ($producto->update()) {
            // Si hay receta, actualizarla
            if (isset($data->receta)) {
                $producto->guardarReceta($data->receta);
            }
            
            Response::success("Producto actualizado correctamente"); 
        } else {
            Response::error("Error al actualizar el producto", 500);
        } 
    }
    
    // DELETE /api/productos/:id - Eliminar producto
    public function delete($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'producto.eliminar');
        
        $producto = new ProductoTerminado();
        $producto->id_producto = $id;
        
        if ($producto->delete()) {
            Response::success("Producto eliminado correctamente");
        } else {
            Response::error("Error al eliminar el producto", 500);
        }
    }
    
    // POST /api/productos/:id/verificar-disponibilidad - Verificar si se puede producir
    public function verificarDisponibilidad($id) {
        $user = $this->auth->verify();
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->cantidad)) {
            Response::error("Cantidad requerida");
        }
        
        $producto = new ProductoTerminado();
        $producto->id_producto = $id;
        
        $resultado = $producto->verificarDisponibilidad($data->cantidad);
        
        Response::success("Disponibilidad verificada", $resultado);
    }
}
?>