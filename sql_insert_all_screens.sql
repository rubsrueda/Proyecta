-- Insertar todas las pantallas del sistema
-- Ejecutar en Supabase SQL Editor

-- 1. MÓDULO NÚCLEO
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo) VALUES
('PAN_ORG_LIST', 'Gestión de Organizaciones', 'orgList.js'),
('PAN_USER_LIST', 'Gestión de Usuarios', 'userList.js'),
('PAN_SEG_MATRIX', 'Matriz de Seguridad', 'securityMatrix.js'),
('PAN_CATALOGOS', 'Gestión de Catálogos', 'catalogs.js')
ON CONFLICT(codigo_pantalla) DO NOTHING;

-- 2. MÓDULO FINANZAS
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo) VALUES
('PAN_CONTRATOS', 'Gestión de Contratos', 'contractList.js'),
('PAN_TARIFAS', 'Matriz de Tarifas', 'rateCards.js'),
('PAN_RENTABILIDAD', 'Reporte de Rentabilidad', 'profitabilityReport.js')
ON CONFLICT(codigo_pantalla) DO NOTHING;

-- 3. MÓDULO SOPORTE
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo) VALUES
('PAN_TICKET_LIST', 'Lista de Tickets', 'ticketList.js'),
('PAN_TICKET_DETALLE', 'Detalle de Ticket', 'ticketDetail.js'),
('PAN_TICKET_ALTA', 'Crear Ticket', 'ticketCreate.js'),
('PAN_MESA_AYUDA', 'Mesa de Control', 'ticketDispatcher.js'),
('PAN_VALIDACION_SOP', 'Validación de Soporte', 'ticketValidation.js'),
('PAN_INBOX_GMAIL', 'Bandeja de Entrada', 'inboxGmail.js')
ON CONFLICT(codigo_pantalla) DO NOTHING;

-- 4. MÓDULO PROYECTOS
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo) VALUES
('PAN_PROY_LIST', 'Portafolio de Proyectos', 'projectList.js'),
('PAN_PROY_WBS', 'WBS de Proyecto', 'projectWBS.js'),
('PAN_PROY_GANTT', 'Gantt de Proyecto', 'projectGantt.js'),
('PAN_PROY_KANBAN', 'Kanban de Proyecto', 'projectKanban.js'),
('PAN_QA_ENTREGAS', 'QA de Entregas', 'projectQA.js')
ON CONFLICT(codigo_pantalla) DO NOTHING;

-- 5. MÓDULO PERSONAL
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo) VALUES
('PAN_DASHBOARD', 'Dashboard', 'dashboard.js'),
('PAN_MIS_ACTIVIDADES', 'Mis Actividades', 'myActivities.js'),
('PAN_TIMESHEET', 'Reporte de Horas', 'timesheet.js'),
('PAN_GAMIFICATION', 'Mi Perfil', 'gamification.js')
ON CONFLICT(codigo_pantalla) DO NOTHING;

-- 6. MÓDULO RRHH
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo) VALUES
('PAN_CALENDARIOS', 'Calendarios', 'calendars.js'),
('PAN_TURNOS', 'Turnos', 'shifts.js'),
('PAN_AUSENCIAS', 'Ausencias', 'absences.js')
ON CONFLICT(codigo_pantalla) DO NOTHING;

-- 7. MÓDULO REPORTING
INSERT INTO pr_sis_pantallas (codigo_pantalla, clave_nombre, ruta_archivo) VALUES
('PAN_REP_SOPORTE', 'Reporte de Soporte', 'reportSupport.js'),
('PAN_REP_PROYECTOS', 'Reporte de Proyectos', 'reportProjects.js'),
('PAN_CATALOGO_MENUS', 'Catálogo de Menús', 'menuCatalog.js'),
('PAN_CONFIG_MENU', 'Configuración de Menú', 'configMenu.js')
ON CONFLICT(codigo_pantalla) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT codigo_pantalla, nombre_pantalla FROM pr_sis_pantallas ORDER BY codigo_pantalla;
