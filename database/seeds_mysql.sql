-- ============================================
-- Datos iniciales (SEEDS) para el sistema
-- Base de Datos: MySQL 8.0
-- ============================================

USE campus_virtual;

-- ============================================
-- ROLES
-- ============================================
INSERT INTO roles (name, description) VALUES
('USER',     'Usuario regular que accede al recorrido virtual'),
('ADMIN',    'Administrador con acceso completo al sistema'),
('SUBADMIN', 'Subadministrador con permisos limitados a áreas específicas');

-- ============================================
-- USUARIO ADMINISTRADOR INICIAL
-- Contraseña: Admin123!
-- Hash bcrypt generado con 10 rondas
-- ============================================
INSERT INTO users (email, password, first_name, last_name, role_id, is_active) VALUES
('admin@udec.edu.co',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Admin', 'Principal', 2, 1);

-- ============================================
-- ÁREAS DEL CAMPUS
-- ============================================
INSERT INTO areas (name, code, description, coordinates, is_active) VALUES
('Campus Facatativá',              'CAMPUS_FAC',  'Campus principal de la Universidad de Cundinamarca en Facatativá',             '{"x": 0,   "y": 0, "z": 0}',   1),
('Facultad de Ingeniería',         'FAC_ING',     'Facultad de Ingeniería - Edificio principal',                                   '{"x": 100, "y": 0, "z": 50}',  1),
('Facultad de Ciencias Administrativas', 'FAC_ADM', 'Facultad de Ciencias Administrativas, Económicas y Contables',              '{"x": 150, "y": 0, "z": 100}', 1),
('Facultad de Educación',          'FAC_EDU',     'Facultad de Ciencias de la Educación',                                         '{"x": 200, "y": 0, "z": 150}', 1),
('Biblioteca Central',             'BIBLIOTECA',  'Biblioteca Central - Recursos bibliográficos',                                  '{"x": 50,  "y": 0, "z": 200}', 1),
('Auditorios',                     'AUDITORIOS',  'Auditorio para eventos institucionales',                                        '{"x": 75,  "y": 0, "z": 250}', 1),
('Cafeteria',                      'CAFETERIA',   'Cafetería principal del campus',                                                '{"x": 125, "y": 0, "z": 300}', 1),
('Laboratorios de Ingeniería',     'LAB_ING',     'Laboratorios especializados de ingeniería',                                     '{"x": 175, "y": 0, "z": 350}', 1),
('Zonas Deportivas',               'DEPORTES',    'Canchas y zonas deportivas',                                                    '{"x": 225, "y": 0, "z": 400}', 1),
('Rectoría',                       'RECTORIA',    'Edificio administrativo - Rectoría',                                            '{"x": 275, "y": 0, "z": 450}', 1);

-- ============================================
-- PUNTOS DE INTERÉS
-- ============================================
INSERT INTO points_of_interest (
    title, description, area_id, category, coordinates,
    icon_url, images, additional_info, is_visible, order_index, created_by
) VALUES
(
    'Entrada Principal Campus',
    'Punto de acceso principal al campus de Facatativá.',
    1, 'Acceso',
    '{"x": 0, "y": 0, "z": 0}',
    '/icons/entrance.png',
    '["images/entrance1.jpg"]',
    '{"horario": "Lunes a Viernes 7:00 AM - 9:00 PM"}',
    1, 1, 1
),
(
    'Sala de Lectura General',
    'Amplia sala de lectura con capacidad para 200 estudiantes.',
    5, 'Estudio',
    '{"x": 50, "y": 5, "z": 200}',
    '/icons/library.png',
    '["images/library1.jpg"]',
    '{"horario": "Lunes a Viernes 7:00 AM - 8:00 PM", "capacidad": "200 personas"}',
    1, 2, 1
),
(
    'Laboratorio de Redes',
    'Laboratorio especializado en redes y telecomunicaciones con equipamiento Cisco.',
    8, 'Laboratorio',
    '{"x": 175, "y": 10, "z": 350}',
    '/icons/lab.png',
    '["images/lab-redes1.jpg"]',
    '{"capacidad": "30 estudiantes"}',
    1, 3, 1
),
(
    'Auditorio Simón Bolívar',
    'Auditorio principal con capacidad para 500 personas.',
    6, 'Evento',
    '{"x": 75, "y": 0, "z": 250}',
    '/icons/auditorium.png',
    '["images/auditorio1.jpg"]',
    '{"capacidad": "500 personas"}',
    1, 4, 1
),
(
    'Canchas de Fútbol',
    'Canchas deportivas de la universidad de cundinamarca extension Facativa',
    9, 'DEPORTIVO',
    '{"x": 225, "y": 0, "z": 400}',
    '/icons/sports.png',
    '["images/deportes1.jpg"]',
    '{"horario": "6:00 AM - 6:00 PM"}',
    1, 5, 1
);

-- ============================================
-- EVENTOS
-- ============================================
INSERT INTO events (
    title, description, area_id, point_of_interest_id,
    event_date, start_time, end_time,
    location, category, is_published, created_by
) VALUES
(
    'Feria de Emprendimiento 2025',
    'Evento anual donde estudiantes presentan sus proyectos emprendedores.',
    3, NULL, '2025-03-15', '08:00:00', '17:00:00',
    'Auditorio Principal', 'ACADEMICO', 1, 1
),
(
    'Semana de la Ingeniería',
    'Conferencias, talleres y actividades relacionadas con la ingeniería.',
    2, NULL, '2025-04-20', '09:00:00', '18:00:00',
    'Facultad de Ingeniería', 'ACADEMICO', 1, 1
),
(
    'Festival Cultural UDEC',
    'Presentaciones artísticas, musicales y culturales.',
    1, NULL, '2025-05-10', '14:00:00', '20:00:00',
    'Plaza Central', 'CULTURAL', 1, 1
),
(
    'Partido de Fútbol Interfacultades',
    'Gran encuentro deportivo entre las facultades del campus.',
    9, 5, '2026-06-15', '10:00:00', '13:00:00',
    'Cancha Principal - Zonas Deportivas', 'DEPORTIVO', 1, 1
);

-- ============================================
-- NOTICIAS
-- ============================================
INSERT INTO news (
    title, summary, content, area_id, category,
    is_published, is_featured, publish_date, created_by
) VALUES
(
    'Inauguración del Nuevo Laboratorio de Robótica',
    'La Universidad inaugura moderno laboratorio dotado con tecnología de punta.',
    'Este martes se llevó a cabo la inauguración oficial del nuevo Laboratorio de Robótica de la Facultad de Ingeniería. El laboratorio cuenta con kits de robótica educativa, impresoras 3D y software especializado.',
    2, 'Noticia', 1, 1, NOW(), 1
),
(
    'Convocatoria: Becas de Investigación 2025',
    'Abierta convocatoria para becas de investigación para estudiantes de últimos semestres.',
    'La vicerrectoría de investigación anuncia la apertura de su convocatoria anual de Becas de Investigación 2025. Requisitos: estar cursando mínimo 7° semestre, promedio superior a 3.8 y presentar propuesta de investigación.',
    NULL, 'Anuncio', 1, 1, NOW(), 1
),
(
    'Éxito en Torneo Interuniversitario de Programación',
    'Equipo de la UDEC obtiene segundo lugar en competencia nacional.',
    'Nuestro equipo de programación competitiva obtuvo el segundo lugar en el XXIII Torneo Nacional Interuniversitario de Programación con participación de 45 universidades.',
    2, 'Noticia', 1, 0, NOW(), 1
),
(
    'Partido de Fútbol Interfacultades — Ingeniería vs. Administración',
    'Este sábado el campus vivirá un apasionante partido de fútbol entre facultades.',
    'El próximo sábado se disputará el esperado Clásico Interfacultades en la Cancha Principal del campus. Entrada libre para toda la comunidad estudiantil.',
    9, 'Deporte', 1, 1, NOW(), 1
);

-- ============================================
-- ESTADÍSTICA INICIAL
-- ============================================
INSERT INTO statistics (event_type, entity_type, entity_id, session_id, metadata) VALUES
('system_initialized', 'system', NULL, 'SEED_DATA', '{"version": "1.0.0", "db_initialized": true}');

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'roles'              AS tabla, COUNT(*) AS total FROM roles
UNION ALL
SELECT 'users',             COUNT(*) FROM users
UNION ALL
SELECT 'areas',             COUNT(*) FROM areas
UNION ALL
SELECT 'points_of_interest',COUNT(*) FROM points_of_interest
UNION ALL
SELECT 'events',            COUNT(*) FROM events
UNION ALL
SELECT 'news',              COUNT(*) FROM news;
