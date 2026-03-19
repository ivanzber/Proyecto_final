-- ============================================
-- Sistema de Recorrido Virtual Campus UDEC
-- Base de Datos: SQL Server
-- Esquema principal de la aplicación
-- ============================================

-- Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'campus_virtual')
BEGIN
    CREATE DATABASE campus_virtual
    COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO

USE campus_virtual;
GO

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
GO

-- ============================================
-- TABLA: roles
-- Catálogo de roles del sistema
-- ============================================
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE, -- 'USER, ADMIN, SUBADMIN'
    description NVARCHAR(255),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- Trigger para actualizar updated_at
CREATE TRIGGER trg_roles_updated
ON roles
AFTER UPDATE
AS
BEGIN
    UPDATE roles
    SET updated_at = SYSDATETIME()
    FROM roles t
    INNER JOIN inserted i ON t.id = i.id;
END
GO

-- ============================================
-- TABLA: users
-- Usuarios del sistema con autenticación
-- ============================================
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL, -- 'Hash bcrypt'
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active BIT DEFAULT 1,
    last_login DATETIME2 NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_email (email),
    INDEX idx_role (role_id),
    INDEX idx_active (is_active)
);
GO

CREATE TRIGGER trg_users_updated
ON users
AFTER UPDATE
AS
BEGIN
    UPDATE users
    SET updated_at = SYSDATETIME()
    FROM users t
    INNER JOIN inserted i ON t.id = i.id;
END
GO

-- ============================================
-- TABLA: areas
-- Áreas del campus (facultades, edificios, departamentos)
-- ============================================
CREATE TABLE areas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE, -- 'Código identificador único'
    description NVARCHAR(MAX),
    parent_area_id INT NULL, -- 'Para jerarquía de áreas'
    coordinates NVARCHAR(MAX), -- 'Coordenadas para el modelo 3D (x,y,z) como JSON string'
    metadata NVARCHAR(MAX), -- 'Información adicional configurable como JSON string'
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (parent_area_id) REFERENCES areas(id),
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_parent (parent_area_id)
);
GO

CREATE TRIGGER trg_areas_updated
ON areas
AFTER UPDATE
AS
BEGIN
    UPDATE areas
    SET updated_at = SYSDATETIME()
    FROM areas t
    INNER JOIN inserted i ON t.id = i.id;
END
GO

-- ============================================
-- TABLA: subadmin_areas
-- Asignación de subadministradores a áreas específicas
-- ============================================
CREATE TABLE subadmin_areas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    area_id INT NOT NULL,
    assigned_by INT NOT NULL, -- 'ID del admin que asignó'
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    CONSTRAINT unique_user_area UNIQUE (user_id, area_id),
    INDEX idx_user (user_id),
    INDEX idx_area (area_id)
);
GO

-- ============================================
-- TABLA: points_of_interest
-- Puntos de interés en el recorrido virtual 3D
-- ============================================
CREATE TABLE points_of_interest (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    area_id INT NOT NULL,
    category NVARCHAR(100), -- 'Edificio, Monumento, Servicio, etc.'
    coordinates NVARCHAR(MAX) NOT NULL, -- 'Posición 3D: {x, y, z}'
    icon_url NVARCHAR(500), -- 'URL del icono para el punto'
    images NVARCHAR(MAX), -- 'Array de URLs de imágenes'
    additional_info NVARCHAR(MAX), -- 'Horarios, contactos, enlaces, etc.'
    is_visible BIT DEFAULT 1,
    order_index INT DEFAULT 0, -- 'Orden de visualización'
    created_by INT NOT NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (area_id) REFERENCES areas(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_area (area_id),
    INDEX idx_visible (is_visible),
    INDEX idx_category (category),
    INDEX idx_order (order_index)
);
GO

CREATE TRIGGER trg_points_updated
ON points_of_interest
AFTER UPDATE
AS
BEGIN
    UPDATE points_of_interest
    SET updated_at = SYSDATETIME()
    FROM points_of_interest t
    INNER JOIN inserted i ON t.id = i.id;
END
GO

-- ============================================
-- TABLA: events
-- Eventos institucionales
-- ============================================
CREATE TABLE events (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    area_id INT NULL, -- 'Área relacionada (opcional)'
    event_date DATE NOT NULL,
    start_time getTime,
    end_time TIME,
    location NVARCHAR(255),
    image_url NVARCHAR(500),
    category NVARCHAR(100), -- 'Académico, Cultural, Deportivo, etc.'
    is_published BIT DEFAULT 0,
    created_by INT NOT NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (area_id) REFERENCES areas(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_date (event_date),
    INDEX idx_published (is_published),
    INDEX idx_area (area_id),
    INDEX idx_category (category)
);
GO

CREATE TRIGGER trg_events_updated
ON events
AFTER UPDATE
AS
BEGIN
    UPDATE events
    SET updated_at = SYSDATETIME()
    FROM events t
    INNER JOIN inserted i ON t.id = i.id;
END
GO

-- ============================================
-- TABLA: news
-- Noticias y anuncios institucionales
-- ============================================
CREATE TABLE news (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    summary NVARCHAR(500),
    content NVARCHAR(MAX) NOT NULL,
    area_id INT NULL,
    featured_image NVARCHAR(500),
    category NVARCHAR(100), -- 'Noticia, Anuncio, Comunicado, etc.'
    is_published BIT DEFAULT 0,
    is_featured BIT DEFAULT 0, -- 'Destacada en portada'
    publish_date DATETIME2 NULL,
    created_by INT NOT NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (area_id) REFERENCES areas(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_published (is_published),
    INDEX idx_featured (is_featured),
    INDEX idx_area (area_id),
    INDEX idx_category (category),
    INDEX idx_publish_date (publish_date)
);
GO

CREATE TRIGGER trg_news_updated
ON news
AFTER UPDATE
AS
BEGIN
    UPDATE news
    SET updated_at = SYSDATETIME()
    FROM news t
    INNER JOIN inserted i ON t.id = i.id;
END
GO

-- ============================================
-- TABLA: statistics
-- Métricas de uso y navegación
-- ============================================
CREATE TABLE statistics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    event_type NVARCHAR(100) NOT NULL, -- 'page_view, point_click, area_visit, etc.'
    entity_type NVARCHAR(100), -- 'point_of_interest, area, event, news'
    entity_id INT, -- 'ID de la entidad relacionada'
    user_id INT NULL, -- 'Usuario si está autenticado'
    session_id NVARCHAR(255), -- 'ID de sesión para usuarios anónimos'
    metadata NVARCHAR(MAX), -- 'Datos adicionales del evento'
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    INDEX idx_event_type (event_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at),
    INDEX idx_user (user_id)
);
GO

-- ============================================
-- TABLA: audit_logs
-- Registro de auditoría de acciones del sistema
-- ============================================
CREATE TABLE audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    action NVARCHAR(100) NOT NULL, -- 'CREATE, UPDATE, DELETE, LOGIN, etc.'
    entity_type NVARCHAR(100), -- 'users, points_of_interest, events, etc.'
    entity_id INT, -- 'ID de la entidad afectada'
    old_values NVARCHAR(MAX), -- 'Valores anteriores (para UPDATE/DELETE)'
    new_values NVARCHAR(MAX), -- 'Valores nuevos (para CREATE/UPDATE)'
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);
GO

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
GO

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
GO

-- Vista de estadísticas resumidas
CREATE VIEW v_statistics_summary AS
SELECT 
    CAST(created_at AS DATE) as date,
    event_type,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users
FROM statistics
GROUP BY CAST(created_at AS DATE), event_type;
GO

