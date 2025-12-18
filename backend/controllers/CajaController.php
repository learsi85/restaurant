<?php
// =====================================================
// controllers/CajaController.php
// Controlador para endpoints de caja
// =====================================================

require_once 'models/Caja.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class CajaController {
    private $auth;
    
    public function __construct() {
        $this->auth = new AuthMiddleware();
    }
    
    // GET /api/caja/actual - Obtener estado de caja actual
    public function actual() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'caja.ver');
        
        $caja = new Caja();
        $cajaAbierta = $caja->getCajaAbierta();
        
        if ($cajaAbierta) {
            $resumen = $caja->getResumenCajaAbierta();
            Response::success("Caja abierta", $resumen);
        } else {
            Response::success("No hay caja abierta", ['caja_abierta' => false]);
        }
    }
    
    // POST /api/caja/abrir - Abrir caja
    public function abrir() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'caja.abrir');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->monto_inicial) || $data->monto_inicial < 0) {
            Response::error("Monto inicial inválido");
        }
        
        $caja = new Caja();
        $caja->monto_inicial = $data->monto_inicial;
        $caja->id_usuario_apertura = $user->id_usuario;
        $caja->notas = $data->notas ?? '';
        
        $resultado = $caja->abrir();
        
        if ($resultado['success']) {
            Response::success($resultado['message'], $resultado);
        } else {
            Response::error($resultado['message'], 400, $resultado);
        }
    }
    
    // POST /api/caja/cerrar - Cerrar caja
    public function cerrar() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'caja.cerrar');
        
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->monto_final) || $data->monto_final < 0) {
            Response::error("Monto final inválido");
        }
        
        $caja = new Caja();
        $caja->monto_final = $data->monto_final;
        $caja->id_usuario_cierre = $user->id_usuario;
        $caja->notas = $data->notas ?? '';
        
        $resultado = $caja->cerrar();
        
        if ($resultado['success']) {
            Response::success($resultado['message'], $resultado);
        } else {
            Response::error($resultado['message'], 400);
        }
    }
    
    // GET /api/caja/historial - Obtener historial de cajas
    public function historial() {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'caja.historial');
        
        $limite = $_GET['limite'] ?? 30;
        
        $caja = new Caja();
        $result = $caja->getHistorial($limite);
        
        Response::success("Historial obtenido correctamente", $result);
    }
    
    // GET /api/caja/:id - Obtener detalle de una caja
    public function show($id) {
        $user = $this->auth->verify();
        $this->auth->checkPermisos($user, 'caja.ver');
        
        $caja = new Caja();
        $result = $caja->getDetalleCaja($id);
        
        if (!$result) {
            Response::notFound("Caja no encontrada");
        }
        
        Response::success("Detalle de caja obtenido", $result);
    }
}
?>