// js/screens/projectList.js
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

let containerRef = null;

export async function render(container) {
    containerRef = container;
    
    container.innerHTML = `
        <div class="screen-header">
            <h2>Portafolio de Proyectos</h2>
            <button id="btnNewProject" class="btn-primary">+ Nuevo Proyecto</button>
        </div>

        <!-- Filtros Rápidos -->
        <div class="filters-bar" style="display:flex; gap:10px; margin-bottom:20px;">
            <input type="text" id="searchProject" placeholder="Buscar proyecto o cliente..." class="search-input">
            <select id="filterStatus" class="form-control" style="width:150px;">
                <option value="TODOS">Todos</option>
                <option value="ACTIVO" selected>Activos</option>
                <option value="PLANIFICADO">Planificados</option>
                <option value="CERRADO">Cerrados</option>
            </select>
        </div>

        <!-- GRID DE PROYECTOS (Tarjetas) -->
        <div id="projectsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            <div class="spinner"></div>
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

    I18n.traducirPagina(container);
    setupEvents();
    await loadProjects();
}

async function loadProjects() {
    try {
        // 1. Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[PROYECTOS] Usuario no autenticado');
            return;
        }

        // 2. Obtener id_usuario y perfil
        const { data: userData } = await supabase
            .from('pr_usuarios')
            .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
            .eq('email', user.email)
            .single();

        const filterStatus = document.getElementById('filterStatus').value;
        const searchText = document.getElementById('searchProject').value.toLowerCase();

        // 3. Consulta con JOIN a Organización
        let query = supabase
            .from('pr_proyectos')
            .select(`
                *,
                pr_organizaciones ( nombre_comercial )
            `);

        // 4. Si es cliente (perfil 5), mostrar solo proyectos de su organización
        if (userData && userData.id_perfil_defecto === 5) {
            query = query.eq('id_organizacion', userData.id_organizacion_principal);
        }

        query = query.order('fecha_inicio', { ascending: false });

        if (filterStatus !== 'TODOS') {
            query = query.eq('estado', filterStatus);
        }

        const { data: projects, error } = await query;
        const grid = document.getElementById('projectsGrid');
        grid.innerHTML = '';

        if (error) {
            grid.innerHTML = `<p style="color:red">Error cargando proyectos: ${error.message}</p>`;
            return;
        }

        if (projects.length === 0) {
            grid.innerHTML = `<p style="color:#64748b; grid-column: 1/-1; text-align:center;">No hay proyectos encontrados.</p>`;
            return;
        }

        // Filtrado JS para búsqueda de texto
        const filtered = projects.filter(p => 
            p.nombre.toLowerCase().includes(searchText) || 
            (p.pr_organizaciones?.nombre_comercial || '').toLowerCase().includes(searchText)
        );

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card project-card';
            card.style.cursor = 'pointer';
            card.style.transition = 'transform 0.2s';
            card.onmouseover = () => card.style.transform = 'translateY(-3px)';
            card.onmouseout = () => card.style.transform = 'translateY(0)';

            // Calcular barra de progreso
            const total = p.bolsa_horas_vendidas || 100;
            const consumido = 0;
            const porcentaje = Math.min(100, Math.round((consumido / total) * 100));

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
                    <span class="badge ${p.metodologia === 'AGILE' ? 'EN_PROCESO' : 'ABIERTO'}" style="font-size:0.7rem;">
                        ${p.metodologia || 'WATERFALL'}
                    </span>
                    <span style="font-size:0.8rem; color:#64748b;">${Utils.formatDate(p.fecha_inicio)}</span>
                </div>
                
                <h3 style="margin:0 0 5px 0; color:#1e293b;">${p.nombre}</h3>
                <div style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:15px;">`
        });
    } catch (err) {
        console.error('[PROYECTOS] Error:', err);
    }
                <span style="font-size:0.8rem; color:#64748b;">${Utils.formatDate(p.fecha_inicio)}</span>
            </div>
            
            <h3 style="margin:0 0 5px 0; color:#1e293b;">${p.nombre}</h3>
            <div style="font-size:0.85rem; color:#64748b; font-weight:600; margin-bottom:15px;">
                <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle;">domain</span>
                ${p.pr_organizaciones?.nombre_comercial || 'Sin Cliente'}
            </div>

            <!-- Barra de Progreso Financiero/Horas -->
            <div style="margin-bottom:5px; font-size:0.75rem; display:flex; justify-content:space-between;">
                <span>Avance Horas</span>
                <strong>${consumido} / ${total} h</strong>
            </div>
            <div style="width:100%; background:#f1f5f9; height:6px; border-radius:3px; overflow:hidden;">
                <div style="width:${porcentaje}%; background:${porcentaje > 80 ? '#ef4444' : '#2563eb'}; height:100%;"></div>
            </div>
        `;

        // AL HACER CLIC: Navegar a la WBS (Estructura de Tareas)
        // Pasamos el ID del proyecto como parámetro
        card.onclick = () => Router.navigate('PAN_PROY_WBS', { projectId: p.id_proyecto });

        grid.appendChild(card);
    });
}

function setupEvents() {
    const modal = document.getElementById('modalProject');
    const form = document.getElementById('formCreateProject');
    const btnNew = document.getElementById('btnNewProject');
    const btnsClose = document.querySelectorAll('.close-modal, .close-modal-btn');

    // Buscador
    document.getElementById('searchProject').addEventListener('keyup', loadProjects);
    document.getElementById('filterStatus').addEventListener('change', loadProjects);

    // Abrir Modal
    btnNew.onclick = async () => {
        await cargarComboClientes();
        modal.style.display = 'flex';
    };

    btnsClose.forEach(b => b.onclick = () => modal.style.display = 'none');

    // Crear Proyecto
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const newProject = {
            nombre: document.getElementById('projName').value,
            codigo_proyecto: document.getElementById('projCode').value,
            id_organizacion: document.getElementById('projOrg').value,
            metodologia: document.getElementById('projMethod').value,
            bolsa_horas_vendidas: document.getElementById('projHours').value || 0,
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
            loadProjects();
        }
    };
}

async function cargarComboClientes() {
    const select = document.getElementById('projOrg');
    select.innerHTML = '<option value="">Cargando...</option>';
    
    // Solo mostramos organizaciones CLIENTE (no internas)
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