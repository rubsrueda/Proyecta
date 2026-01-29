-- ============================================================
-- EJECUCIÓN RÁPIDA: Pantalla Mantenimiento de Menús
-- Copia y pega este bloque completo en Supabase SQL Editor
-- ============================================================

-- PASO 1: Insertar la pantalla
INSERT INTO pr_sis_pantallas (
    codigo_pantalla,
    clave_nombre,
    ruta_archivo
) VALUES (
    'PAN_MENU_CATALOG',
    'Mantenimiento de Menús',
    'menuCatalog.js'
);

-- PASO 2: Ver el ID que se generó
SELECT id_pantalla, codigo_pantalla, clave_nombre 
FROM pr_sis_pantallas 
WHERE codigo_pantalla = 'PAN_MENU_CATALOG';

-- ============================================================
-- Después de ejecutar lo anterior, continúa con uno de estos:
-- ============================================================

-- OPCIÓN A: Si ya tienes un perfil "Administrador" o similar
-- Reemplaza 'TU_PERFIL_ADMIN' con el nombre exacto

-- Ver perfiles disponibles:
SELECT id_perfil, nombre_perfil FROM pr_sis_perfiles;

-- Ver menús disponibles:
SELECT id_menu, codigo_menu FROM pr_sis_menus;

-- OPCIÓN B: Asignación manual desde la aplicación
-- 1. Inicia sesión en la app
-- 2. Ve a "Arquitectura de Perfiles"
-- 3. Selecciona tu perfil de administrador
-- 4. Asigna menú "CONFIGURACION" (o créalo primero)
-- 5. Agrega la pantalla "Mantenimiento de Menús"
