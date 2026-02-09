# Proyecta

Los Defectos Actuales: 

 Estructura Jerárquica Dinámica por Perfil.
El modelo es: 1 Perfil -> N Menús (Agrupadores) -> N Pantallas (Funcionalidad).
Para lograr esto, necesitamos diseñar la "Pantalla de Arquitectura de Perfiles". Antes de escribir código, definamos cómo debe funcionar esta pantalla lógica y visualmente, y qué cambio requiere en la base de datos para que sea flexible (que tú decidas qué pantalla va en qué menú).
1. El Concepto de la Pantalla "Arquitectura de Perfiles"
Imagina una pantalla dividida en tres columnas o pasos lógicos:
COLUMNA 1: El Perfil (El Dueño)
Aquí creas "Superadmin", "Cliente", "Consultor".
Seleccionas uno para empezar a "dibujar" su sistema.
COLUMNA 2: Los Menús (Los Contenedores)
Aquí defines los agrupadores disponibles: "Finanzas", "Operación", "Soporte".
Acción: Arrastras o añades un menú al Perfil seleccionado.
Ejemplo: Al perfil "Cliente" le añado el menú "Soporte". Al "Admin" le añado "Soporte" y "Configuración".
COLUMNA 3: Las Pantallas (El Contenido)
Aquí están las 40 pantallas sueltas ("Alta Ticket", "Lista Usuarios", etc.).
Acción: Metes las pantallas DENTRO de los menús que asignaste en el paso 2.
Aquí se define el Nivel: Al meter la pantalla, dices si es (1) Ver o (2) Editar.
2. El Cambio Necesario en Base de Datos
Para que esto sea real y no estático, debemos romper la relación fija que teníamos antes.
Estado Actual (Rígido):
La tabla PR_SIS_PANTALLAS tiene una columna id_menu.
Problema: La pantalla "Alta Ticket" solo puede pertenecer a un menú a la vez.
Estado Nuevo (Dinámico - Lo que tú pides):
Necesitamos una tabla intermedia que diga "Para ESTE Perfil, ESTA Pantalla vive en ESTE Menú".
Propuesta de Estructura de Datos:
PR_SIS_PERFILES: (Igual) ID, Nombre.
PR_SIS_MENUS: (Catálogo puro) ID, NombreClave, Icono. (No tiene pantallas, es solo la definición del botón).
PR_SIS_PANTALLAS: (Catálogo puro) ID, NombreClave, ArchivoJS. (No tiene menú asignado).
PR_SEGURIDAD_CONFIG (La Tabla Maestra):
id_perfil (Quién)
id_menu (En qué botón)
id_pantalla (Qué ve)
orden (En qué posición sale)
nivel_acceso (1, 2, 3)
¿Qué permite esto?
Para el Perfil Admin, la pantalla "Usuarios" está en el menú "Configuración".
Para el Perfil RRHH, la pantalla "Usuarios" está en el menú "Personal".
Es la misma pantalla, en menús distintos, según el perfil.
3. Acuerdo sobre el Flujo de Trabajo
Si estás de acuerdo con esta lógica, el trabajo a realizar es:
Limpieza BD: Quitar la columna id_menu de la tabla de pantallas (para que sean libres).
Crear Tabla Maestra: Crear PR_SEGURIDAD_CONFIG.
Desarrollar la Pantalla: Crear profileArchitecture.js que permita:
Crear/Editar Perfiles.
Crear/Editar Menús (Nombre/Icono).
Vincular: Seleccionar Perfil -> Añadir Menú -> Añadir Pantallas a ese Menú.




-----------------------------------------------------------------------------------------------------------------------------------

ARQUITECTURA FUNCIONAL EXTENDIDA (V 2.0)
MÓDULO 1: NÚCLEO, SEGURIDAD Y COMPLIANCE (SOX)



Flujo del Ticket: 


ABIERTO → EN_PROCESO → RESUELTO → CERRADO
                ↑                      ↑
                └──────────────────────┘
           (Rechazo en validación)   (Aprobación con evaluación)




El cerebro administrativo. Aquí se definen las reglas del juego.

1. Gestión de Políticas de Seguridad (SOX)

Función: Parametrizar reglas de contraseñas para usuarios NO-Google.
Variables: Longitud mínima, complejidad (Mayús/Núm/Símbolo), caducidad (días), historial (no repetir las últimas 5), bloqueo por intentos fallidos.

