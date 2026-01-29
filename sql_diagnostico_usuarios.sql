-- ============================================
-- DIAGNÓSTICO: Verificar estructura de pr_usuarios
-- ============================================

-- 1. Ver todas las columnas de pr_usuarios
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pr_usuarios'
ORDER BY ordinal_position;

-- 2. Ver algunos registros de pr_usuarios
SELECT * FROM pr_usuarios LIMIT 5;

-- 3. Verificar si existe relación con auth.users
SELECT 
    u.id as auth_id,
    u.email as auth_email,
    u.created_at,
    pu.*
FROM auth.users u
LEFT JOIN pr_usuarios pu ON pu.auth_user_id = u.id
LIMIT 5;

-- Si el LEFT JOIN no funciona, puede ser que la columna se llame diferente
-- Alternativas comunes:
-- - pu.user_id = u.id
-- - pu.id_usuario = u.id
-- - pu.email = u.email
