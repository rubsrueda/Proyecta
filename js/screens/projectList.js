// js/screens/projectList.js - DASHBOARD DE PORTAFOLIO DE PROYECTOS PMO
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

let containerRef = null;
let allProjects = [];
let teamMembers = [];

export async function render(container) {
    containerRef = container;
    
    container.innerHTML = `
        <div class="portfolio-dashboard">
            <!-- HEADER CON FILTROS -->
            <div class="dashboard-header">
                <div>
                    <h1 style="margin:0; font-size:1.8rem; color:#1e293b;">
                        <span style="font-size:1.5rem; margin-right:10px;">📊</span>
                        Portafolio de Proyectos
                    </h1>
                    <p style="margin:5px 0 0 0; color:#64748b;">Panel de Control PMO - Gestión de Cartera</p>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <input type="text" id="searchPortfolio" placeholder="🔍 Buscar proyectos..." class="search-input" style="width:250px;">
                    <select id="filterStatus" class="form-control" style="width:150px;">
                        <option value="ALL">Todos los Estados</option>
                        <option value="ACTIVO">En Ejecución</option>
                        <option value="PLANIFICADO">En Planeación</option>
                        <option value="EN_RIESGO">Con Riesgos</option>
                        <option value="CERRADO">Completados</option>
                    </select>
                    <button class="btn-primary" id="btnNewProject">+ Nuevo Proyecto</button>
                    <button class="btn-secondary" id="btnRefreshPortfolio">🔄</button>
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
                        <div class="kpi-sublabel" id="budgetStatus">Calculando...</div>
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
                        <div class="spinner"></div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA: RECURSOS Y ALERTAS -->
                <div class="sidebar-section">
                    <!-- RECURSOS -->
                    <div class="resource-card">
                        <h3>👥 Gestión de Recursos</h3>
                        <div id="teamCapacity" class="team-capacity">
                            <div style="text-align:center; color:#64748b; padding:20px;">Cargando...</div>
                        </div>
                    </div>

                    <!-- ALERTAS Y RIESGOS -->
                    <div class="alerts-card">
                        <h3>🚨 Alertas Prioritarias</h3>
                        <div id="alertsList" class="alerts-list">
                            <div style="text-align:center; color:#64748b; padding:20px;">Analizando...</div>
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
                    <div style="text-align:center; color:#64748b; padding:40px;">Cargando hitos...</div>
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
                        <div class="financial-label">Horas Vendidas</div>
                        <div class="financial-value executed" id="totalHours">0h</div>
                        <div class="financial-progress">
                            <div class="progress-bar" id="hoursProgressBar"></div>
                        </div>
                    </div>
                    <div class="financial-card">
                        <div class="financial-label">Horas Disponibles</div>
                        <div class="financial-value available" id="availableHours">0h</div>
                    </div>
                    <div class="financial-card">
                        <div class="financial-label">Proyectos Sobre Horas</div>
                        <div class="financial-value danger" id="overBudgetCount">0</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL NUEVO PROYECTO -->
        <div id="modalProject" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Crear Nuevo Proyecto</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formCreateProject">
                    <div class="form-group">
                        <label>Nombre del Proyecto</label>
                        <input type="text" id="projName" class="form-control" required placeholder="Ej: Migración SAP 2024">
                    </div>
                    
                    <div class="form-inline-group">
                        <label>Código (ID Corto)</label>
                        <input type="text" id="projCode" placeholder="Ej: SAP-MIG-24" required style="text-transform:uppercase;">
                    </div>

                    <div class="form-group">
                        <label>Cliente (Organización)</label>
                        <select id="projOrg" class="form-control" required>
                            <option value="">Cargando...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Contrato</label>
                        <select id="projContract" class="form-control" required>
                            <option value="">Primero seleccione un cliente...</option>
                        </select>
                    </div>

                    <div class="form-inline-group">
                        <label>Metodología</label>
                        <select id="projMethod">
                            <option value="WATERFALL">Cascada (Gantt)</option>
                            <option value="AGILE">Ágil (Kanban)</option>
                        </select>
                    </div>

                    <div class="form-inline-group">
                        <label>Bolsa Horas (Venta)</label>
                        <input type="number" id="projHours" placeholder="0" step="0.5">
                    </div>

                    <div class="form-inline-group">
                        <label>Fecha Inicio</label>
                        <input type="date" id="projStart" required>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Crear Proyecto</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Aplicar estilos
    applyPortfolioStyles();
    
    // Cargar datos
    await loadPortfolioData();
    
    // Event Listeners
    setupEvents();
    
    // Traducir
    I18n.traducirPagina(container);
}

// ============================================
// ESTILOS
// ============================================
function applyPortfolioStyles() {
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

        .search-input {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.9rem;
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
            flex-wrap: wrap;
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
async function loadPortfolioData() {
    try {
        // Cargar proyectos
        await loadProjects();
        
        // Cargar recursos
        await loadResources();
        
        // Cargar alertas
        await loadAlerts();
        
        // Cargar hitos (milestones)
        await loadMilestones();
        
        // Renderizar KPIs
        renderKPIs();
        
        // Renderizar proyectos
        renderProjects();
        
        // Renderizar financiero
        renderFinancial();
        
    } catch (error) {
        console.error('Error cargando portafolio:', error);
    }
}

async function loadProjects() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('[PORTAFOLIO] Usuario no autenticado');
            allProjects = [];
            return;
        }

        const { data: userData } = await supabase
            .from('pr_usuarios')
            .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
            .eq('email', user.email)
            .single();

        const filterStatus = document.getElementById('filterStatus')?.value || 'ALL';
        const searchText = document.getElementById('searchPortfolio')?.value?.toLowerCase() || '';

        console.log('[PORTAFOLIO] Cargando proyectos con filtro:', filterStatus);

        let query = supabase
            .from('pr_proyectos')
            .select(`
                *,
                pr_organizaciones ( nombre_comercial ),
                pr_usuarios!pr_proyectos_id_responsable_fkey ( nombre_completo )
            `);

        // Si es cliente, filtrar por organización
        if (userData && userData.id_perfil_defecto === 5) {
            query = query.eq('id_organizacion', userData.id_organizacion_principal);
        }

        // Solo aplicar filtro de estado si no es "ALL"
        if (filterStatus && filterStatus !== 'ALL') {
            query = query.eq('estado', filterStatus);
        }

        const { data: projects, error } = await query.order('fecha_inicio', { ascending: false });

        if (error) {
            console.error('[PORTAFOLIO] Error cargando proyectos:', error);
            allProjects = [];
            return;
        }

        console.log('[PORTAFOLIO] Proyectos cargados:', projects?.length || 0);

        // Filtrar por búsqueda solo si hay texto
        if (searchText) {
            allProjects = (projects || []).filter(p => 
                p.nombre?.toLowerCase().includes(searchText) || 
                (p.pr_organizaciones?.nombre_comercial || '').toLowerCase().includes(searchText)
            );
        } else {
            allProjects = projects || [];
        }

        console.log('[PORTAFOLIO] Proyectos después de filtro:', allProjects.length);

    } catch (err) {
        console.error('[PORTAFOLIO] Error:', err);
        allProjects = [];
    }
}

async function loadResources() {
    try {
        const { data, error } = await supabase
            .from('pr_usuarios')
            .select('id_usuario, nombre_completo, email')
            .eq('activo', true)
            .limit(10);

        if (error) throw error;

        // Agregar carga de trabajo simulada
        teamMembers = (data || []).map(user => ({
            ...user,
            projectsCount: Math.floor(Math.random() * 4) + 1,
            tasksCount: Math.floor(Math.random() * 20)
        }));

        renderResources();
    } catch (error) {
        console.error('Error cargando recursos:', error);
        teamMembers = [];
    }
}

async function loadAlerts() {
    const alerts = [];
    
    allProjects.forEach(p => {
        if (p.estado === 'EN_RIESGO') {
            alerts.push({
                priority: 'high',
                title: `Proyecto "${p.nombre}" en riesgo`,
                description: 'Requiere atención inmediata'
            });
        }
        
        const hoursUsed = 0;
        const hoursTotal = p.bolsa_horas_vendidas || 100;
        const percentUsed = (hoursUsed / hoursTotal) * 100;
        
        if (percentUsed > 90) {
            alerts.push({
                priority: 'medium',
                title: `"${p.nombre}" cerca del límite de horas`,
                description: `${percentUsed.toFixed(0)}% de horas consumidas`
            });
        }
    });

    teamMembers.forEach(member => {
        if (member.tasksCount > 15) {
            alerts.push({
                priority: 'medium',
                title: `${member.nombre_completo} sobrecargado`,
                description: `${member.tasksCount} tareas activas - considerar redistribución`
            });
        }
    });

    renderAlerts(alerts);
}

async function loadMilestones() {
    try {
        const milestones = [];
        const today = new Date();
        
        allProjects.forEach(p => {
            if (p.fecha_fin) {
                const endDate = new Date(p.fecha_fin);
                const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                
                let status = 'upcoming';
                if (daysUntilEnd < 0) status = 'overdue';
                if (p.estado === 'CERRADO') status = 'completed';
                
                milestones.push({
                    date: p.fecha_fin,
                    title: `Fin de Proyecto`,
                    project: p.nombre,
                    status: status
                });
            }
        });

        milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
        renderTimeline(milestones.slice(0, 8));
    } catch (error) {
        console.error('Error cargando hitos:', error);
    }
}

// ============================================
// RENDERIZADO
// ============================================
function renderKPIs() {
    const onTrack = allProjects.filter(p => p.estado === 'ACTIVO').length;
    const atRisk = allProjects.filter(p => p.estado === 'EN_RIESGO').length;
    const critical = allProjects.filter(p => p.estado === 'CRÍTICO' || p.estado === 'BLOQUEADO').length;
    
    document.getElementById('projectsOnTrack').textContent = onTrack;
    document.getElementById('projectsAtRisk').textContent = atRisk;
    document.getElementById('projectsCritical').textContent = critical;
    
    const totalBudget = allProjects.reduce((sum, p) => sum + (p.bolsa_horas_vendidas || 0), 0);
    const budgetHealth = totalBudget > 0 ? 85 : 0;
    
    document.getElementById('budgetHealth').textContent = budgetHealth + '%';
    document.getElementById('budgetStatus').textContent = budgetHealth >= 80 ? 'Excelente control' : 'Requiere atención';
}

function renderProjects() {
    const container = document.getElementById('projectsList');
    document.getElementById('activeProjectsCount').textContent = allProjects.length + ' proyectos';
    
    if (allProjects.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:40px;">No hay proyectos activos</p>';
        return;
    }
    
    container.innerHTML = allProjects.map(project => {
        const hoursUsed = 0;
        const hoursTotal = project.bolsa_horas_vendidas || 100;
        const progress = Math.min(100, Math.round((hoursUsed / hoursTotal) * 100));
        
        let statusClass = 'status-healthy';
        let statusText = 'En Control';
        let progressClass = '';
        
        if (project.estado === 'EN_RIESGO') {
            statusClass = 'status-warning';
            statusText = 'En Riesgo';
            progressClass = 'warning';
        } else if (project.estado === 'CRÍTICO' || project.estado === 'BLOQUEADO') {
            statusClass = 'status-critical';
            statusText = 'Crítico';
            progressClass = 'danger';
        }
        
        const methodology = project.metodologia === 'AGILE' ? '🔄 Ágil' : '📊 Cascada';
        const clientName = project.pr_organizaciones?.nombre_comercial || 'Sin Cliente';
        const pmName = project.pr_usuarios?.nombre_completo || 'Sin PM';
        
        return `
            <div class="project-card" data-project-id="${project.id_proyecto}">
                <div class="project-header">
                    <div class="project-title">${project.nombre}</div>
                    <div class="project-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="project-progress">
                    <div class="progress-label">
                        <span>Consumo de horas</span>
                        <span><strong>${progress}%</strong> (${hoursUsed}/${hoursTotal}h)</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill ${progressClass}" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="project-meta">
                    <div class="project-meta-item">
                        <span>🏢</span>
                        <span>${clientName}</span>
                    </div>
                    <div class="project-meta-item">
                        <span>👤</span>
                        <span>${pmName}</span>
                    </div>
                    <div class="project-meta-item">
                        <span>📅</span>
                        <span>${Utils.formatDate(project.fecha_inicio)}</span>
                    </div>
                    <div class="project-meta-item">
                        <span>${methodology}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.dataset.projectId;
            Router.navigate('PAN_PROY_WBS', { projectId });
        });
    });
}