2. Gestión de Diccionarios (i18n)

Función: No solo elegir idioma, sino editar las traducciones.
Acción: Una tabla donde el admin puede cambiar "Ticket" por "Incidencia" o "Boleta" según la cultura de la empresa, para Español, Inglés y Chino.

3. Configuración de Orígenes de Datos (Omnicanalidad)

Función: Configurar los "Listeners".
Email-to-Ticket: Configurar cuentas IMAP/API (ej: soporte@empresa.com) y reglas de parseo (Asunto = Título).
Google Calendar API: Configurar credenciales y frecuencia de sincronización bi-direccional.
4. Gestión de Organizaciones y Jerarquías

Función: Árbol de empresas. Flags de comportamiento (Asignación directa: SI/NO).
5. Matriz de Roles y Accesos (RBAC Dinámico)

Función: Constructor de perfiles. Asignación de menús y niveles (1, 2, 3) a las pantallas de este inventario.
6. Gestión de Usuarios y Accesos Híbridos

Función: Alta de usuario.
Switch Auth: Definir si el usuario entra por SSO Google (Corporativo) o Auth Propia (Externo con reglas SOX).

MÓDULO 2: FINANZAS Y RENTABILIDAD (El Negocio)

No solo importa si se trabajó, importa si fue rentable.

1. Gestión de Tarifas y Costos (Rate Cards)

Función: Definir cuánto cuesta una hora de un perfil (Costo Interno) y a cuánto se vende a un cliente (Precio Venta).
Versiones: Tarifas por Proyecto, por Cliente o por Seniority del Consultor.
2. Evaluación de Rentabilidad y Desempeño

Función: Reporte financiero. Comparativa: Horas Reportadas vs. Horas Facturables vs. Costo del Recurso.
KPIs: Margen por Proyecto, Margen por Consultor.
3. Gestión de Incentivos y Bonos

Función: Configuración de reglas (ej: "Si cierra X tickets con 5 estrellas = Bono"). Cálculo de devengos mensuales.

MÓDULO 3: SOPORTE OMNICANAL (Operación Reactiva)

El trabajo llega por muchas vías.

1. Bandeja de Entrada de Solicitudes No Clasificadas

Función: "Limbo" donde caen los emails que el sistema no supo asignar automáticamente. Un humano debe convertirlos a Tickets.
2. Alta de Ticket (Manual)

Función: Formulario estándar para uso interno o telefónico.
3. Mesa de Control y Despacho (Dispatcher)

Función: Asignación de tickets huérfanos.
4. Gestión del Ticket (Workspace)

Función: Chat, adjuntos, cronómetro.
5. Validación de Calidad y Cierre

Función: El cliente valida.
6. Gestión de SLAs y Escalaciones

Función: Configurar relojes. "Si prioridad es ALTA y pasan 4 horas sin respuesta -> Escalar a Gerente y enviar Email".

MÓDULO 4: FÁBRICA DE PROYECTOS (Metodología Dual)

Soporte para PMBOK y Agile.

1. Portafolio de Proyectos (Alta)

Configuración: Elegir Metodología: ¿Cascada (Waterfall) o Ágil? Esto cambia las pantallas siguientes.
2. Planificación WBS / Gantt (Modo Cascada)

Función: Árbol de tareas dependientes, rutas críticas y fechas fijas.
3. Tablero Kanban / Backlog (Modo Ágil)

Función: Gestión de Sprints. Columnas (To Do, Doing, Done). Movimiento de tarjetas.
Ceremonias: Pantalla de cierre de Sprint.
4. Gestión de Tareas (Detalle)

Función: Definición de la tarea, estimación de esfuerzo.
5. Control de Calidad (QA Proyectos)

Función: Validación de entregables por parte del PM o el Cliente.

MÓDULO 5: EL CONSULTOR Y SU ENTORNO (Ejecución)

Donde ocurre el trabajo real.

1. Mis Actividades (Inbox Unificado)

Función: Lista priorizada de Tickets + Tareas Waterfall + Tarjetas Ágiles.
2. Registro de Actividad No Planificada (Ad-Hoc)

Función: Botón de pánico/rápido. "Hice esto que nadie me pidió pero era necesario".
Lógica: Se obliga a vincularlo a un Centro de Costos o Bolsa de Horas General para no perder la facturación.
3. Sincronización con Google Calendar

