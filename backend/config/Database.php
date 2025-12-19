<?php
// config/Database.php
// Configuración de conexión a la base de datos

class Database {
    private $host = "localhost";
    // LOCAL
    // private $db_name = "restaurant";
    // private $username = "root";
    // private $password = "";
    // BLUEHOST
    private $db_name = "acciont1_restaurant";
    private $username = "acciont1_restaurant";
    private $password = "25.PollosAT";
    private $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error de conexión: " . $e->getMessage();
        }
        
        return $this->conn;
    }
}