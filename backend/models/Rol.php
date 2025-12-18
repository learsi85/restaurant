<?php
// =====================================================
// models/Rol.php
// =====================================================
require_once 'config/Database.php';

class Rol {
    private $conn;
    private $table = 'roles';
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    // Obtener todos los roles
    public function getAll() {
        $query = "SELECT * FROM " . $this->table . " WHERE activo = 1 ORDER BY nombre_rol";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Obtener rol con permisos
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id_rol = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $rol = $stmt->fetch();
        
        if ($rol) {
            $rol['permisos'] = $this->getPermisosRol($id);
        }
        
        return $rol;
    }
    
    // Obtener permisos de un rol
    public function getPermisosRol($id_rol) {
        $query = "SELECT p.*
                  FROM permisos p
                  JOIN roles_permisos rp ON p.id_permiso = rp.id_permiso
                  WHERE rp.id_rol = :id_rol";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_rol', $id_rol);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    // Crear rol
    public function create($datos) {
        $query = "INSERT INTO " . $this->table . " (nombre_rol, descripcion, activo)
                  VALUES (:nombre, :descripcion, :activo)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $datos['nombre_rol']);
        $stmt->bindParam(':descripcion', $datos['descripcion']);
        $stmt->bindParam(':activo', $datos['activo']);
        
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Actualizar rol
    public function update($id, $datos) {
        try {
            $query = "UPDATE " . $this->table . " 
                      SET nombre_rol = :nombre,
                          descripcion = :descripcion,
                          activo = :activo
                      WHERE id_rol = :id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':nombre', $datos['nombre_rol']);
            $stmt->bindParam(':descripcion', $datos['descripcion']);
            $stmt->bindParam(':activo', $datos['activo']);
            $stmt->bindParam(':id', $id);
            
            return $stmt->execute();
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    // Actualizar permisos de un rol
    public function actualizarPermisos($id_rol, $permisos) {
        try {
            $this->conn->beginTransaction();
            //var_dump($permisos);
            
            // Eliminar permisos actuales
            $query = "DELETE FROM roles_permisos WHERE id_rol = :id_rol";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id_rol', $id_rol);
            $stmt->execute();
            
            //Insertar nuevos permisos
            if (!empty($permisos)) {
                $query = "INSERT INTO roles_permisos (id_rol, id_permiso) VALUES (:id_rol, :id_permiso)";
                $stmt = $this->conn->prepare($query);
                
                foreach ($permisos as $perAux) {
                    //echo $perAux->id_permiso. " | ";
                    $stmt->bindParam(':id_rol', $id_rol);
                    $stmt->bindParam(':id_permiso', $perAux->id_permiso);
                    $stmt->execute();
                }
            }
            
            $this->conn->commit();
            return true; 
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    // Desactivar rol
    public function delete($id) {
        // No permitir eliminar el rol admin (id=1)
        if ($id == 1) {
            return false;
        }
        
        $query = "UPDATE " . $this->table . " SET activo = 0 WHERE id_rol = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}

?>