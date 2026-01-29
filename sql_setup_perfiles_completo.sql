-- ============================================================================
-- CONFIGURACIÓN INICIAL DE PERFILES Y PERMISOS
-- ============================================================================
-- Este script crea la estructura base de perfiles y asigna pantallas con
-- sus niveles de acceso (1=Ver, 2=Editar, 3=Administrar)
-- ============================================================================

-- 1. LIMPIAR DATOS PREVIOS (OPCIONAL - comentar si ya tienes datos)
-- DELETE FROM pr_sis_permisos_arbol;
-- DELETE FROM pr_sis_perfiles WHERE id_perfil > 0;
-- DELETE FROM pr_sis_menus WHERE id_menu > 0;

-- ============================================================================
-- 2. CREAR PERFILES BASE
-- ============================================================================

-- Nota: Estos INSERT se saltarán si ya existen perfiles con estos nombres
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') THEN
        INSERT INTO pr_sis_perfiles (nombre_perfil, descripcion) VALUES ('Superadmin', 'Acceso total al sistema');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_perfiles WHERE nombre_perfil = 'Administrador') THEN
        INSERT INTO pr_sis_perfiles (nombre_perfil, descripcion) VALUES ('Administrador', 'Gestión general sin configuración de sistema');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_perfiles WHERE nombre_perfil = 'Gerente') THEN
        INSERT INTO pr_sis_perfiles (nombre_perfil, descripcion) VALUES ('Gerente', 'Supervisión de proyectos y soporte');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_perfiles WHERE nombre_perfil = 'Consultor') THEN
        INSERT INTO pr_sis_perfiles (nombre_perfil, descripcion) VALUES ('Consultor', 'Ejecución de tareas y tickets');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_perfiles WHERE nombre_perfil = 'Cliente') THEN
        INSERT INTO pr_sis_perfiles (nombre_perfil, descripcion) VALUES ('Cliente', 'Solo lectura y validación');
    END IF;
END $$;

-- ============================================================================
-- 3. CREAR MENÚS AGRUPADORES
-- ============================================================================

-- Nota: Estos INSERT se saltarán si ya existen menús con estos códigos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pr_sis_menus WHERE codigo_menu = 'Configuración') THEN
        INSERT INTO pr_sis_menus (codigo_menu, icono, orden) VALUES ('Configuración', 'settings', 1);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_menus WHERE codigo_menu = 'Finanzas') THEN
        INSERT INTO pr_sis_menus (codigo_menu, icono, orden) VALUES ('Finanzas', 'payments', 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_menus WHERE codigo_menu = 'Soporte') THEN
        INSERT INTO pr_sis_menus (codigo_menu, icono, orden) VALUES ('Soporte', 'support_agent', 3);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') THEN
        INSERT INTO pr_sis_menus (codigo_menu, icono, orden) VALUES ('Proyectos', 'folder_open', 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_menus WHERE codigo_menu = 'Personal') THEN
        INSERT INTO pr_sis_menus (codigo_menu, icono, orden) VALUES ('Personal', 'person', 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_menus WHERE codigo_menu = 'RRHH') THEN
        INSERT INTO pr_sis_menus (codigo_menu, icono, orden) VALUES ('RRHH', 'groups', 6);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pr_sis_menus WHERE codigo_menu = 'Reportes') THEN
        INSERT INTO pr_sis_menus (codigo_menu, icono, orden) VALUES ('Reportes', 'analytics', 7);
    END IF;
END $$;

-- ============================================================================
-- 4. ASIGNAR PERMISOS: PERFIL SUPERADMIN
-- Acceso TOTAL nivel 3 a todas las pantallas
-- ============================================================================

INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Configuración') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_ORG_LIST', 'PAN_USER_LIST', 'PAN_SEG_MATRIX', 'PAN_CATALOGOS')
ON CONFLICT DO NOTHING;

INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Finanzas') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_CONTRATOS', 'PAN_TARIFAS', 'PAN_RENTABILIDAD')
ON CONFLICT DO NOTHING;

INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Soporte') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_TICKET_LIST', 'PAN_TICKET_DETALLE', 'PAN_TICKET_ALTA', 
                          'PAN_MESA_AYUDA', 'PAN_VALIDACION_SOP', 'PAN_INBOX_GMAIL')
ON CONFLICT DO NOTHING;

INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_PROY_LIST', 'PAN_PROY_WBS', 'PAN_PROY_GANTT', 
                          'PAN_PROY_KANBAN', 'PAN_QA_ENTREGAS')
ON CONFLICT DO NOTHING;

INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Personal') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_DASHBOARD', 'PAN_MIS_ACTIVIDADES', 'PAN_TIMESHEET', 'PAN_GAMIFICATION')
ON CONFLICT DO NOTHING;

INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'RRHH') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_CALENDARIOS', 'PAN_TURNOS', 'PAN_AUSENCIAS')
ON CONFLICT DO NOTHING;

INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Superadmin') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Reportes') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_REP_SOPORTE', 'PAN_REP_PROYECTOS')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. ASIGNAR PERMISOS: PERFIL ADMINISTRADOR
-- Sin configuración de sistema pero con gestión completa
-- ============================================================================

-- Finanzas (nivel 2 - editar)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Administrador') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Finanzas') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_CONTRATOS', 'PAN_TARIFAS', 'PAN_RENTABILIDAD')
ON CONFLICT DO NOTHING;

-- Soporte (nivel 3 - administrar)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Administrador') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Soporte') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_TICKET_LIST', 'PAN_TICKET_DETALLE', 'PAN_TICKET_ALTA', 
                          'PAN_MESA_AYUDA', 'PAN_VALIDACION_SOP')
ON CONFLICT DO NOTHING;

-- Proyectos (nivel 3 - administrar)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Administrador') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') as id_menu,
    id_pantalla,
    3 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_PROY_LIST', 'PAN_PROY_WBS', 'PAN_PROY_GANTT', 
                          'PAN_PROY_KANBAN', 'PAN_QA_ENTREGAS')
ON CONFLICT DO NOTHING;

-- Personal (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Administrador') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Personal') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_DASHBOARD', 'PAN_MIS_ACTIVIDADES', 'PAN_TIMESHEET', 'PAN_GAMIFICATION')
ON CONFLICT DO NOTHING;

-- RRHH (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Administrador') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'RRHH') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_CALENDARIOS', 'PAN_TURNOS', 'PAN_AUSENCIAS')
ON CONFLICT DO NOTHING;

-- Reportes (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Administrador') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Reportes') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_REP_SOPORTE', 'PAN_REP_PROYECTOS')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. ASIGNAR PERMISOS: PERFIL GERENTE
-- Supervisión de equipos y proyectos
-- ============================================================================

-- Soporte (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Gerente') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Soporte') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_TICKET_LIST', 'PAN_TICKET_DETALLE', 'PAN_MESA_AYUDA', 'PAN_VALIDACION_SOP')
ON CONFLICT DO NOTHING;

-- Proyectos (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Gerente') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_PROY_LIST', 'PAN_PROY_WBS', 'PAN_PROY_GANTT', 'PAN_PROY_KANBAN')
ON CONFLICT DO NOTHING;

-- Personal (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Gerente') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Personal') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_DASHBOARD', 'PAN_MIS_ACTIVIDADES', 'PAN_TIMESHEET')
ON CONFLICT DO NOTHING;

-- Reportes (nivel 1 - solo ver)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Gerente') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Reportes') as id_menu,
    id_pantalla,
    1 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_REP_SOPORTE', 'PAN_REP_PROYECTOS')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ASIGNAR PERMISOS: PERFIL CONSULTOR
-- Ejecución de trabajo
-- ============================================================================

-- Soporte (nivel 2 - trabajar tickets)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Consultor') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Soporte') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_TICKET_LIST', 'PAN_TICKET_DETALLE', 'PAN_TICKET_ALTA')
ON CONFLICT DO NOTHING;

-- Proyectos (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Consultor') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_PROY_KANBAN')
ON CONFLICT DO NOTHING;

-- Personal (nivel 2)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Consultor') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Personal') as id_menu,
    id_pantalla,
    2 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_DASHBOARD', 'PAN_MIS_ACTIVIDADES', 'PAN_TIMESHEET', 'PAN_GAMIFICATION')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. ASIGNAR PERMISOS: PERFIL CLIENTE
-- Solo lectura y validación
-- ============================================================================

-- Soporte (nivel 1 - solo ver + validación)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Cliente') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Soporte') as id_menu,
    id_pantalla,
    CASE 
        WHEN codigo_pantalla = 'PAN_VALIDACION_SOP' THEN 2
        ELSE 1
    END as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_TICKET_LIST', 'PAN_TICKET_DETALLE', 'PAN_VALIDACION_SOP')
ON CONFLICT DO NOTHING;

-- Proyectos (nivel 1 - solo ver)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Cliente') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') as id_menu,
    id_pantalla,
    1 as nivel_acceso
FROM pr_sis_pantallas 
WHERE codigo_pantalla IN ('PAN_PROY_LIST')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. VERIFICACIÓN
-- ============================================================================

SELECT 
    p.nombre_perfil,
    m.codigo_menu as menu,
    COUNT(*) as total_pantallas
FROM pr_sis_permisos_arbol pa
JOIN pr_sis_perfiles p ON p.id_perfil = pa.id_perfil
JOIN pr_sis_menus m ON m.id_menu = pa.id_menu
GROUP BY p.nombre_perfil, m.codigo_menu
ORDER BY p.nombre_perfil, m.codigo_menu;
