<?php
// =====================================================
// models/Usuario.php
// =====================================================

require_once 'config/Database.php';

class Usuario {
    private $conn;
    private $table = 'usuarios';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todos los usuarios
    public function getAll() {
        $query = "SELECT u.*, r.nombre_rol
                  FROM " . $this->table . " u
                  LEFT JOIN roles r ON u.id_rol = r.id_rol
                  ORDER BY u.nombre_completo";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener usuario por ID con permisos
    public function getById($id) {
        $query = "SELECT u.*, r.nombre_rol
                  FROM " . $this->table . " u
                  LEFT JOIN roles r ON u.id_rol = r.id_rol
                  WHERE u.id_usuario = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $usuario = $stmt->fetch();
        
        if ($usuario) {
            // Obtener permisos del usuario
            $usuario['permisos'] = $this->getPermisosUsuario($id);
        }
        
        return $usuario;
    }
    
    // Obtener permisos de un usuario
    public function getPermisosUsuario($id_usuario) {
        $query = "SELECT p.*
                  FROM permisos p
                  JOIN roles_permisos rp ON p.id_permiso = rp.id_permiso
                  JOIN usuarios u ON rp.id_rol = u.id_rol
                  WHERE u.id_usuario = :id_usuario AND p.activo = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Verificar si usuario tiene un permiso específico
    public function tienePermiso($id_usuario, $modulo, $accion) {
        $query = "SELECT COUNT(*) as tiene
                  FROM permisos p
                  JOIN roles_permisos rp ON p.id_permiso = rp.id_permiso
                  JOIN usuarios u ON rp.id_rol = u.id_rol
                  WHERE u.id_usuario = :id_usuario 
                  AND p.modulo = :modulo 
                  AND p.accion = :accion
                  AND p.activo = 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->bindParam(':modulo', $modulo);
        $stmt->bindParam(':accion', $accion);
        $stmt->execute();
        $result = $stmt->fetch();
        
        return $result['tiene'] > 0;
    }
    
    // Crear usuario
    public function create($datos) {
        try {
            // Verificar si username o email ya existen
            $query = "SELECT id_usuario FROM " . $this->table . " 
                      WHERE username = :username OR email = :email";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $datos['username']);
            $stmt->bindParam(':email', $datos['email']);
            $stmt->execute();
            
            if ($stmt->fetch()) {
                return [
                    'success' => false,
                    'message' => 'El usuario o email ya existe'
                ];
            }
            
            // Hashear contraseña
            $password_hash = password_hash($datos['password'], PASSWORD_BCRYPT);
            
            $query = "INSERT INTO " . $this->table . " 
                      (nombre_completo, email, username, password_hash, id_rol)
                      VALUES (:nombre, :email, :username, :password, :id_rol)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nombre', $datos['nombre_completo']);
            $stmt->bindParam(':email', $datos['email']);
            $stmt->bindParam(':username', $datos['username']);
            $stmt->bindParam(':password', $password_hash);
            $stmt->bindParam(':id_rol', $datos['id_rol']);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'id' => $this->conn->lastInsertId()
                ];
            }
            
            return [
                'success' => false,
                'message' => 'Error al crear usuario'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
    
    // Actualizar usuario
    public function update($id, $datos) {
        try {
            $query = "UPDATE " . $this->table . " 
                      SET nombre_completo = :nombre,
                          email = :email,
                          username = :username,
                          id_rol = :id_rol";
            
            // Si se proporciona nueva contraseña
            if (!empty($datos['password'])) {
                $query .= ", password_hash = :password";
            }
            
            $query .= " WHERE id_usuario = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nombre', $datos['nombre_completo']);
            $stmt->bindParam(':email', $datos['email']);
            $stmt->bindParam(':username', $datos['username']);
            $stmt->bindParam(':id_rol', $datos['id_rol']);
            $stmt->bindParam(':id', $id);
            
            if (!empty($datos['password'])) {
                $password_hash = password_hash($datos['password'], PASSWORD_BCRYPT);
                $stmt->bindParam(':password', $password_hash);
            }
            
            return $stmt->execute();
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    // Desactivar usuario
    public function delete($id) {
        // No permitir eliminar al usuario admin (id=1)
        if ($id == 1) {
            return false;
        }
        
        $query = "UPDATE " . $this->table . " SET activo = 0 WHERE id_usuario = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
    
    // Activar usuario
    public function activate($id) {
        $query = "UPDATE " . $this->table . " SET activo = 1 WHERE id_usuario = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
?>