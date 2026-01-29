-- ============================================
-- SQL: Insertar Tickets de Prueba
-- ============================================
-- PREREQUISITOS:
-- 1. Debe haber al menos 2 usuarios en pr_usuarios (cliente y consultante)
-- 2. Los usuarios deben estar registrados ANTES de ejecutar este script
--
-- INSTRUCCIONES:
-- 1. Ve a la consola de Supabase
-- 2. Ve a SQL Editor
-- 3. Primero ejecuta esta consulta para ver tus usuarios:
--    SELECT id_usuario, email FROM pr_usuarios LIMIT 10;
-- 4. Anota los id_usuario de al menos 1 cliente y 1 consultante
-- 5. En el script abajo, reemplaza los valores:
--    - CLIENT_ID: ID de un usuario cliente
--    - CONSULTANT_ID: ID de un usuario consultante

-- OPCIÓN A: Insertar tickets con IDs dinámicos (requiere usuarios existentes)
-- Descomenta y ejecuta esta sección si ya tienes usuarios en pr_usuarios

/*
WITH usuarios AS (
    SELECT 
        (SELECT id_usuario FROM pr_usuarios LIMIT 1) as cliente_id,
        (SELECT id_usuario FROM pr_usuarios LIMIT 1 OFFSET 1) as consultor_id
)
INSERT INTO pr_tickets (
    codigo_visual,
    titulo,
    descripcion,
    id_solicitante,
    id_asignado,
    estado,
    prioridad,
    resultado_esperado
)
SELECT 
    'TEST-001' as codigo_visual,
    'Bug: Login no funciona con Google' as titulo,
    'Cuando intento login con Google, aparece error 403' as descripcion,
    u.cliente_id as id_solicitante,
    u.consultor_id as id_asignado,
    'EN_PROCESO' as estado,
    'ALTA' as prioridad,
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
    'Reportes en PDF y Excel' as resultado_esperado
FROM usuarios u
WHERE u.cliente_id IS NOT NULL AND u.consultor_id IS NOT NULL

UNION ALL

SELECT 
    'TEST-004' as codigo_visual,
    'Feature: Exportar a Excel' as titulo,
    'Agregar opción para exportar listados a Excel' as descripcion,
    u.cliente_id,
    u.cliente_id as id_asignado,
    'EN_PROCESO' as estado,
    'MEDIA' as prioridad,
    'Exportar listados a formato XLSX' as resultado_esperado
FROM usuarios u
WHERE u.cliente_id IS NOT NULL
ON CONFLICT (codigo_visual) DO NOTHING;
*/

-- OPCIÓN B: Insertar tickets con IDs específicos (MÁS SIMPLE)
-- INSTRUCCIONES:
-- 1. Reemplaza 1 con el ID de tu usuario cliente
-- 2. Reemplaza 2 con el ID de tu usuario consultante
-- 3. Descomenta y ejecuta

INSERT INTO pr_tickets (
    codigo_visual,
    titulo,
    descripcion,
    id_solicitante,
    id_asignado,
    estado,
    prioridad,
    resultado_esperado
)
VALUES
    ('TEST-001', 'Bug: Login no funciona con Google', 'Cuando intento login con Google, aparece error 403', 1, 2, 'EN_PROCESO', 'ALTA', 'Login debe funcionar con Google OAuth'),
    ('TEST-002', 'Mejora: Dashboard lento', 'El dashboard tarda 5 segundos en cargar', 1, 2, 'RESUELTO', 'MEDIA', 'Dashboard debe cargar en menos de 2 segundos'),
    ('TEST-003', 'Validación: Reportes de proyecto', 'Se necesita generar reportes mensuales', 1, 2, 'RESUELTO', 'BAJA', 'Reportes en PDF y Excel'),
    ('TEST-004', 'Feature: Exportar a Excel', 'Agregar opción para exportar listados a Excel', 1, 2, 'EN_PROCESO', 'MEDIA', 'Exportar listados a formato XLSX')
ON CONFLICT (codigo_visual) DO NOTHING;

-- ============================================
-- VERIFICACIÓN Y DIAGNÓSTICO
-- ============================================

-- 5. Ver los usuarios que tienes registrados
SELECT 
    id_usuario, 
    email
FROM pr_usuarios 
ORDER BY id_usuario 
LIMIT 10;