Función: Pantalla de confirmación. "El sistema detectó estos eventos en tu calendario, ¿los convertimos en horas reportadas?".
Lógica: Importación masiva de tiempos desde el calendario.
4. Hoja de Tiempos (Timesheet)

Función: Vista semanal/mensual de horas para envío a aprobación.
5. Mi Termómetro (Gamificación)

Función: Dashboard personal.
Visual: Gráficos de velocímetro. "¿Cómo voy respecto a mi objetivo?", "Mis estrellas de satisfacción", "Mis retrasos". Badges o medallas por cumplimiento.

MÓDULO 6: CAPITAL HUMANO (RRHH)

Disponibilidad y Talento.

1. Gestión de Calendarios y Festivos

Función: Días inhábiles por geografía.
2. Gestión de Turnos y Esquemas Horarios

Función: Definición de jornadas.
3. Ausencias y Vacaciones

Función: Flujo de solicitud y aprobación.
4. Mapa de Habilidades (Skills Matrix)

Función: (Opcional pero recomendada) Definir qué sabe hacer cada consultor (ej: "Experto en Java"). Ayuda al coordinador a asignar mejor.

MÓDULO 7: INTELIGENCIA Y REPORTING

Salida de datos.

1. Generador de Reportes Personalizados

Función: El usuario elige columnas, filtros y agrupaciones para crear sus propios Excel/PDF.
2. Dashboard Ejecutivo (C-Level)

Función: Visión global de la compañía. Facturación estimada vs Real. Salud de los proyectos.
3. Reporte Operativo de Soporte

Función: Cumplimiento de SLAs, Volumen por tipo de incidente.
4. Reporte de Avance de Proyectos

Función: Curvas S, desviación de cronograma.
5. Auditoría del Sistema (Logs)

Función: (Seguridad) ¿Quién entró, cuándo y qué cambió? Trazabilidad total.


Ajustes en la Lógica Transversal

1. Seguridad de Contraseñas (SOX): Al crear el login (Módulo 1), implementaremos una validación por Regex que consulte la configuración de la Pantalla 1. Si la contraseña caducó, redirige forzosamente a pantalla de "Renovar Credenciales".
2. Integración Google: No es solo un login. Es un servicio en segundo plano (Worker) que lee la Pantalla 3 para saber a qué calendarios conectarse y sugerir tiempos en la Pantalla 23.
3. Flexibilidad de Tickets: Un ticket puede nacer de un correo (Pantalla 10), de una llamada (Pantalla 11) o de una alerta automática de un servidor (API).

ACTUALIZACIÓN MÓDULO 2: GESTIÓN COMERCIAL Y FACTURACIÓN

(Sustituye y amplía la versión anterior)

Este módulo es el "Padre Financiero" de los Tickets y Proyectos. Ninguna actividad debería existir si no hay un contrato o acuerdo comercial que la respalde (aunque sea interno).
35. Gestión de Contratos y Acuerdos Comerciales

Función: Es la pantalla "Madre". Aquí se digitaliza el contrato firmado.
Datos: Número de Contrato, Cliente, Fechas de Vigencia (Inicio/Fin), Valor Total del Contrato, Moneda.
Lógica: Un Cliente puede tener N Contratos activos simultáneamente (Ej: "Mantenimiento 2024" y "Proyecto Migración Cloud").

36. Configuración de Esquemas de Venta (El "Qué vendimos")

Aquí desglosamos la "letra chica" financiera del contrato. Se definen 3 tipos de productos:

A. Póliza de Servicio (Suscripción/Retainer):

Configuración: "Paga $X al mes".
Incluye: "Y horas de soporte mensual".
Regla: ¿Las horas no usadas se acumulan al mes siguiente o se pierden? (Rollover).
B. Bolsa de Horas (Pack Prepagado/Postpagado):

Configuración: "Pack de 100 Horas de Consultoría".
Regla: Se van descontando (burn-down) conforme se reportan tiempos.
C. Proyecto Cerrado (Llave en mano):

Configuración: "Precio fijo de $50,000 por el entregable final". Las horas son costo, no precio de venta directo (afectan margen, no factura directa).

37. Matriz de Tarifas y Roles (Rate Cards)

Función: Definir el valor del tiempo según quién lo hace y para qué. (Lo que pediste: "Horas de análisis vs Programación").
Variables:

