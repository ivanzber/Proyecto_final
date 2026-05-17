-- ============================================
-- Sistema de Recorrido Virtual Campus UDEC
-- Base de Datos: MySQL 8.0
-- Esquema principal de la aplicación
-- ============================================

CREATE DATABASE IF NOT EXISTS campus_virtual
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE campus_virtual;

-- ============================================
-- LIMPIEZA DE TABLAS (Orden inverso por dependencias)
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;
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
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: users
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_email (email),
    INDEX idx_role (role_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: areas
-- ============================================
CREATE TABLE areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    parent_area_id INT NULL,
    coordinates JSON,
    metadata JSON,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_area_id) REFERENCES areas(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_parent (parent_area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: subadmin_areas
-- ============================================
CREATE TABLE subadmin_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    area_id INT NOT NULL,
    assigned_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    CONSTRAINT unique_user_area UNIQUE (user_id, area_id),
    INDEX idx_user (user_id),
    INDEX idx_area (area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: points_of_interest
-- ============================================
CREATE TABLE points_of_interest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    area_id INT NOT NULL,
    category VARCHAR(100),
    coordinates JSON NOT NULL,
    icon_url VARCHAR(500),
    images JSON,
    additional_info JSON,
    is_visible TINYINT(1) DEFAULT 1,
    order_index INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_area (area_id),
    INDEX idx_visible (is_visible),
    INDEX idx_category (category),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: events
-- ============================================
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    area_id INT NULL,
    point_of_interest_id INT NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    image_url VARCHAR(500),
    category VARCHAR(100),
    is_published TINYINT(1) DEFAULT 0,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
    FOREIGN KEY (point_of_interest_id) REFERENCES points_of_interest(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_date (event_date),
    INDEX idx_published (is_published),
    INDEX idx_area (area_id),
    INDEX idx_poi (point_of_interest_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: news
-- ============================================
CREATE TABLE news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(500),
    content TEXT NOT NULL,
    area_id INT NULL,
    featured_image VARCHAR(500),
    category VARCHAR(100),
    is_published TINYINT(1) DEFAULT 0,
    is_featured TINYINT(1) DEFAULT 0,
    publish_date DATETIME NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_published (is_published),
    INDEX idx_featured (is_featured),
    INDEX idx_area (area_id),
    INDEX idx_category (category),
    INDEX idx_publish_date (publish_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: statistics
-- ============================================
CREATE TABLE statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    user_id INT NULL,
    session_id VARCHAR(255),
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: audit_logs
-- ============================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTAS
-- ============================================

CREATE VIEW v_users_with_roles AS
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name AS role_name,
    u.is_active,
    u.last_login,
    u.created_at
FROM users u
INNER JOIN roles r ON u.role_id = r.id;

CREATE VIEW v_points_with_area AS
SELECT
    p.id,
    p.title,
    p.description,
    p.category,
    p.coordinates,
    p.is_visible,
    a.name AS area_name,
    a.code AS area_code,
    CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
FROM points_of_interest p
INNER JOIN areas a ON p.area_id = a.id
INNER JOIN users u ON p.created_by = u.id;

CREATE VIEW v_statistics_summary AS
SELECT
    DATE(created_at) AS date,
    event_type,
    COUNT(*) AS total_events,
    COUNT(DISTINCT session_id) AS unique_sessions,
    COUNT(DISTINCT user_id) AS unique_users
FROM statistics
GROUP BY DATE(created_at), event_type;
