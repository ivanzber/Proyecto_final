-- =====================================================
-- INSERT: Punto de Interés "Canchas de Fútbol"
-- Ejecutar contra la BD campus_virtual existente
-- 
-- Este POI corresponde al trigger zone "Canchas de Fútbol"
-- que Unity muestra durante el recorrido virtual.
-- Al tenerlo en la BD, aparece en el dashboard para
-- poder asignarle eventos desde el Panel de Control.
-- =====================================================

USE campus_virtual;

INSERT INTO points_of_interest (
    title,
    description,
    area_id,
    category,
    coordinates,
    icon_url,
    images,
    additional_info,
    is_visible,
    order_index,
    created_by
)
VALUES (
    'Canchas de Fútbol',
    'Cancha principal de fútbol del campus. Escenario de los torneos interfacultades y actividades deportivas estudiantiles.',
    9,
    'DEPORTIVO',
    '{"x": 225, "y": 0, "z": 420}',
    '/icons/sports.png',
    '[]',
    '{"instalaciones": ["Cancha de fútbol reglamentaria", "Graderías", "Camerinos"], "horario": "6:00 AM - 6:00 PM", "contacto": "Departamento de Deportes: ext. 310"}',
    TRUE,
    6,
    1
);

SELECT 'Punto de interés "Canchas de Fútbol" insertado ✅' AS resultado;
SELECT id, title, area_id, category, is_visible FROM points_of_interest WHERE title = 'Canchas de Fútbol';