Rol: Senior, Junior, Arquitecto, PM.
Actividad: Análisis, Desarrollo, Capacitación, Viaje.
Tarifa: Costo Interno (cuánto me cuesta el empleado) vs. Precio Venta (cuánto se le factura al cliente).
Jerarquía:

1. Tarifa Estándar de la Empresa.
2. Tarifa Específica del Cliente (Descuento negociado).
3. Tarifa Específica del Proyecto (Excepción).

38. Control de Saldos y Consumos (El "Ledger")

Función: Auditoría en tiempo real del dinero/horas.
Vista:

"Cliente Mondelez":

Bolsa Soporte: Compradas 100h | Consumidas 45h | Restantes 55h.
Proyecto A: Presupuesto $10k | Gastado $8k | Desviación: Alerta.
Lógica Crítica: Si el saldo llega a 0, el sistema puede (según config) bloquear la creación de nuevos tickets o solo lanzar una alerta comercial al Account Manager.

39. Generación de Pre-Factura

Función: El paso previo a enviar al sistema contable (o al PDF).
Acción: Cierre de Mes. El sistema barre todas las horas "Aprobadas/Validadas" y calcula:

(Horas Consultor Sr * Tarifa Sr) + (Horas Jr * Tarifa Jr)
- (Deducciones por Póliza)
#NAME?
Salida: Un detalle ("Anexo de Factura") que justifica cada centavo cobrado al cliente.


CÓMO SE CONECTA ESTO CON LA OPERACIÓN (La Lógica)

Para que esto funcione, debemos agregar una validación en la Pantalla 21 (Mis Actividades) y 24 (Timesheet):

1. El Consultor trabaja 2 horas.
2. Al reportarlas, el sistema verifica internamente:

¿A qué proyecto pertenece? 
→→
 Proyecto "App Móvil".

¿Qué contrato paga ese proyecto? 
→→
 Contrato "Desarrollo 2024".

¿Qué rol tiene el consultor? 
→→
 "Programador Senior".

¿Cuál es la tarifa pactada en la Pantalla 37 para ese rol en ese contrato? 
→→
 $80 USD/hr.

3. Resultado Financiero:

Costo Proyecto: +$40 USD (Costo nómina).
Valor Venta (Devengado): +$160 USD (Facturable).
Saldo Bolsa Horas: -2 horas.


RESUMEN DEL MAPA DEFINITIVO (40 PANTALLAS)

Con estas 5 pantallas adicionales en el Módulo 2, el sistema cubre el ciclo completo:

1. Venta (Contratos y Tarifas).
2. Configuración (Seguridad y Usuarios).
3. Planificación (Proyectos y Calendarios).
4. Ejecución (Tickets, Tareas, Sincronización Google).
5. Control (Validación, QA).
6. Cierre Financiero (Pre-factura y Rentabilidad).

1. RAÍZ Y CONFIGURACIÓN (El Esqueleto)		
        
Estos archivos ya existen en su mayoría, pero se actualizarán para soportar la nueva lógica.		
Archivo	Estado Actual	Función / Responsabilidad
index.html	✅ Existe	Pantalla de Login (Google + Email). Punto de entrada.
app.html	✅ Existe	Contenedor principal (Sidebar + Topbar + Workspace).
css/style.css	✅ Existe	Estilos base, colores variables y componentes generales.
css/layout.css	✅ Existe	Grid principal y responsividad móvil (Sidebar oculto).
js/config.js	✅ Existe	Credenciales Supabase y constantes globales (SYSTEM_CONFIG).
js/app.js	⚠️ Modificar	Bootstrapper: Inicia sesión, carga perfil y llama al Router (ya no tendrá switch).
        
2. NÚCLEO DEL SISTEMA (/js/core)		
		
El cerebro lógico. Aquí residen las reglas de negocio abstractas.		
Archivo	Estado Actual	Función / Responsabilidad
state.js	✅ Existe	Memoria Global: Almacena quién soy, mi Org, mi Perfil y mis Permisos para acceso rápido.
router.js	✅ Existe	Enrutador Dinámico: Lee la tabla pr_sis_pantallas, busca el archivo .js correspondiente y ejecuta su función render().
security.js	✅ Existe	Validador: Contiene funciones como canEdit(), canDelete() basadas en los Niveles 1, 2, 3.
utils.js	✅ Existe	Herramientas comunes: Formateo de fechas, moneda, validadores de email.
        
3. SERVICIOS DE DATOS (/js/services)		
		
