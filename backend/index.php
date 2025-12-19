<?php
// index.php (Router principal)
// Este archivo maneja todas las rutas de la API

require_once 'config/cors.php';

// Obtener la ruta solicitada
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remover query string y base path si existe
$path = parse_url($request_uri, PHP_URL_PATH);
//$path = str_replace('/restaurant/backend', '', $path); // LOCAL
$path = str_replace('/restaurant', '', $path); // BLUEHOST

// Dividir la ruta en segmentos
$segments = array_filter(explode('/', $path));
$segments = array_values($segments);

// Determinar el controlador y acción
$controller = $segments[0] ?? null;
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;

try {
    switch ($controller) {
        // =====================================================
        // RUTAS DE AUTENTICACIÓN
        // =====================================================
        case 'auth':
            require_once 'controllers/AuthController.php';
            $authController = new AuthController();
            $action = $id; 
            if ($action === 'login' && $request_method === 'POST') {
                $authController->login();
            } elseif ($action === 'register' && $request_method === 'POST') {
                $authController->register();
            } elseif ($action === 'me' && $request_method === 'GET') {
                $authController->me();
            } elseif ($action === 'logout' && $request_method === 'POST') {
                $authController->logout();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
            
        // =====================================================
        // RUTAS DE INSUMOS
        // =====================================================
        case 'insumos': 
            require_once 'controllers/InsumoController.php'; 
            $insumoController = new InsumoController();
            $id = $id === 'a' ? null : $id;
            
            if (!$id && $request_method === 'GET' && $action === 'alertas') {
                $insumoController->alertas();
            } elseif (!$id && $request_method === 'GET') {
                $insumoController->index();
            } elseif ($id && !$action && $request_method === 'GET') {
                $insumoController->show($id);
            } elseif (!$id && $request_method === 'POST') {
                $insumoController->store();
            } elseif ($id && !$action && $request_method === 'PUT') {
                $insumoController->update($id);
            } elseif ($id && !$action && $request_method === 'DELETE') {
                $insumoController->delete($id);
            } elseif ($id && $action === 'ajustar' && $request_method === 'POST') {
                $insumoController->ajustarStock($id);
            } elseif ($id && $action === 'movimientos' && $request_method === 'GET') {
                $insumoController->movimientos($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
            
        // =====================================================
        // RUTAS DE COMPRAS
        // =====================================================
        case 'compras':
            require_once 'controllers/CompraController.php';
            $compraController = new CompraController();
            
            if (!$id && $request_method === 'GET' && $action === 'estadisticas') {
                $compraController->estadisticas();
            } elseif (!$id && $request_method === 'GET') {
                $compraController->index();
            } elseif ($id && !$action && $request_method === 'GET') {
                $compraController->show($id);
            } elseif (!$id && $request_method === 'POST') {
                $compraController->store();
            } elseif ($id && $action === 'estado' && $request_method === 'PUT') {
                $compraController->actualizarEstado($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
            
        // =====================================================
        // RUTAS DE PROVEEDORES
        // =====================================================
        case 'proveedores':
            require_once 'controllers/ProveedorController.php';
            $proveedorController = new ProveedorController();
            
            if (!$id && $request_method === 'GET') {
                $proveedorController->index();
            } elseif (!$id && $request_method === 'POST') {
                $proveedorController->store();
            } elseif ($id && !$action && $request_method === 'PUT') {
                $proveedorController->update($id);
            } elseif ($id && !$action && $request_method === 'DELETE') {
                $proveedorController->delete($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
            
        // =====================================================
        // RUTAS DE CATEGORÍAS
        // =====================================================
        case 'categorias':
            require_once 'controllers/CategoriaController.php';
            $categoriaController = new CategoriaController();
            
            if (!$id && $request_method === 'GET') {
                $categoriaController->index();
            } elseif (!$id && $request_method === 'POST') {
                $categoriaController->store();
            } elseif ($id && !$action && $request_method === 'PUT') {
                $categoriaController->update($id);
            } elseif ($id && !$action && $request_method === 'DELETE') {
                $categoriaController->delete($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
            
        // =====================================================
        // RUTAS DE UNIDADES DE MEDIDA
        // =====================================================
        case 'unidades':
            require_once 'controllers/UnidadController.php';
            $unidadController = new UnidadController();
            
            if (!$id && $request_method === 'GET') {
                $unidadController->index();
            } elseif (!$id && $request_method === 'POST') {
                $unidadController->store();
            } elseif ($id && !$action && $request_method === 'PUT') {
                $unidadController->update($id);
            } elseif ($id && !$action && $request_method === 'DELETE') {
                $unidadController->delete($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        
        // =====================================================
        // RUTAS DE PRODUCTOS TERMINADOS
        // =====================================================
        case 'productos':
            require_once 'controllers/ProductoController.php';
            $productoController = new ProductoController();
            
            if (!$id && $request_method === 'GET' && $action === 'tipo') {
                // GET /productos/tipo/{tipo}
                $tipo = $_GET['tipo'] ?? '';
                $productoController->porTipo($tipo);
            } elseif (!$id && $request_method === 'GET') {
                $productoController->index();
            } elseif ($id && !$action && $request_method === 'GET') {
                $productoController->show($id);
            } elseif (!$id && $request_method === 'POST') {
                $productoController->store();
            } elseif ($id && !$action && $request_method === 'PUT') {
                $productoController->update($id);
            } elseif ($id && !$action && $request_method === 'DELETE') {
                $productoController->delete($id);
            } elseif ($id && $action === 'verificar-disponibilidad' && $request_method === 'POST') {
                $productoController->verificarDisponibilidad($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        
        // =====================================================
        // RUTAS DE PRODUCCION
        // =====================================================
        case 'produccion':
            require_once 'controllers/ProduccionController.php';
            $produccionController = new ProduccionController();
            $id = $id === 'a' ? null : $id;
            
            if (!$id && $request_method === 'GET' && $action === 'hoy') {
                $produccionController->hoy();
            } elseif (!$id && $request_method === 'GET' && $action === 'estadisticas') {
                $produccionController->estadisticas();
            } elseif (!$id && $request_method === 'POST' && $action === 'verificar') {
                $produccionController->verificar();
            } elseif (!$id && $request_method === 'GET') {
                $produccionController->index();
            } elseif ($id && !$action && $request_method === 'GET') {
                $produccionController->show($id);
            } elseif (!$id && $request_method === 'POST') {
                $produccionController->store();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        
        // =====================================================
        // RUTAS DE VENTAS
        // =====================================================
        case 'ventas':
            require_once 'controllers/VentaController.php';
            $ventaController = new VentaController();
            
            if (!$id && $request_method === 'GET' && $action === 'hoy') {
                $ventaController->hoy();
            } elseif (!$id && $request_method === 'GET' && $action === 'estadisticas') {
                $ventaController->estadisticas();
            } elseif (!$id && $request_method === 'POST' && $action === 'verificar') {
                $ventaController->verificar();
            } elseif (!$id && $request_method === 'GET') {
                $ventaController->index();
            } elseif ($id && !$action && $request_method === 'GET') {
                $ventaController->show($id);
            } elseif (!$id && $request_method === 'POST') {
                $ventaController->store();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        
        // =====================================================
        // RUTAS DE CLIENTES
        // =====================================================    
        case 'clientes':
            require_once 'controllers/ClienteController.php';
            $clienteController = new ClienteController();
            
            if (!$id && $request_method === 'GET' && $action === 'buscar') {
                $clienteController->buscar();
            } elseif (!$id && $request_method === 'GET') {
                $clienteController->index();
            } elseif (!$id && $request_method === 'POST') {
                $clienteController->store();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;

        // =====================================================
        // RUTAS DE PV (CAJA)
        // =====================================================    
        case 'caja':
            require_once 'controllers/CajaController.php';
            $cajaController = new CajaController();
            if($id === 'a'){
                $id = $action;
                $action = null;
            }else{
                $action = $id;
                $id = null;
            }
            //echo "id:".$id;
            if (!$id && $request_method === 'GET' && $action === 'actual') {
                $cajaController->actual();
            } elseif (!$id && $request_method === 'POST' && $action === 'abrir') {
                $cajaController->abrir();
            } elseif (!$id && $request_method === 'POST' && $action === 'cerrar') {
                $cajaController->cerrar();
            } elseif (!$id && $request_method === 'GET' && $action === 'historial') {
                $cajaController->historial();
            } elseif ($id && !$action && $request_method === 'GET') {
                $cajaController->show($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        // =====================================================
        // RUTAS DE USUARIOS
        // =====================================================  
        case 'usuarios':
            require_once 'controllers/UsuarioController.php';
            $usuarioController = new UsuarioController();
            
            if (!$id && $request_method === 'GET') {
                $usuarioController->index();
            } elseif ($id && !$action && $request_method === 'GET') {
                $usuarioController->show($id);
            } elseif (!$id && $request_method === 'POST') {
                $usuarioController->store();
            } elseif ($id && !$action && $request_method === 'PUT') {
                $usuarioController->update($id);
            } elseif ($id && !$action && $request_method === 'DELETE') {
                $usuarioController->delete($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        
        // =====================================================
        // RUTAS DE ROLES
        // =====================================================  
        case 'roles':
            require_once 'controllers/RolController.php';
            $rolController = new RolController();
            
            if (!$id && $request_method === 'GET') {
                $rolController->index();
            } elseif ($id && !$action && $request_method === 'GET') {
                $rolController->show($id);
            } elseif (!$id && $request_method === 'POST') {
                $rolController->store();
            } elseif ($id && !$action && $request_method === 'PUT') {
                $usuarioController->update($id);
            } elseif ($id && $action === 'permisos' && $request_method === 'PUT') {
                $rolController->actualizarPermisos($id);
            } elseif ($id && !$action && $request_method === 'DELETE') {
                $rolController->delete($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        
        // =====================================================
        // RUTAS DE PERMISOS
        // =====================================================  
        case 'permisos':
            require_once 'controllers/RolController.php';
            $rolController = new RolController();
            
            if (!$id && $request_method === 'GET') {
                $rolController->permisos();
            } elseif ($id && $request_method === 'GET') {
                //echo "ID:".$id;
                $rolController->permisoRol($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ruta no encontrada']);
            }
            break;
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor',
        'error' => $e->getMessage()
    ]);
}
