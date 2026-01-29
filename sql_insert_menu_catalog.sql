}-- ============================================================
-- SCRIPT: Alta de Pantalla "Mantenimiento de Menús"
-- Fecha: 2026-01-29
-- Descripción: Inserta la nueva pantalla menuCatalog.js
-- ============================================================

-- 1. INSERTAR LA PANTALLA EN EL CATÁLOGO
-- Ajusta el código según tu nomenclatura actual
INSERT INTO pr_sis_pantallas (
    codigo_pantalla,
    clave_nombre,
    ruta_archivo,
    descripcion
) VALUES (
    'PAN_MENU_CATALOG',           -- Código único de la pantalla
    'Mantenimiento de Menús',     -- Nombre visible
    'menuCatalog.js',             -- Archivo JavaScript
    'CRUD de menús del sistema'   -- Descripción
)
ON CONFLICT (codigo_pantalla) DO NOTHING;

-- 2. OBTENER EL ID DE LA PANTALLA RECIÉN CREADA
-- (Para usarlo en los siguientes pasos)

-- 3. ASIGNAR A UN MENÚ (Ejemplo: CONFIGURACION)
-- Primero, verifica que existe un menú de configuración:
-- SELECT id_menu, codigo_menu FROM pr_sis_menus WHERE codigo_menu ILIKE '%config%';

-- Si ya tienes un menú "CONFIGURACION", usa este INSERT:
-- Reemplaza <ID_MENU_CONFIG> con el ID real de tu menú
-- Reemplaza <ID_PERFIL_ADMIN> con el ID del perfil administrador

INSERT INTO pr_sis_permisos_arbol (
    id_perfil,
    id_menu,
    id_pantalla,
    nivel_acceso,
    orden_menu,
    orden_pantalla
)
SELECT 
    p.id_perfil,                    -- Perfil (Administrador o Superadmin)
    m.id_menu,                       -- Menú de Configuración
    pan.id_pantalla,                 -- La pantalla recién creada
    3,                               -- Nivel 3 = Full (puede crear/editar/eliminar)
    10,                              -- Orden del menú (ajusta según necesites)
    10                               -- Orden de la pantalla dentro del menú
FROM pr_sis_perfiles p
CROSS JOIN pr_sis_menus m
CROSS JOIN pr_sis_pantallas pan
WHERE p.nombre_perfil ILIKE '%admin%'         -- Busca perfiles con "admin" en el nombre
  AND m.codigo_menu ILIKE '%config%'          -- Busca menú de configuración
  AND pan.codigo_pantalla = 'PAN_MENU_CATALOG'
ON CONFLICT (id_perfil, id_menu, id_pantalla) DO NOTHING;

-- ============================================================
-- VERIFICACIÓN (Ejecuta estas queries para confirmar)
-- ============================================================

-- Verificar que la pantalla se insertó:
SELECT * FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MENU_CATALOG';

-- Verificar que se asignó a algún perfil:
SELECT 
    prof.nombre_perfil,
    m.codigo_menu,
    pan.clave_nombre,
    perm.nivel_acceso
FROM pr_sis_permisos_arbol perm
JOIN pr_sis_perfiles prof ON perm.id_perfil = prof.id_perfil
JOIN pr_sis_menus m ON perm.id_menu = m.id_menu
JOIN pr_sis_pantallas pan ON perm.id_pantalla = pan.id_pantalla
WHERE pan.codigo_pantalla = 'PAN_MENU_CATALOG';

-- ============================================================
-- ALTERNATIVA: Si NO tienes menú de configuración
-- ============================================================

-- 1. Crea el menú primero:
INSERT INTO pr_sis_menus (
    codigo_menu,
    descripcion,
    icono,
    orden
) VALUES (
    'CONFIGURACION',
    'Configuración del Sistema',
    'settings',
    999
)
ON CONFLICT (codigo_menu) DO NOTHING;

-- 2. Luego ejecuta el INSERT de permisos de arriba

-- ============================================================
-- NOTAS IMPORTANTES
-- ============================================================
/*
1. Ajusta los nombres de columnas según tu esquema real
   - Algunos sistemas usan: codigo_pantalla, otros: clave_pantalla
   - Verifica con: SELECT * FROM pr_sis_pantallas LIMIT 1;

2. Si tu tabla pr_sis_pantallas NO tiene columna "descripcion", 
   elimínala del INSERT

3. Para ver qué perfiles existen:
   SELECT id_perfil, nombre_perfil FROM pr_sis_perfiles;

4. Para ver qué menús existen:
   SELECT id_menu, codigo_menu, icono FROM pr_sis_menus;

5. Si quieres asignar la pantalla manualmente:
   - Ve a la aplicación web
   - Abre "Arquitectura de Perfiles" (securityMatrix.js)
   - Selecciona un perfil
   - Asigna el menú "CONFIGURACION"
   - Agrega la pantalla "Mantenimiento de Menús"
*/
