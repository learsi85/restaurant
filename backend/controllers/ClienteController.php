<?php
// =====================================================
// controllers/ClienteController.php
// Controlador para endpoints de clientes
// =====================================================

require_once 'models/Cliente.php';

class ClienteController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    public function index() {
        $user = $this->auth->verify();
        
        $cliente = new Cliente();
        $result = $cliente->getAll();
        
        Response::success("Clientes obtenidos correctamente", $result);
    }
    
    public function store() {
        $user = $this->auth->verify();
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->nombre_cliente)) {
            Response::error("Nombre del cliente requerido");
        }
        
        $cliente = new Cliente();
        $cliente->nombre_cliente = $data->nombre_cliente;
        $cliente->telefono = $data->telefono ?? '';
        $cliente->email = $data->email ?? '';
        $cliente->direccion = $data->direccion ?? '';
        
        $id = $cliente->create();
        
        if ($id) {
            Response::success("Cliente creado correctamente", ['id' => $id]);
        } else {
            Response::error("Error al crear el cliente", 500);
        }
    }
    
    public function buscar() {
        $user = $this->auth->verify();
        
        $termino = $_GET['q'] ?? '';
        
        if (empty($termino)) {
            Response::error("Término de búsqueda requerido");
        }
        
        $cliente = new Cliente();
        $result = $cliente->buscar($termino);
        
        Response::success("Búsqueda completada", $result);
    }
}

?>