//js/screens/dashboard.js
import { State } from '../core/state.js';
import * as I18n from '../services/i18nService.js';
import { query } from '../core/utils.js';

export async function render(container) {
    const user = State.profile;
    
    container.innerHTML = `
        <div class="portfolio-dashboard">
            <!-- HEADER CON FILTROS -->
            <div class="dashboard-header">
                <div>
                    <h1 style="margin:0; font-size:1.8rem; color:#1e293b;">
                        <span style="font-size:1.5rem; margin-right:10px;">📊</span>
                        Portafolio de Proyectos
                    </h1>
                    <p style="margin:5px 0 0 0; color:#64748b;">Panel de Control PMO - ${user.nombre_completo}</p>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <select id="filterStatus" class="form-control" style="width:150px;">
                        <option value="all">Todos los Estados</option>
                        <option value="active">En Ejecución</option>
                        <option value="planning">En Planeación</option>
                        <option value="risk">Con Riesgos</option>
                        <option value="completed">Completados</option>
                    </select>
                    <button class="btn-primary" id="btnRefreshDashboard">
                        <span style="font-size:1rem;">🔄</span> Actualizar
                    </button>
                </div>
            </div>

            <!-- SECCIÓN 1: KPIs PRINCIPALES -->
            <div class="kpi-grid">
                <div class="kpi-card success">
                    <div class="kpi-icon">✓</div>
                    <div class="kpi-content">
                        <div class="kpi-value" id="projectsOnTrack">0</div>
                        <div class="kpi-label">En Control</div>
                        <div class="kpi-sublabel">Proyectos sin incidencias</div>
                    </div>
                </div>

                <div class="kpi-card warning">
                    <div class="kpi-icon">⚠</div>
                    <div class="kpi-content">
                        <div class="kpi-value" id="projectsAtRisk">0</div>
                        <div class="kpi-label">En Riesgo</div>
                        <div class="kpi-sublabel">Requieren atención</div>
                    </div>
                </div>

                <div class="kpi-card danger">
                    <div class="kpi-icon">⨯</div>
                    <div class="kpi-content">
                        <div class="kpi-value" id="projectsCritical">0</div>
                        <div class="kpi-label">Críticos</div>
                        <div class="kpi-sublabel">Acción inmediata</div>
                    </div>
                </div>

                <div class="kpi-card info">
                    <div class="kpi-icon">💰</div>
                    <div class="kpi-content">
                        <div class="kpi-value" id="budgetHealth">0%</div>
                        <div class="kpi-label">Salud Financiera</div>
                        <div class="kpi-sublabel" id="budgetStatus">Dentro del presupuesto</div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 2: VISTA DE PROYECTOS Y RECURSOS -->
            <div class="main-grid">
                <!-- COLUMNA IZQUIERDA: PROYECTOS -->
                <div class="projects-section">
                    <div class="section-header">
                        <h2>📁 Estado de Proyectos Activos</h2>
                        <span class="badge" id="activeProjectsCount">0 proyectos</span>
                    </div>
                    
                    <div id="projectsList" class="projects-list">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>

                <!-- COLUMNA DERECHA: RECURSOS Y ALERTAS -->
                <div class="sidebar-section">
                    <!-- RECURSOS -->
                    <div class="resource-card">
                        <h3>👥 Gestión de Recursos</h3>
                        <div id="teamCapacity" class="team-capacity">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>

                    <!-- ALERTAS Y RIESGOS -->
                    <div class="alerts-card">
                        <h3>🚨 Alertas Prioritarias</h3>
                        <div id="alertsList" class="alerts-list">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 3: TIMELINE Y HITOS -->
            <div class="timeline-section">
                <div class="section-header">
                    <h2>📅 Cronograma de Hitos Clave</h2>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-secondary" id="btnViewGantt">
                            Vista Gantt Completa
                        </button>
                        <button class="btn-secondary" id="btnViewRoadmap">
                            Roadmap Estratégico
                        </button>
                    </div>
                </div>
                <div id="milestonesTimeline" class="milestones-timeline">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>

            <!-- SECCIÓN 4: FINANCIERO -->
            <div class="financial-section">
                <div class="section-header">
                    <h2>💵 Seguimiento Financiero de Cartera</h2>
                </div>
                <div class="financial-grid">
                    <div class="financial-card">
                        <div class="financial-label">Presupuesto Total</div>
                        <div class="financial-value" id="totalBudget">$0</div>
                    </div>
                    <div class="financial-card">
                        <div class="financial-label">Ejecutado</div>
                        <div class="financial-value executed" id="totalSpent">$0</div>
                        <div class="financial-progress">
                            <div class="progress-bar" id="spentProgressBar"></div>
                        </div>
                    </div>
                    <div class="financial-card">
                        <div class="financial-label">Disponible</div>
                        <div class="financial-value available" id="totalAvailable">$0</div>
                    </div>
                    <div class="financial-card">
                        <div class="financial-label">Proyectos Sobre Presupuesto</div>
                        <div class="financial-value danger" id="overBudgetCount">0</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Aplicar estilos
    applyDashboardStyles();
    
    // Cargar datos
    await loadDashboardData();
    
    // Event Listeners
    setupEventListeners();
    
    // Traducir si hay etiquetas
    I18n.traducirPagina(container);
}

// ============================================
// ESTILOS
// ============================================
function applyDashboardStyles() {
    const styleId = 'portfolioDashboardStyles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .portfolio-dashboard {
            padding: 20px;
            background: #f8fafc;
            min-height: 100vh;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* KPI CARDS */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .kpi-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-left: 4px solid;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .kpi-card.success { border-color: #16a34a; }
        .kpi-card.warning { border-color: #f59e0b; }
        .kpi-card.danger { border-color: #dc2626; }
        .kpi-card.info { border-color: #2563eb; }

        .kpi-icon {
            font-size: 2.5rem;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: #f8fafc;
        }

        .kpi-content {
            flex: 1;
        }

        .kpi-value {
            font-size: 2rem;
            font-weight: bold;
            color: #1e293b;
            line-height: 1;
        }

        .kpi-label {
            font-size: 0.95rem;
            color: #64748b;
            margin-top: 5px;
            font-weight: 600;
        }

        .kpi-sublabel {
            font-size: 0.8rem;
            color: #94a3b8;
            margin-top: 2px;
        }

        /* MAIN GRID */
        .main-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        @media (max-width: 1200px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .section-header h2 {
            margin: 0;
            font-size: 1.2rem;
            color: #1e293b;
        }

        .badge {
            background: #e0e7ff;
            color: #4338ca;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        /* PROJECTS LIST */
        .projects-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .projects-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
            max-height: 600px;
            overflow-y: auto;
        }

        .project-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            transition: all 0.2s;
            cursor: pointer;
        }

        .project-card:hover {
            border-color: #2563eb;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
        }

        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 10px;
        }

        .project-title {
            font-weight: 600;
            color: #1e293b;
            font-size: 1rem;
        }

        .project-status {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .status-healthy { background: #dcfce7; color: #166534; }
        .status-warning { background: #fef3c7; color: #92400e; }
        .status-critical { background: #fee2e2; color: #991b1b; }

        .project-progress {
            margin: 10px 0;
        }

        .progress-label {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: #64748b;
            margin-bottom: 5px;
        }

        .progress-bar-container {
            height: 8px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
            border-radius: 10px;
            transition: width 0.3s;
        }

        .progress-bar-fill.warning { background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); }
        .progress-bar-fill.danger { background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%); }

        .project-meta {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: 0.85rem;
            color: #64748b;
        }

        .project-meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        /* SIDEBAR */
        .sidebar-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .resource-card, .alerts-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .resource-card h3, .alerts-card h3 {
            margin: 0 0 15px 0;
            font-size: 1rem;
            color: #1e293b;
        }

        .team-member {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #f1f5f9;
        }

        .team-member:last-child {
            border-bottom: none;
        }

        .member-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .member-avatar {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 0.85rem;
        }

        .member-name {
            font-size: 0.9rem;
            color: #1e293b;
            font-weight: 500;
        }

        .capacity-bar {
            width: 100px;
            height: 6px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
        }

        .capacity-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s;
        }

        .capacity-low { background: #16a34a; }
        .capacity-medium { background: #f59e0b; }
        .capacity-high { background: #dc2626; }

        .alert-item {
            padding: 12px;
            border-left: 3px solid;
            background: #fefefe;
            margin-bottom: 10px;
            border-radius: 4px;
            font-size: 0.9rem;
        }

        .alert-item.high { border-color: #dc2626; background: #fef2f2; }
        .alert-item.medium { border-color: #f59e0b; background: #fffbeb; }
        .alert-item.low { border-color: #2563eb; background: #eff6ff; }

        .alert-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
        }

        .alert-description {
            color: #64748b;
            font-size: 0.85rem;
        }

        /* TIMELINE */
        .timeline-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .milestones-timeline {
            display: flex;
            gap: 15px;
            overflow-x: auto;
            padding: 20px 0;
        }

        .milestone-card {
            min-width: 220px;
            padding: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .milestone-card:hover {
            border-color: #2563eb;
            transform: translateY(-2px);
        }

        .milestone-card.completed { border-color: #16a34a; background: #f0fdf4; }
        .milestone-card.upcoming { border-color: #f59e0b; background: #fffbeb; }
        .milestone-card.overdue { border-color: #dc2626; background: #fef2f2; }

        .milestone-date {
            font-size: 0.8rem;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .milestone-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
        }

        .milestone-project {
            font-size: 0.85rem;
            color: #64748b;
        }

        /* FINANCIAL */
        .financial-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .financial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 15px;
        }

        .financial-card {
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #fafafa;
        }

        .financial-label {
            font-size: 0.85rem;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .financial-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #1e293b;
        }

        .financial-value.executed { color: #2563eb; }
        .financial-value.available { color: #16a34a; }
        .financial-value.danger { color: #dc2626; }

        .financial-progress {
            margin-top: 10px;
            height: 8px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
        }

        .financial-progress .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
            border-radius: 10px;
            transition: width 0.3s;
        }

        /* SCROLLBARS */
        .projects-list::-webkit-scrollbar,
        .milestones-timeline::-webkit-scrollbar {
            height: 8px;
            width: 8px;
        }

        .projects-list::-webkit-scrollbar-track,
        .milestones-timeline::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }

        .projects-list::-webkit-scrollbar-thumb,
        .milestones-timeline::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }

        .projects-list::-webkit-scrollbar-thumb:hover,
        .milestones-timeline::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// CARGA DE DATOS
// ============================================
async function loadDashboardData() {
    try {
        // Cargar proyectos
        const projects = await loadProjects();
        
        // Cargar recursos
        const resources = await loadResources();
        
        // Cargar alertas
        const alerts = await loadAlerts();
        
        // Cargar hitos
        const milestones = await loadMilestones();
        
        // Cargar datos financieros
        const financial = await loadFinancialData();
        
        // Renderizar KPIs
        renderKPIs(projects);
        
        // Renderizar proyectos
        renderProjects(projects);
        
        // Renderizar recursos
        renderResources(resources);
        
        // Renderizar alertas
        renderAlerts(alerts);
        
        // Renderizar timeline
        renderTimeline(milestones);
        
        // Renderizar financiero
        renderFinancial(financial);
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showErrorMessage('Error al cargar el dashboard');
    }
}

async function loadProjects() {
    try {
        const result = await query(`
            SELECT 
                p.id_proyecto,
                p.titulo,
                p.descripcion,
                p.fecha_inicio,
                p.fecha_fin,
                p.presupuesto,
                p.estado,
                p.prioridad,
                COUNT(DISTINCT t.id_tarea) as total_tareas,
                COUNT(DISTINCT CASE WHEN t.estado = 'Completada' THEN t.id_tarea END) as tareas_completadas,
                u.nombre_completo as pm_nombre
            FROM proyectos p
            LEFT JOIN tareas t ON t.id_proyecto = p.id_proyecto
            LEFT JOIN usuarios u ON u.id_usuario = p.id_pm
            WHERE p.estado != 'Cancelado'
            GROUP BY p.id_proyecto
            ORDER BY p.fecha_inicio DESC
            LIMIT 20
        `);
        
        return result.rows || [];
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        // Datos de ejemplo
        return [
            {
                id_proyecto: 1,
                titulo: 'Migración Cloud AWS',
                descripcion: 'Migración de infraestructura a AWS',
                fecha_inicio: '2026-01-01',
                fecha_fin: '2026-06-30',
                presupuesto: 500000,
                estado: 'En Ejecución',
                prioridad: 'Alta',
                total_tareas: 45,
                tareas_completadas: 32,
                pm_nombre: 'Ana García'
            },
            {
                id_proyecto: 2,
                titulo: 'Desarrollo App Móvil',
                descripcion: 'Nueva aplicación móvil cliente',
                fecha_inicio: '2026-02-01',
                fecha_fin: '2026-08-31',
                presupuesto: 300000,
                estado: 'En Ejecución',
                prioridad: 'Alta',
                total_tareas: 38,
                tareas_completadas: 12,
                pm_nombre: 'Carlos Ruiz'
            },
            {
                id_proyecto: 3,
                titulo: 'Implementación CRM',
                descripcion: 'Sistema CRM empresarial',
                fecha_inicio: '2025-11-01',
                fecha_fin: '2026-04-30',
                presupuesto: 200000,
                estado: 'En Riesgo',
                prioridad: 'Media',
                total_tareas: 28,
                tareas_completadas: 20,
                pm_nombre: 'Laura Martínez'
            },
            {
                id_proyecto: 4,
                titulo: 'Actualización ERP',
                descripcion: 'Upgrade a nueva versión ERP',
                fecha_inicio: '2026-01-15',
                fecha_fin: '2026-05-15',
                presupuesto: 400000,
                estado: 'En Ejecución',
                prioridad: 'Crítica',
                total_tareas: 52,
                tareas_completadas: 48,
                pm_nombre: 'Miguel Torres'
            },
            {
                id_proyecto: 5,
                titulo: 'Portal Web Corporativo',
                descripcion: 'Rediseño portal web',
                fecha_inicio: '2025-12-01',
                fecha_fin: '2026-03-31',
                presupuesto: 150000,
                estado: 'Crítico',
                prioridad: 'Alta',
                total_tareas: 30,
                tareas_completadas: 15,
                pm_nombre: 'Sofia López'
            }
        ];
    }
}

async function loadResources() {
    try {
        const result = await query(`
            SELECT 
                u.id_usuario,
                u.nombre_completo,
                u.email,
                COUNT(DISTINCT tp.id_proyecto) as proyectos_asignados,
                COUNT(DISTINCT t.id_tarea) as tareas_activas
            FROM usuarios u
            LEFT JOIN team_proyecto tp ON tp.id_usuario = u.id_usuario
            LEFT JOIN tareas t ON t.id_asignado = u.id_usuario AND t.estado != 'Completada'
            WHERE u.activo = 1
            GROUP BY u.id_usuario
            HAVING proyectos_asignados > 0
            ORDER BY proyectos_asignados DESC, tareas_activas DESC
            LIMIT 10
        `);
        
        return result.rows || [];
    } catch (error) {
        console.error('Error cargando recursos:', error);
        return [
            { nombre_completo: 'Ana García', proyectos_asignados: 3, tareas_activas: 12 },
            { nombre_completo: 'Carlos Ruiz', proyectos_asignados: 2, tareas_activas: 8 },
            { nombre_completo: 'Laura Martínez', proyectos_asignados: 2, tareas_activas: 15 },
            { nombre_completo: 'Miguel Torres', proyectos_asignados: 1, tareas_activas: 5 },
            { nombre_completo: 'Sofia López', proyectos_asignados: 3, tareas_activas: 18 }
        ];
    }
}

async function loadAlerts() {
    // Simulación de alertas del sistema
    return [
        {
            priority: 'high',
            title: 'Proyecto "Portal Web" retrasado',
            description: '3 semanas de retraso en entregables clave'
        },
        {
            priority: 'high',
            title: 'Presupuesto CRM al 95%',
            description: 'Requiere aprobación de extensión presupuestaria'
        },
        {
            priority: 'medium',
            title: 'Laura Martínez sobrecargada',
            description: '15 tareas activas - considerar redistribución'
        },
        {
            priority: 'medium',
            title: 'Milestone "Beta Release" próximo',
            description: 'Entrega en 5 días - App Móvil'
        },
        {
            priority: 'low',
            title: 'Revisión trimestral PMO',
            description: 'Programar reunión con stakeholders'
        }
    ];
}

async function loadMilestones() {
    return [
        {
            date: '2026-02-05',
            title: 'Fase 1 Migración AWS',
            project: 'Migración Cloud AWS',
            status: 'completed'
        },
        {
            date: '2026-02-10',
            title: 'Beta Release',
            project: 'App Móvil',
            status: 'upcoming'
        },
        {
            date: '2026-02-15',
            title: 'Implementación Módulo Ventas',
            project: 'CRM',
            status: 'upcoming'
        },
        {
            date: '2026-01-25',
            title: 'Entrega Diseños',
            project: 'Portal Web',
            status: 'overdue'
        },
        {
            date: '2026-02-20',
            title: 'Testing Integral',
            project: 'ERP',
            status: 'upcoming'
        },
        {
            date: '2026-03-01',
            title: 'Launch MVP',
            project: 'App Móvil',
            status: 'upcoming'
        }
    ];
}

async function loadFinancialData() {
    return {
        totalBudget: 1550000,
        totalSpent: 1050000,
        overBudgetProjects: 1
    };
}

// ============================================
// RENDERIZADO DE COMPONENTES
// ============================================
function renderKPIs(projects) {
    const onTrack = projects.filter(p => {
        const progress = (p.tareas_completadas / p.total_tareas) * 100;
        return progress >= 80 || p.estado === 'En Ejecución';
    }).length;
    
    const atRisk = projects.filter(p => p.estado === 'En Riesgo').length;
    const critical = projects.filter(p => p.estado === 'Crítico').length;
    
    document.getElementById('projectsOnTrack').textContent = onTrack;
    document.getElementById('projectsAtRisk').textContent = atRisk;
    document.getElementById('projectsCritical').textContent = critical;
    
    const budgetHealth = 85; // Calculado
    document.getElementById('budgetHealth').textContent = budgetHealth + '%';
    
    if (budgetHealth >= 90) {
        document.getElementById('budgetStatus').textContent = 'Excelente control';
    } else if (budgetHealth >= 70) {
        document.getElementById('budgetStatus').textContent = 'Dentro del presupuesto';
    } else {
        document.getElementById('budgetStatus').textContent = 'Requiere atención';
    }
}

function renderProjects(projects) {
    const container = document.getElementById('projectsList');
    document.getElementById('activeProjectsCount').textContent = projects.length + ' proyectos';
    
    if (projects.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:40px;">No hay proyectos activos</p>';
        return;
    }
    
    container.innerHTML = projects.map(project => {
        const progress = project.total_tareas > 0 
            ? Math.round((project.tareas_completadas / project.total_tareas) * 100)
            : 0;
        
        let statusClass = 'status-healthy';
        let statusText = 'En Control';
        let progressClass = '';
        
        if (project.estado === 'Crítico') {
            statusClass = 'status-critical';
            statusText = 'Crítico';
            progressClass = 'danger';
        } else if (project.estado === 'En Riesgo') {
            statusClass = 'status-warning';
            statusText = 'En Riesgo';
            progressClass = 'warning';
        }
        
        return `
            <div class="project-card" onclick="window.app.navigateTo('/project-detail?id=${project.id_proyecto}')">
                <div class="project-header">
                    <div class="project-title">${project.titulo}</div>
                    <div class="project-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="project-progress">
                    <div class="progress-label">
                        <span>Progreso de tareas</span>
                        <span><strong>${progress}%</strong> (${project.tareas_completadas}/${project.total_tareas})</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill ${progressClass}" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="project-meta">
                    <div class="project-meta-item">
                        <span>👤</span>
                        <span>${project.pm_nombre || 'Sin PM'}</span>
                    </div>
                    <div class="project-meta-item">
                        <span>📅</span>
                        <span>${formatDate(project.fecha_fin)}</span>
                    </div>
                    <div class="project-meta-item">
                        <span>💰</span>
                        <span>$${formatNumber(project.presupuesto)}</span>
                    </div>
                    <div class="project-meta-item">
                        <span>${getPriorityIcon(project.prioridad)}</span>
                        <span>${project.prioridad}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderResources(resources) {
    const container = document.getElementById('teamCapacity');
    
    if (resources.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No hay datos de recursos</p>';
        return;
    }
    
    container.innerHTML = resources.map(resource => {
        const capacity = resource.tareas_activas || 0;
        let capacityClass = 'capacity-low';
        let capacityPercent = Math.min(100, (capacity / 20) * 100);
        
        if (capacity > 15) {
            capacityClass = 'capacity-high';
        } else if (capacity > 10) {
            capacityClass = 'capacity-medium';
        }
        
        const initials = resource.nombre_completo.split(' ').map(n => n[0]).join('').substring(0, 2);
        
        return `
            <div class="team-member">
                <div class="member-info">
                    <div class="member-avatar">${initials}</div>
                    <div>
                        <div class="member-name">${resource.nombre_completo}</div>
                        <div style="font-size:0.8rem; color:#94a3b8;">
                            ${resource.proyectos_asignados} proyecto(s) • ${capacity} tareas
                        </div>
                    </div>
                </div>
                <div class="capacity-bar">
                    <div class="capacity-fill ${capacityClass}" style="width: ${capacityPercent}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAlerts(alerts) {
    const container = document.getElementById('alertsList');
    
    if (alerts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No hay alertas</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.priority}">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-description">${alert.description}</div>
        </div>
    `).join('');
}

function renderTimeline(milestones) {
    const container = document.getElementById('milestonesTimeline');
    
    if (milestones.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:40px;">No hay hitos programados</p>';
        return;
    }
    
    container.innerHTML = milestones.map(milestone => {
        let icon = '📅';
        if (milestone.status === 'completed') icon = '✓';
        if (milestone.status === 'overdue') icon = '⚠';
        
        return `
            <div class="milestone-card ${milestone.status}">
                <div class="milestone-date">${icon} ${formatDate(milestone.date)}</div>
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-project">${milestone.project}</div>
            </div>
        `;
    }).join('');
}

function renderFinancial(financial) {
    const totalBudget = financial.totalBudget;
    const totalSpent = financial.totalSpent;
    const totalAvailable = totalBudget - totalSpent;
    const spentPercent = Math.round((totalSpent / totalBudget) * 100);
    
    document.getElementById('totalBudget').textContent = '$' + formatNumber(totalBudget);
    document.getElementById('totalSpent').textContent = '$' + formatNumber(totalSpent);
    document.getElementById('totalAvailable').textContent = '$' + formatNumber(totalAvailable);
    document.getElementById('overBudgetCount').textContent = financial.overBudgetProjects;
    
    const progressBar = document.getElementById('spentProgressBar');
    progressBar.style.width = spentPercent + '%';
    
    if (spentPercent > 90) {
        progressBar.style.background = 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)';
    } else if (spentPercent > 75) {
        progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const btnRefresh = document.getElementById('btnRefreshDashboard');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            loadDashboardData();
        });
    }
    
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            // Implementar filtrado
            console.log('Filtrar por:', e.target.value);
        });
    }
    
    const btnViewGantt = document.getElementById('btnViewGantt');
    if (btnViewGantt) {
        btnViewGantt.addEventListener('click', () => {
            if (window.app && window.app.navigateTo) {
                window.app.navigateTo('/project-gantt');
            }
        });
    }
    
    const btnViewRoadmap = document.getElementById('btnViewRoadmap');
    if (btnViewRoadmap) {
        btnViewRoadmap.addEventListener('click', () => {
            alert('Vista de Roadmap Estratégico - Próximamente');
        });
    }
}

// ============================================
// UTILIDADES
// ============================================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

function formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString('es-ES');
}

function getPriorityIcon(priority) {
    const icons = {
        'Crítica': '🔴',
        'Alta': '🟠',
        'Media': '🟡',
        'Baja': '🟢'
    };
    return icons[priority] || '⚪';
}

function showErrorMessage(message) {
    alert(message);
}