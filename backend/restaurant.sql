-- phpMyAdmin SQL Dump
-- version 4.8.4
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-12-2025 a las 21:06:19
-- Versión del servidor: 10.1.37-MariaDB
-- Versión de PHP: 7.2.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `restaurant`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `caja`
--

CREATE TABLE `caja` (
  `id_caja` int(11) NOT NULL,
  `fecha_apertura` datetime NOT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `monto_inicial` decimal(10,2) NOT NULL,
  `monto_final` decimal(10,2) DEFAULT NULL,
  `total_ventas` decimal(10,2) DEFAULT '0.00',
  `total_gastos` decimal(10,2) DEFAULT '0.00',
  `diferencia` decimal(10,2) DEFAULT NULL,
  `id_usuario_apertura` int(11) NOT NULL,
  `id_usuario_cierre` int(11) DEFAULT NULL,
  `estado` enum('abierta','cerrada') COLLATE utf8mb4_unicode_ci DEFAULT 'abierta',
  `notas` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias_insumos`
--

CREATE TABLE `categorias_insumos` (
  `id_categoria` int(11) NOT NULL,
  `nombre_categoria` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias_insumos`
--

INSERT INTO `categorias_insumos` (`id_categoria`, `nombre_categoria`, `descripcion`, `activo`) VALUES
(1, 'Proteínas', 'Pollo crudo y carnes', 1),
(2, 'Condimentos', 'Especias y sazonadores', 1),
(3, 'Guarniciones', 'Arroz, frijol y acompañamientos', 1),
(4, 'Salsas', 'Salsas y aderezos', 1),
(5, 'Empaque', 'Material de empaque y envase', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `nombre_cliente` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras`
--

CREATE TABLE `compras` (
  `id_compra` int(11) NOT NULL,
  `numero_compra` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `fecha_compra` datetime NOT NULL,
  `total_compra` decimal(10,2) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('pendiente','recibida','cancelada') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_compras`
--

CREATE TABLE `detalle_compras` (
  `id_detalle_compra` int(11) NOT NULL,
  `id_compra` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Disparadores `detalle_compras`
--
DELIMITER $$
CREATE TRIGGER `after_detalle_compra_insert` AFTER INSERT ON `detalle_compras` FOR EACH ROW BEGIN
    DECLARE stock_prev DECIMAL(10,2);
    
    -- Obtener stock actual
    SELECT stock_actual INTO stock_prev FROM insumos WHERE id_insumo = NEW.id_insumo;
    
    -- Actualizar stock del insumo
    UPDATE insumos 
    SET stock_actual = stock_actual + NEW.cantidad,
        precio_promedio = ((stock_actual * precio_promedio) + (NEW.cantidad * NEW.precio_unitario)) / (stock_actual + NEW.cantidad)
    WHERE id_insumo = NEW.id_insumo;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id, id_usuario)
    VALUES (NEW.id_insumo, 'entrada', NEW.cantidad, stock_prev, stock_prev + NEW.cantidad, 'Compra', NEW.id_compra, 
            (SELECT id_usuario FROM compras WHERE id_compra = NEW.id_compra));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_ventas`
--

CREATE TABLE `detalle_ventas` (
  `id_detalle_venta` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Disparadores `detalle_ventas`
--
DELIMITER $$
CREATE TRIGGER `after_detalle_venta_insert` AFTER INSERT ON `detalle_ventas` FOR EACH ROW BEGIN
    UPDATE productos_terminados 
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id_producto = NEW.id_producto;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `insumos`
--

CREATE TABLE `insumos` (
  `id_insumo` int(11) NOT NULL,
  `nombre_insumo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `id_categoria` int(11) NOT NULL,
  `id_unidad` int(11) NOT NULL,
  `stock_actual` decimal(10,2) DEFAULT '0.00',
  `stock_minimo` decimal(10,2) DEFAULT '0.00',
  `precio_promedio` decimal(10,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodo_pago`
--

CREATE TABLE `metodo_pago` (
  `id_venta` int(11) NOT NULL,
  `metodo` enum('efectivo','tarjeta','transferencia') COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `numero_autorizacion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `tipo_movimiento` enum('entrada','salida','ajuste') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `stock_anterior` decimal(10,2) NOT NULL,
  `stock_nuevo` decimal(10,2) NOT NULL,
  `motivo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_id` int(11) DEFAULT NULL COMMENT 'ID de compra, producción o ajuste',
  `id_usuario` int(11) NOT NULL,
  `fecha_movimiento` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id_permiso` int(11) NOT NULL,
  `nombre_permiso` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `modulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id_permiso`, `nombre_permiso`, `descripcion`, `modulo`, `accion`, `activo`) VALUES
(1, 'inventario_ver', 'Ver inventario de insumos', 'inventario', 'ver', 1),
(2, 'inventario_crear', 'Crear nuevos insumos', 'inventario', 'crear', 1),
(3, 'inventario_editar', 'Editar insumos existentes', 'inventario', 'editar', 1),
(4, 'inventario_eliminar', 'Eliminar insumos', 'inventario', 'eliminar', 1),
(5, 'inventario_ajustar', 'Ajustar stock de insumos', 'inventario', 'ajustar', 1),
(6, 'compras_ver', 'Ver historial de compras', 'compras', 'ver', 1),
(7, 'compras_crear', 'Registrar nuevas compras', 'compras', 'crear', 1),
(8, 'compras_editar', 'Editar compras', 'compras', 'editar', 1),
(9, 'productos_ver', 'Ver productos terminados', 'productos', 'ver', 1),
(10, 'productos_crear', 'Crear productos', 'productos', 'crear', 1),
(11, 'productos_editar', 'Editar productos y recetas', 'productos', 'editar', 1),
(12, 'productos_eliminar', 'Eliminar productos', 'productos', 'eliminar', 1),
(13, 'produccion_ver', 'Ver historial de producción', 'produccion', 'ver', 1),
(14, 'produccion_crear', 'Registrar producción', 'produccion', 'crear', 1),
(15, 'ventas_ver', 'Ver historial de ventas', 'ventas', 'ver', 1),
(16, 'ventas_crear', 'Realizar ventas', 'ventas', 'crear', 1),
(17, 'caja_ver', 'Ver estado de caja', 'caja', 'ver', 1),
(18, 'caja_abrir', 'Abrir caja', 'caja', 'abrir', 1),
(19, 'caja_cerrar', 'Cerrar caja', 'caja', 'cerrar', 1),
(20, 'caja_historial', 'Ver historial de cajas', 'caja', 'historial', 1),
(21, 'catalogos_ver', 'Ver catálogos', 'catalogos', 'ver', 1),
(22, 'catalogos_crear', 'Crear en catálogos', 'catalogos', 'crear', 1),
(23, 'catalogos_editar', 'Editar catálogos', 'catalogos', 'editar', 1),
(24, 'catalogos_eliminar', 'Eliminar de catálogos', 'catalogos', 'eliminar', 1),
(25, 'usuarios_ver', 'Ver usuarios', 'usuarios', 'ver', 1),
(26, 'usuarios_crear', 'Crear usuarios', 'usuarios', 'crear', 1),
(27, 'usuarios_editar', 'Editar usuarios', 'usuarios', 'editar', 1),
(28, 'usuarios_eliminar', 'Eliminar usuarios', 'usuarios', 'eliminar', 1),
(29, 'usuarios_permisos', 'Gestionar permisos', 'usuarios', 'permisos', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `produccion`
--

CREATE TABLE `produccion` (
  `id_produccion` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad_producida` int(11) NOT NULL,
  `fecha_produccion` datetime NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `costo_produccion` decimal(10,2) DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Disparadores `produccion`
--
DELIMITER $$
CREATE TRIGGER `after_produccion_insert` AFTER INSERT ON `produccion` FOR EACH ROW BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id_insumo INT;
    DECLARE v_cantidad_necesaria DECIMAL(10,2);
    DECLARE v_stock_prev DECIMAL(10,2);
    DECLARE v_cantidad_total DECIMAL(10,2);
    
    DECLARE cur CURSOR FOR 
        SELECT id_insumo, cantidad_necesaria 
        FROM recetas 
        WHERE id_producto = NEW.id_producto;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO v_id_insumo, v_cantidad_necesaria;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET v_cantidad_total = v_cantidad_necesaria * NEW.cantidad_producida;
        SELECT stock_actual INTO v_stock_prev FROM insumos WHERE id_insumo = v_id_insumo;
        
        -- Descontar del inventario
        UPDATE insumos 
        SET stock_actual = stock_actual - v_cantidad_total
        WHERE id_insumo = v_id_insumo;
        
        -- Registrar movimiento
        INSERT INTO movimientos_inventario (id_insumo, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id, id_usuario)
        VALUES (v_id_insumo, 'salida', v_cantidad_total, v_stock_prev, v_stock_prev - v_cantidad_total, 'Producción', NEW.id_produccion, NEW.id_usuario);
    END LOOP;
    
    CLOSE cur;
    
    -- Actualizar stock de producto terminado
    UPDATE productos_terminados 
    SET stock_actual = stock_actual + NEW.cantidad_producida
    WHERE id_producto = NEW.id_producto;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos_terminados`
--

CREATE TABLE `productos_terminados` (
  `id_producto` int(11) NOT NULL,
  `nombre_producto` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `tipo_producto` enum('pollo','guarnicion','combo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `stock_actual` int(11) DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL,
  `nombre_proveedor` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contacto` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recetas`
--

CREATE TABLE `recetas` (
  `id_receta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `id_insumo` int(11) NOT NULL,
  `cantidad_necesaria` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`, `descripcion`, `activo`, `fecha_creacion`) VALUES
(1, 'Administrador', 'Acceso total al sistema', 1, '2025-12-02 21:52:30'),
(2, 'Cajero', 'Gestión de ventas y caja', 1, '2025-12-02 21:52:30'),
(3, 'Cocinero', 'Gestión de producción e inventario de cocina', 1, '2025-12-02 21:52:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles_permisos`
--

CREATE TABLE `roles_permisos` (
  `id_rol` int(11) NOT NULL,
  `id_permiso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles_permisos`
--

INSERT INTO `roles_permisos` (`id_rol`, `id_permiso`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(2, 9),
(2, 15),
(2, 16),
(2, 17),
(2, 18),
(2, 19),
(3, 1),
(3, 5),
(3, 9),
(3, 13),
(3, 14);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_medida`
--

CREATE TABLE `unidades_medida` (
  `id_unidad` int(11) NOT NULL,
  `nombre_unidad` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abreviatura` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('peso','volumen','unidad') COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `unidades_medida`
--

INSERT INTO `unidades_medida` (`id_unidad`, `nombre_unidad`, `abreviatura`, `tipo`) VALUES
(1, 'Kilogramo', 'kg', 'peso'),
(2, 'Gramo', 'g', 'peso'),
(3, 'Litro', 'L', 'volumen'),
(4, 'Mililitro', 'ml', 'volumen'),
(5, 'Unidad', 'ud', 'unidad'),
(6, 'Pieza', 'pz', 'unidad');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre_completo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_rol` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre_completo`, `email`, `username`, `password_hash`, `id_rol`, `activo`, `fecha_creacion`, `ultimo_acceso`) VALUES
(1, 'Administrador del Sistema', 'admin@pollosasados.com', 'admin', '$2y$10$zZ48ADHLbF/goLbbPlIpd.w1N7JikqBVddasCyeEYTHCGznc6ucK6', 1, 1, '2025-12-02 21:52:30', '2025-12-18 19:37:16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `numero_venta` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_venta` datetime NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT '0.00',
  `total_venta` decimal(10,2) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','transferencia') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_usuario` int(11) NOT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_inventario_alertas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_inventario_alertas` (
`id_insumo` int(11)
,`nombre_insumo` varchar(100)
,`nombre_categoria` varchar(50)
,`stock_actual` decimal(10,2)
,`stock_minimo` decimal(10,2)
,`unidad` varchar(10)
,`precio_promedio` decimal(10,2)
,`valor_inventario` decimal(20,4)
,`estado_stock` varchar(7)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_productos_mas_vendidos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_productos_mas_vendidos` (
`nombre_producto` varchar(100)
,`cantidad_vendida` decimal(32,0)
,`total_ventas` decimal(32,2)
,`numero_ventas` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_ventas_dia`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `v_ventas_dia` (
`fecha` date
,`total_ventas` bigint(21)
,`monto_total` decimal(32,2)
,`vendedor` varchar(100)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `v_inventario_alertas`
--
DROP TABLE IF EXISTS `v_inventario_alertas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_inventario_alertas`  AS  select `i`.`id_insumo` AS `id_insumo`,`i`.`nombre_insumo` AS `nombre_insumo`,`c`.`nombre_categoria` AS `nombre_categoria`,`i`.`stock_actual` AS `stock_actual`,`i`.`stock_minimo` AS `stock_minimo`,`u`.`abreviatura` AS `unidad`,`i`.`precio_promedio` AS `precio_promedio`,(`i`.`stock_actual` * `i`.`precio_promedio`) AS `valor_inventario`,(case when (`i`.`stock_actual` <= `i`.`stock_minimo`) then 'CRÍTICO' when (`i`.`stock_actual` <= (`i`.`stock_minimo` * 1.5)) then 'BAJO' else 'NORMAL' end) AS `estado_stock` from ((`insumos` `i` join `categorias_insumos` `c` on((`i`.`id_categoria` = `c`.`id_categoria`))) join `unidades_medida` `u` on((`i`.`id_unidad` = `u`.`id_unidad`))) where (`i`.`activo` = 1) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_productos_mas_vendidos`
--
DROP TABLE IF EXISTS `v_productos_mas_vendidos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_productos_mas_vendidos`  AS  select `p`.`nombre_producto` AS `nombre_producto`,sum(`dv`.`cantidad`) AS `cantidad_vendida`,sum(`dv`.`subtotal`) AS `total_ventas`,count(distinct `dv`.`id_venta`) AS `numero_ventas` from (`detalle_ventas` `dv` join `productos_terminados` `p` on((`dv`.`id_producto` = `p`.`id_producto`))) group by `p`.`id_producto`,`p`.`nombre_producto` order by sum(`dv`.`cantidad`) desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_ventas_dia`
--
DROP TABLE IF EXISTS `v_ventas_dia`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_ventas_dia`  AS  select cast(`v`.`fecha_venta` as date) AS `fecha`,count(`v`.`id_venta`) AS `total_ventas`,sum(`v`.`total_venta`) AS `monto_total`,`u`.`nombre_completo` AS `vendedor` from (`ventas` `v` join `usuarios` `u` on((`v`.`id_usuario` = `u`.`id_usuario`))) where (cast(`v`.`fecha_venta` as date) = curdate()) group by cast(`v`.`fecha_venta` as date),`u`.`nombre_completo` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `caja`
--
ALTER TABLE `caja`
  ADD PRIMARY KEY (`id_caja`),
  ADD KEY `id_usuario_apertura` (`id_usuario_apertura`),
  ADD KEY `id_usuario_cierre` (`id_usuario_cierre`),
  ADD KEY `idx_caja_fecha` (`fecha_apertura`);

--
-- Indices de la tabla `categorias_insumos`
--
ALTER TABLE `categorias_insumos`
  ADD PRIMARY KEY (`id_categoria`),
  ADD UNIQUE KEY `nombre_categoria` (`nombre_categoria`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `compras`
--
ALTER TABLE `compras`
  ADD PRIMARY KEY (`id_compra`),
  ADD UNIQUE KEY `numero_compra` (`numero_compra`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `idx_compras_proveedor` (`id_proveedor`),
  ADD KEY `idx_compras_fecha` (`fecha_compra`);

--
-- Indices de la tabla `detalle_compras`
--
ALTER TABLE `detalle_compras`
  ADD PRIMARY KEY (`id_detalle_compra`),
  ADD KEY `id_compra` (`id_compra`),
  ADD KEY `id_insumo` (`id_insumo`);

--
-- Indices de la tabla `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  ADD PRIMARY KEY (`id_detalle_venta`),
  ADD KEY `id_venta` (`id_venta`),
  ADD KEY `id_producto` (`id_producto`);

--
-- Indices de la tabla `insumos`
--
ALTER TABLE `insumos`
  ADD PRIMARY KEY (`id_insumo`),
  ADD KEY `id_unidad` (`id_unidad`),
  ADD KEY `idx_insumos_categoria` (`id_categoria`);

--
-- Indices de la tabla `metodo_pago`
--
ALTER TABLE `metodo_pago`
  ADD KEY `id_venta` (`id_venta`) USING BTREE;

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `id_insumo` (`id_insumo`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `idx_movimientos_fecha` (`fecha_movimiento`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id_permiso`),
  ADD UNIQUE KEY `nombre_permiso` (`nombre_permiso`),
  ADD UNIQUE KEY `unique_modulo_accion` (`modulo`,`accion`);

--
-- Indices de la tabla `produccion`
--
ALTER TABLE `produccion`
  ADD PRIMARY KEY (`id_produccion`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `productos_terminados`
--
ALTER TABLE `productos_terminados`
  ADD PRIMARY KEY (`id_producto`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id_proveedor`);

--
-- Indices de la tabla `recetas`
--
ALTER TABLE `recetas`
  ADD PRIMARY KEY (`id_receta`),
  ADD UNIQUE KEY `unique_receta` (`id_producto`,`id_insumo`),
  ADD KEY `id_insumo` (`id_insumo`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre_rol` (`nombre_rol`);

--
-- Indices de la tabla `roles_permisos`
--
ALTER TABLE `roles_permisos`
  ADD PRIMARY KEY (`id_rol`,`id_permiso`),
  ADD KEY `id_permiso` (`id_permiso`);

--
-- Indices de la tabla `unidades_medida`
--
ALTER TABLE `unidades_medida`
  ADD PRIMARY KEY (`id_unidad`),
  ADD UNIQUE KEY `nombre_unidad` (`nombre_unidad`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_usuarios_rol` (`id_rol`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`),
  ADD UNIQUE KEY `numero_venta` (`numero_venta`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `idx_ventas_fecha` (`fecha_venta`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `caja`
--
ALTER TABLE `caja`
  MODIFY `id_caja` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias_insumos`
--
ALTER TABLE `categorias_insumos`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `compras`
--
ALTER TABLE `compras`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_compras`
--
ALTER TABLE `detalle_compras`
  MODIFY `id_detalle_compra` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  MODIFY `id_detalle_venta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `insumos`
--
ALTER TABLE `insumos`
  MODIFY `id_insumo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id_permiso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `produccion`
--
ALTER TABLE `produccion`
  MODIFY `id_produccion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos_terminados`
--
ALTER TABLE `productos_terminados`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recetas`
--
ALTER TABLE `recetas`
  MODIFY `id_receta` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `unidades_medida`
--
ALTER TABLE `unidades_medida`
  MODIFY `id_unidad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `caja`
--
ALTER TABLE `caja`
  ADD CONSTRAINT `caja_ibfk_1` FOREIGN KEY (`id_usuario_apertura`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `caja_ibfk_2` FOREIGN KEY (`id_usuario_cierre`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `compras`
--
ALTER TABLE `compras`
  ADD CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  ADD CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `detalle_compras`
--
ALTER TABLE `detalle_compras`
  ADD CONSTRAINT `detalle_compras_ibfk_1` FOREIGN KEY (`id_compra`) REFERENCES `compras` (`id_compra`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_compras_ibfk_2` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`);

--
-- Filtros para la tabla `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  ADD CONSTRAINT `detalle_ventas_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE,
  ADD CONSTRAINT `detalle_ventas_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos_terminados` (`id_producto`);

--
-- Filtros para la tabla `insumos`
--
ALTER TABLE `insumos`
  ADD CONSTRAINT `insumos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_insumos` (`id_categoria`),
  ADD CONSTRAINT `insumos_ibfk_2` FOREIGN KEY (`id_unidad`) REFERENCES `unidades_medida` (`id_unidad`);

--
-- Filtros para la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `produccion`
--
ALTER TABLE `produccion`
  ADD CONSTRAINT `produccion_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos_terminados` (`id_producto`),
  ADD CONSTRAINT `produccion_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `recetas`
--
ALTER TABLE `recetas`
  ADD CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `productos_terminados` (`id_producto`) ON DELETE CASCADE,
  ADD CONSTRAINT `recetas_ibfk_2` FOREIGN KEY (`id_insumo`) REFERENCES `insumos` (`id_insumo`);

--
-- Filtros para la tabla `roles_permisos`
--
ALTER TABLE `roles_permisos`
  ADD CONSTRAINT `roles_permisos_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE CASCADE,
  ADD CONSTRAINT `roles_permisos_ibfk_2` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id_permiso`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
