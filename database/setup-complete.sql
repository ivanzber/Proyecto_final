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

-- ============================================
-- DATOS INICIALES (SEEDS)
-- ============================================

-- ROLES
INSERT INTO roles (name, description) VALUES
('USER', 'Usuario regular que accede al recorrido virtual'),
('ADMIN', 'Administrador con acceso completo al sistema'),
('SUBADMIN', 'Subadministrador con permisos limitados a áreas específicas');

-- USUARIO ADMINISTRADOR INICIAL
-- Contraseña: Admin123! (CAMBIAR EN PRODUCCIÓN)
-- Hash bcrypt generado con salt rounds = 10
INSERT INTO users (email, password, first_name, last_name, role_id) VALUES
('admin@udec.edu.co', '$2b$10$YMu8U9w3vLo.HqlJaK5rxe6rFY96ZCxvdixWQ5mrpJhpXbn1cKzqe', 'Admin', 'Principal', 2);

-- ÁREAS DEL CAMPUS (Ejemplo Universidad de Cundinamarca)
INSERT INTO areas (name, code, description, coordinates, is_active) VALUES
-- Áreas principales
('Campus Facatativá', 'CAMPUS_FAC', 'Campus principal de la Universidad de Cundinamarca en Facatativá', '{"x": 0, "y": 0, "z": 0}', TRUE),
('Facultad de Ingeniería', 'FAC_ING', 'Facultad de Ingeniería - Edificio principal', '{"x": 100, "y": 0, "z": 50}', TRUE),
('Facultad de Ciencias Administrativas', 'FAC_ADM', 'Facultad de Ciencias Administrativas, Económicas y Contables', '{"x": 150, "y": 0, "z": 100}', TRUE),
('Facultad de Educación', 'FAC_EDU', 'Facultad de Ciencias de la Educación', '{"x": 200, "y": 0, "z": 150}', TRUE),

-- Edificios y servicios
('Biblioteca Central', 'BIBLIOTECA', 'Biblioteca Central - Recursos bibliográficos', '{"x": 50, "y": 0, "z": 200}', TRUE),
('Auditorio Principal', 'AUDITORIO', 'Auditorio para eventos institucionales', '{"x": 75, "y": 0, "z": 250}', TRUE),
('Cafetería Central', 'CAFETERIA', 'Cafetería principal del campus', '{"x": 125, "y": 0, "z": 300}', TRUE),
('Laboratorios de Ingeniería', 'LAB_ING', 'Laboratorios especializados de ingeniería', '{"x": 175, "y": 0, "z": 350}', TRUE),
('Zonas Deportivas', 'DEPORTES', 'Canchas y zonas deportivas', '{"x": 225, "y": 0, "z": 400}', TRUE),
('Rectoría', 'RECTORIA', 'Edificio administrativo - Rectoría', '{"x": 275, "y": 0, "z": 450}', TRUE);

-- PUNTOS DE INTERÉS (Ejemplos)
INSERT INTO points_of_interest (
    title, description, area_id, category, coordinates, 
    icon_url, images, additional_info, is_visible, order_index, created_by
) VALUES
(
    'Entrada Principal Campus',
    'Punto de acceso principal al campus de Facatativá. Aquí encontrarás la portería y centro de información para visitantes.',
    1,
    'Acceso',
    '{"x": 0, "y": 0, "z": 0}',
    '/icons/entrance.png',
    '["images/entrance1.jpg", "images/entrance2.jpg"]',
    '{"horario": "Lunes a Viernes 7:00 AM - 9:00 PM, Sábados 8:00 AM - 5:00 PM", "contacto": "Portería: ext. 100"}',
    TRUE,
    1,
    1
),
(
    'Sala de Lectura General',
    'Amplia sala de lectura con capacidad para 200 estudiantes. Cuenta con conexión WiFi, tomas eléctricas y aire acondicionado.',
    5,
    'Estudio',
    '{"x": 50, "y": 5, "z": 200}',
    '/icons/library.png',
    '["images/library1.jpg", "images/library2.jpg", "images/library3.jpg"]',
    '{"horario": "Lunes a Viernes 7:00 AM - 8:00 PM", "capacidad": "200 personas", "servicios": ["WiFi", "Préstamo de libros", "Salas de estudio"]}',
    TRUE,
    2,
    1
),
(
    'Laboratorio de Redes',
    'Laboratorio especializado en redes y telecomunicaciones con equipamiento Cisco.',
    8,
    'Laboratorio',
    '{"x": 175, "y": 10, "z": 350}',
    '/icons/lab.png',
    '["images/lab-redes1.jpg"]',
    '{"capacidad": "30 estudiantes", "equipamiento": ["Switches Cisco", "Routers", "Herramientas de cableado"], "horario": "Reserva previa requerida"}',
    TRUE,
    3,
    1
),
(
    'Auditorio Simón Bolívar',
    'Auditorio principal con capacidad para 500 personas. Ideal para conferencias, eventos académicos y culturales.',
    6,
    'Evento',
    '{"x": 75, "y": 0, "z": 250}',
    '/icons/auditorium.png',
    '["images/auditorio1.jpg", "images/auditorio2.jpg"]',
    '{"capacidad": "500 personas", "equipamiento": ["Proyector 4K", "Sistema de sonido profesional", "Aire acondicionado"], "reservas": "extension.facatativa@ucundinamarca.edu.co"}',
    TRUE,
    4,
    1
),
(
    'Canchas Deportivas',
    'Complejas deportivo con canchas de fútbol, baloncesto y voleibol.',
    9,
    'Deporte',
    '{"x": 225, "y": 0, "z": 400}',
    '/icons/sports.png',
    '["images/deportes1.jpg"]',
    '{"instalaciones": ["Cancha de fútbol", "Cancha de baloncesto", "Cancha de voleibol"], "horario": "6:00 AM - 6:00 PM", "disponibilidad": "Préstamo de implementos deportivos"}',
    TRUE,
    5,
    1
);