function renderResources() {
    const container = document.getElementById('teamCapacity');
    
    if (teamMembers.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No hay datos de recursos</p>';
        return;
    }
    
    container.innerHTML = teamMembers.slice(0, 8).map(resource => {
        const capacity = resource.tasksCount || 0;
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
                            ${resource.projectsCount} proyecto(s) • ${capacity} tareas
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
    
    if (!alerts || alerts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">No hay alertas</p>';
        return;
    }
    
    container.innerHTML = alerts.slice(0, 5).map(alert => `
        <div class="alert-item ${alert.priority}">
            <div class="alert-title">${alert.title}</div>
            <div class="alert-description">${alert.description}</div>
        </div>
    `).join('');
}

function renderTimeline(milestones) {
    const container = document.getElementById('milestonesTimeline');
    
    if (!milestones || milestones.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; padding:40px;">No hay hitos programados</p>';
        return;
    }
    
    container.innerHTML = milestones.map(milestone => {
        let icon = '📅';
        if (milestone.status === 'completed') icon = '✓';
        if (milestone.status === 'overdue') icon = '⚠';
        
        return `
            <div class="milestone-card ${milestone.status}">
                <div class="milestone-date">${icon} ${Utils.formatDate(milestone.date)}</div>
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-project">${milestone.project}</div>
            </div>
        `;
    }).join('');
}

function renderFinancial() {
    const totalHours = allProjects.reduce((sum, p) => sum + (p.bolsa_horas_vendidas || 0), 0);
    const usedHours = 0;
    const availableHours = totalHours - usedHours;
    const usedPercent = totalHours > 0 ? Math.round((usedHours / totalHours) * 100) : 0;
    const overBudget = 0;
    
    document.getElementById('totalBudget').textContent = '$' + (totalHours * 100).toLocaleString();
    document.getElementById('totalHours').textContent = totalHours + 'h';
    document.getElementById('availableHours').textContent = availableHours + 'h';
    document.getElementById('overBudgetCount').textContent = overBudget;
    
    const progressBar = document.getElementById('hoursProgressBar');
    progressBar.style.width = usedPercent + '%';
    
    if (usedPercent > 90) {
        progressBar.style.background = 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)';
    } else if (usedPercent > 75) {
        progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
    }
}

// ============================================
// EVENTOS
// ============================================
function setupEvents() {
    document.getElementById('searchPortfolio').addEventListener('input', loadPortfolioData);
    document.getElementById('filterStatus').addEventListener('change', loadPortfolioData);
    document.getElementById('btnRefreshPortfolio').addEventListener('click', loadPortfolioData);
    
    document.getElementById('btnViewGantt').addEventListener('click', () => {
        Router.navigate('PAN_PROY_GANTT');
    });
    
    document.getElementById('btnViewRoadmap').addEventListener('click', () => {
        alert('Vista de Roadmap Estratégico - Próximamente');
    });
    
    const modal = document.getElementById('modalProject');
    const form = document.getElementById('formCreateProject');
    const btnNew = document.getElementById('btnNewProject');
    const btnsClose = document.querySelectorAll('.close-modal, .close-modal-btn');

    btnNew.addEventListener('click', async () => {
        await cargarComboClientes();
        modal.style.display = 'flex';
    });

    btnsClose.forEach(b => b.addEventListener('click', () => modal.style.display = 'none'));

    // Cuando cambie el cliente, cargar contratos
    document.getElementById('projOrg').addEventListener('change', async (e) => {
        const idOrg = e.target.value;
        if (idOrg) {
            await cargarComboContratos(idOrg);
        } else {
            document.getElementById('projContract').innerHTML = '<option value="">Primero seleccione un cliente...</option>';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newProject = {
            nombre: document.getElementById('projName').value,
            codigo_proyecto: document.getElementById('projCode').value,
            id_organizacion: document.getElementById('projOrg').value,
            id_contrato: document.getElementById('projContract').value,
            metodologia: document.getElementById('projMethod').value,
            bolsa_horas_vendidas: parseFloat(document.getElementById('projHours').value) || 0,
            fecha_inicio: document.getElementById('projStart').value,
            estado: 'ACTIVO'
        };

        const { error } = await supabase.from('pr_proyectos').insert(newProject);

        if (error) {
            alert("Error: " + error.message);
        } else {
            alert("Proyecto creado correctamente");
            modal.style.display = 'none';
            form.reset();
            loadPortfolioData();
        }
    });
}

async function cargarComboClientes() {
    const select = document.getElementById('projOrg');
    select.innerHTML = '<option value="">Cargando...</option>';
    
    const { data: orgs } = await supabase
        .from('pr_organizaciones')
        .select('id_organizacion, nombre_comercial')
        .eq('es_interna', false) 
        .eq('activo', true)
        .order('nombre_comercial');

    select.innerHTML = '<option value="">Seleccione Cliente...</option>';
    if (orgs) {
        orgs.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.id_organizacion;
            opt.innerText = o.nombre_comercial;
            select.appendChild(opt);
        });
    }
}

async function cargarComboContratos(idOrganizacion) {
    const select = document.getElementById('projContract');
    select.innerHTML = '<option value="">Cargando contratos...</option>';
    
    const { data: contratos, error } = await supabase
        .from('pr_contratos')
        .select('id_contrato, codigo_contrato, descripcion')
        .eq('id_organizacion', idOrganizacion)
        .eq('activo', true)
        .order('fecha_inicio', { ascending: false });

    if (error) {
        console.error('Error cargando contratos:', error);
        select.innerHTML = '<option value="">Error cargando contratos</option>';
        return;
    }

    if (!contratos || contratos.length === 0) {
        select.innerHTML = '<option value="">⚠️ Este cliente no tiene contratos activos</option>';
        return;
    }

    select.innerHTML = '<option value="">Seleccione Contrato...</option>';
    contratos.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_contrato;
        opt.innerText = `${c.codigo_contrato} - ${c.descripcion || 'Sin descripción'}`;
        select.appendChild(opt);
    });
}