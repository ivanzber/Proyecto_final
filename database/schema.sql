-- ============================================
-- Sistema de Recorrido Virtual Campus UDEC
-- Base de Datos: MySQL 8.0+
-- Esquema principal de la aplicación
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS campus_virtual
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE campus_virtual;

-- ============================================
-- LIMPIEZA DE TABLAS (Orden inverso por dependencias)
-- ============================================
DROP VIEW IF EXISTS v_statistics_summary;
DROP VIEW IF EXISTS v_points_with_area;
DROP VIEW IF EXISTS v_users_with_roles;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS statistics;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS points_of_interest;
DROP TABLE IF EXISTS subadmin_areas;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- ============================================
-- TABLA: roles
-- Catálogo de roles del sistema
-- ============================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'USER, ADMIN, SUBADMIN',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: users
-- Usuarios del sistema con autenticación
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_role (role_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: areas
-- Áreas del campus (facultades, edificios, departamentos)
-- ============================================
CREATE TABLE areas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código identificador único',
    description TEXT,
    parent_area_id INT NULL COMMENT 'Para jerarquía de áreas',
    coordinates JSON COMMENT 'Coordenadas para el modelo 3D (x,y,z)',
    metadata JSON COMMENT 'Información adicional configurable',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_area_id) REFERENCES areas(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_parent (parent_area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: subadmin_areas
-- Asignación de subadministradores a áreas específicas
-- ============================================
CREATE TABLE subadmin_areas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    area_id INT NOT NULL,
    assigned_by INT NOT NULL COMMENT 'ID del admin que asignó',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_user_area (user_id, area_id),
    INDEX idx_user (user_id),
    INDEX idx_area (area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: points_of_interest
-- Puntos de interés en el recorrido virtual 3D
-- ============================================
CREATE TABLE points_of_interest (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    area_id INT NOT NULL,
    category VARCHAR(100) COMMENT 'Edificio, Monumento, Servicio, etc.',
    coordinates JSON NOT NULL COMMENT 'Posición 3D: {x, y, z}',
    icon_url VARCHAR(500) COMMENT 'URL del icono para el punto',
    images JSON COMMENT 'Array de URLs de imágenes',
    additional_info JSON COMMENT 'Horarios, contactos, enlaces, etc.',
    is_visible BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0 COMMENT 'Orden de visualización',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_area (area_id),
    INDEX idx_visible (is_visible),
    INDEX idx_category (category),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: events
-- Eventos institucionales
-- ============================================
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    area_id INT NULL COMMENT 'Área relacionada (opcional)',
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    image_url VARCHAR(500),
    category VARCHAR(100) COMMENT 'Académico, Cultural, Deportivo, etc.',
    is_published BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_date (event_date),
    INDEX idx_published (is_published),
    INDEX idx_area (area_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: news
-- Noticias y anuncios institucionales
-- ============================================
CREATE TABLE news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(500),
    content TEXT NOT NULL,
    area_id INT NULL,
    featured_image VARCHAR(500),
    category VARCHAR(100) COMMENT 'Noticia, Anuncio, Comunicado, etc.',
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE COMMENT 'Destacada en portada',
    publish_date TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_published (is_published),
    INDEX idx_featured (is_featured),
    INDEX idx_area (area_id),
    INDEX idx_category (category),
    INDEX idx_publish_date (publish_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: statistics
-- Métricas de uso y navegación
-- ============================================
CREATE TABLE statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(100) NOT NULL COMMENT 'page_view, point_click, area_visit, etc.',
    entity_type VARCHAR(100) COMMENT 'point_of_interest, area, event, news',
    entity_id INT COMMENT 'ID de la entidad relacionada',
    user_id INT NULL COMMENT 'Usuario si está autenticado',
    session_id VARCHAR(255) COMMENT 'ID de sesión para usuarios anónimos',
    metadata JSON COMMENT 'Datos adicionales del evento',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: audit_logs
-- Registro de auditoría de acciones del sistema
-- ============================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, etc.',
    entity_type VARCHAR(100) COMMENT 'users, points_of_interest, events, etc.',
    entity_id INT COMMENT 'ID de la entidad afectada',
    old_values JSON COMMENT 'Valores anteriores (para UPDATE/DELETE)',
    new_values JSON COMMENT 'Valores nuevos (para CREATE/UPDATE)',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de usuarios con información de rol
CREATE VIEW v_users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    u.is_active,
    u.last_login,
    u.created_at
FROM users u
INNER JOIN roles r ON u.role_id = r.id;

-- Vista de puntos de interés con área
CREATE VIEW v_points_with_area AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.coordinates,
    p.is_visible,
    a.name as area_name,
    a.code as area_code,
    CONCAT(u.first_name, ' ', u.last_name) as created_by_name
FROM points_of_interest p
INNER JOIN areas a ON p.area_id = a.id
INNER JOIN users u ON p.created_by = u.id;

-- Vista de estadísticas resumidas
CREATE VIEW v_statistics_summary AS
SELECT 
    DATE(created_at) as date,
    event_type,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users
FROM statistics
GROUP BY DATE(created_at), event_type;

-- ============================================
-- COMENTARIOS DESCRIPTIVOS
-- ============================================
ALTER TABLE roles COMMENT = 'Catálogo de roles del sistema (USER, ADMIN, SUBADMIN)';
ALTER TABLE users COMMENT = 'Usuarios autenticados del sistema con roles asignados';
ALTER TABLE areas COMMENT = 'Áreas del campus universitario (facultades, edificios, departamentos)';
ALTER TABLE subadmin_areas COMMENT = 'Asignación de subadministradores a áreas específicas que pueden gestionar';
ALTER TABLE points_of_interest COMMENT = 'Puntos de interés en el recorrido virtual 3D del campus';
ALTER TABLE events COMMENT = 'Eventos institucionales y académicos';
ALTER TABLE news COMMENT = 'Noticias y anuncios oficiales de la universidad';
ALTER TABLE statistics COMMENT = 'Métricas de uso, navegación e interacciones de usuarios';
ALTER TABLE audit_logs COMMENT = 'Registro de auditoría de todas las acciones administrativas';
