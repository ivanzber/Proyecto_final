-- =====================================================
-- INSERT RÁPIDO: Partido de Fútbol Interfacultades
-- Ejecutar contra la BD campus_virtual existente
-- =====================================================

USE campus_virtual;

-- 1. Evento ⚽
INSERT INTO events (title, description, area_id, event_date, start_time, end_time, location, category, is_published, created_by)
VALUES (
    'Partido de Fútbol Interfacultades ⚽',
    'Gran encuentro deportivo entre las facultades del campus. ¡Ven a apoyar a tu equipo y vive la emoción del fútbol universitario!',
    9,
    '2026-03-22',
    '10:00:00',
    '13:00:00',
    'Cancha Principal - Zonas Deportivas',
    'Deportivo',
    TRUE,
    1
);

-- 2. Noticia destacada ⚽
INSERT INTO news (title, summary, content, area_id, category, is_published, is_featured, publish_date, created_by)
VALUES (
    '⚽ Partido de Fútbol Interfacultades — Ingeniería vs. Administración',
    'Este sábado el campus vivirá un apasionante partido de fútbol entre las facultades de Ingeniería y Administración.',
    '<p>El próximo <strong>sábado 22 de marzo de 2026</strong> a las <strong>10:00 AM</strong> se disputará el esperado <em>Clásico Interfacultades</em> en la Cancha Principal del campus.</p>
<p><strong>Equipos</strong></p>
<ul>
  <li>⚙️ <strong>Ingeniería FC</strong> — Campeones del torneo 2025</li>
  <li>📊 <strong>Administración United</strong> — Subcampeones del torneo 2025</li>
</ul>
<p><strong>Detalles del evento:</strong></p>
<ul>
  <li>📅 Fecha: 22 de marzo de 2026</li>
  <li>⏰ Hora: 10:00 AM – 1:00 PM</li>
  <li>📍 Lugar: Cancha Principal, Zonas Deportivas</li>
  <li>🏆 Premio: Trofeo Interfacultades + puntos para el Campeonato Anual</li>
</ul>
<p>¡Entrada libre para toda la comunidad estudiantil! Ven con tu camiseta y apoya a tu facultad. 🎉</p>',
    9,
    'Deporte',
    TRUE,
    TRUE,
    NOW(),
    1
);

SELECT 'Evento y noticia de fútbol insertados ✅' AS resultado;