-- EVENTOS (Ejemplos)
INSERT INTO events (
    title, description, area_id, event_date, start_time, end_time,
    location, category, is_published, created_by
) VALUES
(
    'Feria de Emprendimiento 2025',
    'Evento anual donde estudiantes presentan sus proyectos emprendedores. Participación de empresarios y potenciales inversores.',
    3,
    '2025-03-15',
    '08:00:00',
    '17:00:00',
    'Auditorio Principal',
    'Académico',
    TRUE,
    1
),
(
    'Semana de la Ingeniería',
    'Conferencias, talleres y actividades relacionadas con las diferentes ramas de la ingeniería.',
    2,
    '2025-04-20',
    '09:00:00',
    '18:00:00',
    'Facultad de Ingeniería',
    'Académico',
    TRUE,
    1
),
(
    'Festival Cultural UDEC',
    'Presentaciones artísticas, musicales y culturales de estudiantes y agrupaciones invitadas.',
    1,
    '2025-05-10',
    '14:00:00',
    '20:00:00',
    'Plaza Central',
    'Cultural',
    TRUE,
    1
);

-- NOTICIAS (Ejemplos)
INSERT INTO news (
    title, summary, content, area_id, category,
    is_published, is_featured, publish_date, created_by
) VALUES
(
    'Inauguración del Nuevo Laboratorio de Robótica',
    'La Universidad de Cundinamarca inaugura moderno laboratorio dotado con tecnología de punta.',
    '<p>Este martes se llevó a cabo la inauguración oficial del nuevo <strong>Laboratorio de Robótica</strong> de la Facultad de Ingeniería.</p><p>El laboratorio cuenta con:</p><ul><li>10 kits de robótica educativa</li><li>Impresoras 3D</li><li>Estación de soldadura y electrónica</li><li>Software especializado de simulación</li></ul><p>Este espacio fortalecerá la formación de nuestros estudiantes en áreas como robótica, automatización e inteligencia artificial.</p>',
    2,
    'Noticia',
    TRUE,
    TRUE,
    NOW(),
    1
),
(
    'Convocatoria: Becas de Investigación 2025',
    'Abierta convocatoria para becas de investigación dirigidas a estudiantes de últimos semestres.',
    '<p>La vicerrectoría de investigación anuncia la apertura de su convocatoria anual de <strong>Becas de Investigación 2025</strong>.</p><p><strong>Requisitos:</strong></p><ul><li>Estar cursando mínimo 7° semestre</li><li>Promedio académico superior a 3.8</li><li>Presentar propuesta de investigación</li></ul><p><strong>Fecha límite:</strong> 15 de febrero de 2025</p><p>Para más información visitar la oficina de investigaciones o escribir a investigacion@ucundinamarca.edu.co</p>',
    NULL,
    'Anuncio',
    TRUE,
    TRUE,
    NOW(),
    1
),
(
    'Éxito en Torneo Interuniversitario de Programación',
    'Equipo de la UDEC obtiene segundo lugar en competencia nacional.',
    '<p>Nuestro equipo de programación competitiva <em>"Code Warriors"</em> obtuvo el <strong>segundo lugar</strong> en el XXIII Torneo Nacional Interuniversitario de Programación.</p><p>La competencia contó con la participación de 45 universidades de todo el país. Nuestros estudiantes destacaron en categorías de:</p><ul><li>Algoritmos y estructuras de datos</li><li>Programación dinámica</li><li>Teoría de grafos</li></ul><p>¡Felicitaciones al equipo y a sus entrenadores!</p>',
    2,
    'Noticia',
    TRUE,
    FALSE,
    NOW(),
    1
);

-- ESTADÍSTICAS INICIALES
INSERT INTO statistics (event_type, entity_type, entity_id, session_id, metadata) VALUES
('system_initialized', 'system', NULL, 'SEED_DATA', '{"version": "1.0.0", "db_initialized": true}');

-- ============================================
-- VERIFICACIÓN DE DATOS
-- ============================================
SELECT 'Roles insertados:' as Tabla, COUNT(*) as Total FROM roles
UNION ALL
SELECT 'Usuarios insertados:', COUNT(*) FROM users
UNION ALL
SELECT 'Áreas insertadas:', COUNT(*) FROM areas
UNION ALL
SELECT 'Puntos de interés:', COUNT(*) FROM points_of_interest
UNION ALL
SELECT 'Eventos:', COUNT(*) FROM events
UNION ALL
SELECT 'Noticias:', COUNT(*) FROM news;

SELECT '✅ Base de datos configurada exitosamente!' as Estado;
