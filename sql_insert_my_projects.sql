-- Insertar pantalla "Mis Proyectos" en la tabla pr_sis_pantallas
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo)
SELECT 'PAN_MIS_PROYECTOS', 'Mis Proyectos', 'myProjects.js'
WHERE NOT EXISTS (SELECT 1 FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MIS_PROYECTOS');

-- Asignar permisos para Cliente (Perfil 5) - ver mis proyectos
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Cliente') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') as id_menu,
    (SELECT id_pantalla FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MIS_PROYECTOS') as id_pantalla,
    1 as nivel_acceso
WHERE NOT EXISTS (
    SELECT 1 FROM pr_sis_permisos_arbol 
    WHERE id_perfil = (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Cliente')
    AND id_pantalla = (SELECT id_pantalla FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MIS_PROYECTOS')
);

-- Asignar permisos para Consultor (Perfil 4) - editar mis proyectos
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Consultor') as id_perfil,
    (SELECT id_menu FROM pr_sis_menus WHERE codigo_menu = 'Proyectos') as id_menu,
    (SELECT id_pantalla FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MIS_PROYECTOS') as id_pantalla,
    2 as nivel_acceso
WHERE NOT EXISTS (
    SELECT 1 FROM pr_sis_permisos_arbol 
    WHERE id_perfil = (SELECT id_perfil FROM pr_sis_perfiles WHERE nombre_perfil = 'Consultor')
    AND id_pantalla = (SELECT id_pantalla FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MIS_PROYECTOS')
);

-- Verificación
SELECT 
    'Pantalla creada' as resultado,
    COUNT(*) as total_pantallas
FROM pr_sis_pantallas 
WHERE codigo_pantalla = 'PAN_MIS_PROYECTOS';
