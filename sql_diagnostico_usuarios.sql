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
-- Probando diferentes columnas comunes

-- Intento 1: por user_id
SELECT 
    u.id as auth_id,
    u.email as auth_email,
    pu.*
FROM auth.users u
LEFT JOIN pr_usuarios pu ON pu.user_id = u.id
LIMIT 5;

-- Intento 2: por id_usuario (si es UUID y coincide)
SELECT 
    u.id as auth_id,
    u.email as auth_email,
    pu.*
FROM auth.users u
LEFT JOIN pr_usuarios pu ON pu.id_usuario = u.id
LIMIT 5;

-- Intento 3: por email (si existe columna email en pr_usuarios)
SELECT 
    u.id as auth_id,
    u.email as auth_email,
    pu.*
FROM auth.users u
LEFT JOIN pr_usuarios pu ON pu.email = u.email
LIMIT 5;
