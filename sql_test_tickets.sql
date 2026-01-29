-- ============================================
-- SQL: Insertar Tickets de Prueba
-- ============================================
-- Este script crea tickets de ejemplo para testing
-- Asume que ya existen usuarios en pr_usuarios

-- 1. Verificar que existan usuarios
-- SELECT id_usuario, email, id_perfil FROM pr_usuarios ORDER BY id_usuario;

-- 2. OPCIONALMENTE: Crear usuarios de prueba si no existen
-- INSERT INTO pr_usuarios (email, id_perfil, id_organizacion_principal) 
-- VALUES 
--   ('cliente@test.com', 5, 1),
--   ('consultor@test.com', 4, 1)
-- ON CONFLICT (email) DO NOTHING;

-- 3. Limpiar tickets anteriores (SOLO SI QUIERES EMPEZAR DE CERO)
-- DELETE FROM pr_tickets WHERE codigo_visual LIKE 'TEST-%';

-- 4. Insertar tickets de prueba
INSERT INTO pr_tickets (
    codigo_visual,
    titulo,
    descripcion,
    id_solicitante,
    id_asignado,
    estado,
    prioridad,
    fecha_creacion,
    fecha_estimada,
    resultado_esperado
)
-- Obtener IDs dinámicamente
WITH usuarios AS (
    SELECT 
        (SELECT id_usuario FROM pr_usuarios WHERE id_perfil = 5 LIMIT 1) as cliente_id,
        (SELECT id_usuario FROM pr_usuarios WHERE id_perfil = 4 LIMIT 1) as consultor_id
)
SELECT 
    'TEST-001' as codigo_visual,
    'Bug: Login no funciona con Google' as titulo,
    'Cuando intento login con Google, aparece error 403' as descripcion,
    u.cliente_id as id_solicitante,
    u.consultor_id as id_asignado,
    'EN_PROCESO' as estado,
    'ALTA' as prioridad,
    NOW() as fecha_creacion,
    NOW() + INTERVAL '2 days' as fecha_estimada,
    'Login debe funcionar con Google OAuth' as resultado_esperado
FROM usuarios u
WHERE u.cliente_id IS NOT NULL AND u.consultor_id IS NOT NULL

UNION ALL

SELECT 
    'TEST-002' as codigo_visual,
    'Mejora: Dashboard lento' as titulo,
    'El dashboard tarda 5 segundos en cargar' as descripcion,
    u.cliente_id,
    u.consultor_id,
    'RESUELTO' as estado,
    'MEDIA' as prioridad,
    NOW() - INTERVAL '5 days' as fecha_creacion,
    NOW() - INTERVAL '3 days' as fecha_estimada,
    'Dashboard debe cargar en menos de 2 segundos' as resultado_esperado
FROM usuarios u
WHERE u.cliente_id IS NOT NULL AND u.consultor_id IS NOT NULL

UNION ALL

SELECT 
    'TEST-003' as codigo_visual,
    'Validación: Reportes de proyecto' as titulo,
    'Se necesita generar reportes mensuales' as descripcion,
    u.cliente_id,
    u.consultor_id,
    'RESUELTO' as estado,
    'BAJA' as prioridad,
    NOW() - INTERVAL '10 days' as fecha_creacion,
    NOW() - INTERVAL '7 days' as fecha_estimada,
    'Reportes en PDF y Excel' as resultado_esperado
FROM usuarios u
WHERE u.cliente_id IS NOT NULL AND u.consultor_id IS NOT NULL

UNION ALL

SELECT 
    'TEST-004' as codigo_visual,
    'Feature: Exportar a Excel' as titulo,
    'Agregar opción para exportar listados a Excel' as descripcion,
    u.cliente_id,
    u.cliente_id + 100,  -- Diferente asignado (si existe)
    'EN_PROCESO' as estado,
    'MEDIA' as prioridad,
    NOW() - INTERVAL '1 day' as fecha_creacion,
    NOW() + INTERVAL '5 days' as fecha_estimada,
    'Exportar listados a formato XLSX' as resultado_esperado
FROM usuarios u
WHERE u.cliente_id IS NOT NULL
ON CONFLICT (codigo_visual) DO NOTHING;

-- 5. Verificar que se crearon
SELECT 
    id_ticket, 
    codigo_visual, 
    titulo, 
    id_solicitante, 
    id_asignado, 
    estado 
FROM pr_tickets 
WHERE codigo_visual LIKE 'TEST-%'
ORDER BY id_ticket DESC;

-- 6. Ver con perfil del solicitante
SELECT 
    t.id_ticket,
    t.codigo_visual,
    t.titulo,
    t.estado,
    u_sol.email as solicitante_email,
    u_sol.id_perfil as solicitante_perfil,
    u_asig.email as asignado_email,
    u_asig.id_perfil as asignado_perfil
FROM pr_tickets t
LEFT JOIN pr_usuarios u_sol ON t.id_solicitante = u_sol.id_usuario
LEFT JOIN pr_usuarios u_asig ON t.id_asignado = u_asig.id_usuario
WHERE t.codigo_visual LIKE 'TEST-%'
ORDER BY t.id_ticket;