La capa de conexión. Hablan con Supabase o APIs externas.		
Archivo	Estado Actual	Función / Responsabilidad
auth/login.js	✅ Existe	Login/Logout Google (aun no consolidado en authService.js).
menuService.js	✅ Existe	Construye el HTML del Sidebar leyendo permisos.
i18nService.js	✅ Existe	Descarga y aplica el diccionario de idiomas.
gmailService.js	✅ Existe	Conecta con API Gmail (Leer y Marcar leídos).
calendarService.js	✅ Existe	Sincroniza eventos de Google Calendar hacia pr_actividades.
financeService.js	✅ Existe	Cálculos de dinero: Busca tarifas, valida contratos y saldos.
projectService.js	❌ Crear	Cálculos de proyectos: Avance %, Rutas críticas, Dependencias.
        
4. PANTALLAS (/js/screens)		
        
La Interfaz de Usuario. Organizadas por Módulos Funcionales.		
4.1. Módulo Núcleo (Admin)		
Archivo	Código BD	Función
orgList.js	PAN_ORG_LIST	CRUD de Organizaciones y jerarquías.
userList.js	PAN_USER_LIST	CRUD de Usuarios y asignación de Perfiles.
securityMatrix.js	PAN_SEG_MATRIX	La Matriz: Asignar pantallas y niveles a perfiles.
catalogs.js	PAN_CATALOGOS	Gestión de listas desplegables (Prioridades, Tipos).
4.2. Módulo Finanzas (El Dinero)		
Archivo	Código BD	Función
contractList.js	PAN_CONTRATOS	Alta de contratos y esquemas de venta.
rateCards.js	PAN_TARIFAS	Definición de costos y precios por rol.
profitabilityReport.js	PAN_RENTABILIDAD	Reporte financiero (Costos vs Ventas).
4.3. Módulo Soporte (Animal A)		
Archivo	Código BD	Función
ticketList.js	PAN_TICKET_LIST	(Antes tickets.js) Listado y filtros de tickets.
ticketDetail.js	PAN_TICKET_DETALLE	(Existe) Chat, tiempos y gestión del ticket.
ticketCreate.js	PAN_TICKET_ALTA	Formulario aislado para crear tickets nuevos.
ticketDispatcher.js	PAN_MESA_AYUDA	Pantalla Drag&Drop para asignar tickets huérfanos.
ticketValidation.js	PAN_VALIDACION_SOP	Pantalla para el Cliente: Aprobar/Rechazar solución.
ticketValidationDirective.js	PAN_VALIDACION_DIRECTIVO	Pantalla Directivo: Validación general y auditoría.
messages.js	(Sin código BD)	Bandeja de entrada Gmail (Pre-Ticket).
4.4. Módulo Proyectos (Animal B)		
Archivo	Código BD	Función
projectList.js	PAN_PROY_LIST	Portafolio de proyectos (KPIs macro).
projectWBS.js	PAN_PROY_WBS	Árbol de tareas (Padres e Hijas). "Push" de tareas.
projectGantt.js	PAN_PROY_GANTT	Visualización temporal (Librería ligera o Canvas).
projectKanban.js	PAN_PROY_KANBAN	Tablero ágil (To Do / Doing / Done).
projectQA.js	PAN_QA_ENTREGAS	Validación de entregables para el PM.
4.5. Módulo Personal (El Consultor)		
Archivo	Código BD	Función
dashboard.js	PAN_DASHBOARD	Widgets de resumen al entrar.
myActivities.js	PAN_MIS_ACTIVIDADES	CRÍTICA: Inbox unificado (Tickets + Tareas).
timesheet.js	PAN_TIMESHEET	Calendario de reporte de horas semanal.
gamification.js	PAN_GAMIFICATION	Perfil del usuario con logros y estadísticas.
4.6. Módulo RRHH		
Archivo	Código BD	Función
calendars.js	PAN_CALENDARIOS	Definición de festivos por país/org.
shifts.js	PAN_TURNOS	Definición de horarios laborales.
absences.js	PAN_AUSENCIAS	Solicitud y aprobación de vacaciones.
4.7. Módulo Reporting		
Archivo	Código BD	Función
reportSupport.js	PAN_REP_SOPORTE	Gráficas de SLAs y volúmenes.
reportProjects.js	PAN_REP_PROYECTOS	Curvas S y avance financiero.

http://localhost:8000/index.html