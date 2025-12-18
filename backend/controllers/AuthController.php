<?php
// =====================================================
// controllers/AuthController.php
// Controlador para autenticación de usuarios
// =====================================================

require_once 'config/Database.php';
require_once 'config/jwt.php';
require_once 'utils/Response.php';
require_once 'middleware/AuthMiddleware.php';

class AuthController {
    private $db;
    private $jwt;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->jwt = new JWT();
    }
    
    // POST /api/auth/login
    public function login() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->username) || !isset($data->password)) {
            Response::error("Usuario y contraseña requeridos");
        }
        
        $query = "SELECT u.*, r.nombre_rol 
                  FROM usuarios u
                  JOIN roles r ON u.id_rol = r.id_rol
                  WHERE u.username = :username AND u.activo = 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $data->username);
        $stmt->execute();
        
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::error("Credenciales inválidas", 401);
        }
        
        // Verificar contraseña
        if (!password_verify($data->password, $user['password_hash'])) {
            Response::error("Credenciales inválidas", 401);
        }
        
        // Actualizar último acceso
        $updateQuery = "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = :id";
        $updateStmt = $this->db->prepare($updateQuery);
        $updateStmt->bindParam(':id', $user['id_usuario']);
        $updateStmt->execute();

        $query = "SELECT CONCAT_WS('.',p.modulo,p.accion) AS permisos
                  FROM usuarios u 
                  JOIN roles_permisos rp ON u.id_rol = rp.id_rol 
                  JOIN permisos p ON rp.id_permiso = p.id_permiso 
                  WHERE u.username = :username AND u.activo = 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $data->username);
        $stmt->execute();
        
        $permisos = $stmt->fetchAll();

        // Generar token
        $tokenData = [
            'id_usuario' => $user['id_usuario'],
            'username' => $user['username'],
            'nombre_completo' => $user['nombre_completo'],
            'email' => $user['email'],
            'rol' => $user['nombre_rol'],
            'id_rol' => $user['id_rol'],
            'permisos' => $permisos
        ];
        
        $token = $this->jwt->encode($tokenData);
        
        Response::success("Login exitoso", [
            'token' => $token,
            'user' => $tokenData,
            'permisos' => $permisos
        ]);
    }
    
    // POST /api/auth/register
    public function register() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->username) || !isset($data->password) || !isset($data->nombre_completo) || !isset($data->email)) {
            Response::error("Datos incompletos");
        }
        
        // Verificar si el usuario ya existe
        $checkQuery = "SELECT id_usuario FROM usuarios WHERE username = :username OR email = :email";
        $checkStmt = $this->db->prepare($checkQuery);
        $checkStmt->bindParam(':username', $data->username);
        $checkStmt->bindParam(':email', $data->email);
        $checkStmt->execute();
        
        if ($checkStmt->fetch()) {
            Response::error("El usuario o email ya existe");
        }
        
        // Hash de contraseña
        $passwordHash = password_hash($data->password, PASSWORD_BCRYPT);
        
        // Rol por defecto (Cajero)
        $id_rol = $data->id_rol ?? 2;
        
        $query = "INSERT INTO usuarios (nombre_completo, email, username, password_hash, id_rol)
                  VALUES (:nombre, :email, :username, :password, :id_rol)";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':nombre', $data->nombre_completo);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':username', $data->username);
        $stmt->bindParam(':password', $passwordHash);
        $stmt->bindParam(':id_rol', $id_rol);
        
        if ($stmt->execute()) {
            Response::success("Usuario registrado correctamente", ['id' => $this->db->lastInsertId()]);
        } else {
            Response::error("Error al registrar usuario", 500);
        }
    }
    
    // GET /api/auth/me
    public function me() {
        $auth = new AuthMiddleware();
        $user = $auth->verify();
        
        Response::success("Datos del usuario", $user);
    }
    
    // POST /api/auth/logout
    public function logout() {
        // En una implementación con JWT, el logout se maneja del lado del cliente
        // eliminando el token. Aquí solo confirmamos la acción
        Response::success("Logout exitoso");
    }
}
?>