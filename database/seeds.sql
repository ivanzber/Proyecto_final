-- ============================================
-- Datos iniciales (SEEDS) para el sistema
-- ============================================

USE campus_virtual;

-- ============================================
-- ROLES
-- ============================================
INSERT INTO roles (name, description) VALUES
('USER', 'Usuario regular que accede al recorrido virtual'),
('ADMIN', 'Administrador con acceso completo al sistema'),
('SUBADMIN', 'Subadministrador con permisos limitados a áreas específicas');

-- ============================================
-- USUARIO ADMINISTRADOR INICIAL
-- Contraseña: Admin123! (CAMBIAR EN PRODUCCIÓN)
-- Hash bcrypt generado con salt rounds = 10
-- ============================================
INSERT INTO users (email, password, first_name, last_name, role_id) VALUES
('admin@udec.edu.co', '$2b$10$YMu8U9w3vLo.HqlJaK5rxe6rFY96ZCxvdixWQ5mrpJhpXbn1cKzqe', 'Admin', 'Principal', 2);

-- ============================================
-- ÁREAS DEL CAMPUS (Ejemplo Universidad de Cundinamarca)
-- ============================================
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

-- ============================================
-- PUNTOS DE INTERÉS (Ejemplos)
-- ============================================
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

-- ============================================
-- EVENTOS (Ejemplos)
-- ============================================
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

-- ============================================
-- NOTICIAS (Ejemplos)
-- ============================================
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

-- ============================================
-- ESTADÍSTICAS INICIALES
-- (Se irán acumulando con el uso del sistema)
-- ============================================
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
