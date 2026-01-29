// js/screens/myProjects.js - Proyectos donde soy responsable o cliente
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

let containerRef = null;

export async function render(container) {
    containerRef = container;
    
    container.innerHTML = `
        <div class="screen-header">
            <h2 data-i18n="mis_proyectos_titulo">Mis Proyectos</h2>
            <p style="font-size:0.9rem; color:#64748b;">Proyectos donde eres responsable o cliente</p>
        </div>

        <!-- Filtros Rápidos -->
        <div class="filters-bar" style="display:flex; gap:10px; margin-bottom:20px;">
            <input type="text" id="searchMyProject" placeholder="Buscar proyecto..." class="search-input">
            <select id="filterMyStatus" class="form-control" style="width:150px;">
                <option value="TODOS">Todos</option>
                <option value="ACTIVO" selected>Activos</option>
                <option value="PLANIFICADO">Planificados</option>
                <option value="CERRADO">Cerrados</option>
            </select>
        </div>

        <!-- TABLA DE PROYECTOS -->
        <div class="table-container">
            <table class="data-table" id="myProjectsTable">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Inicio</th>
                        <th>Fin Estimado</th>
                        <th>Progreso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody><tr><td colspan="7" style="text-align:center">Cargando proyectos...</td></tr></tbody>
            </table>
        </div>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await loadMyProjects();
}

async function loadMyProjects() {
    try {
        // 1. Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[MIS_PROYECTOS] Usuario no autenticado');
            return;
        }

        // 2. Obtener id_usuario y id_organizacion_principal
        const { data: userData, error: userError } = await supabase
            .from('pr_usuarios')
            .select('id_usuario, id_organizacion_principal')
            .eq('email', user.email)
            .single();

        if (userError || !userData) {
            console.error('[MIS_PROYECTOS] No se encontró usuario:', userError);
            return;
        }

        // 3. Leer filtros
        const showStatus = document.getElementById('filterMyStatus').value;
        const searchText = document.getElementById('searchMyProject').value.toLowerCase();

        // 4. Consultar proyectos donde:
        //    - El usuario es responsable O
        //    - El usuario es cliente (organización coincide)
        let query = supabase
            .from('pr_proyectos')
            .select(`
                *,
                pr_organizaciones ( nombre_comercial )
            `)
            .or(`id_responsable.eq.${userData.id_usuario},id_organizacion.eq.${userData.id_organizacion_principal}`);

        // 5. Filtrar por estado
        if (showStatus !== 'TODOS') {
            query = query.eq('estado', showStatus);
        }

        const { data: proyectos, error } = await query.order('fecha_inicio', { ascending: false });

        const tbody = document.querySelector('#myProjectsTable tbody');
        tbody.innerHTML = '';

        if (error) {
            console.error('[MIS_PROYECTOS] Error:', error);
            tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">${error.message}</td></tr>`;
            return;
        }

        if (!proyectos || proyectos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#94a3b8;">No tienes proyectos asignados.</td></tr>`;
            return;
        }

        // 6. Filtrar por búsqueda
        const filtered = proyectos.filter(p => 
            p.nombre_proyecto.toLowerCase().includes(searchText) ||
            p.codigo_proyecto.toLowerCase().includes(searchText)
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No se encontraron proyectos.</td></tr>`;
            return;
        }

        // 7. Renderizar proyectos
        filtered.forEach(proyecto => {
            const tr = document.createElement('tr');
            const estadoColor = {
                'PLANIFICADO': '#f59e0b',
                'ACTIVO': '#10b981',
                'CERRADO': '#6b7280'
            };

            tr.innerHTML = `
                <td data-label="Código"><strong>${proyecto.codigo_proyecto}</strong></td>
                <td data-label="Nombre">${proyecto.nombre_proyecto}</td>
                <td data-label="Estado">
                    <span style="background:${estadoColor[proyecto.estado] || '#9ca3af'}; color:white; padding:2px 8px; border-radius:3px; font-size:0.85rem;">
                        ${proyecto.estado}
                    </span>
                </td>
                <td data-label="Inicio">${Utils.formatDate(proyecto.fecha_inicio)}</td>
                <td data-label="Fin Estimado">${proyecto.fecha_fin_estimada ? Utils.formatDate(proyecto.fecha_fin_estimada) : '-'}</td>
                <td data-label="Progreso">
                    <div style="width:100%; background:#e5e7eb; height:20px; border-radius:3px; overflow:hidden;">
                        <div style="width:${proyecto.porcentaje_completado || 0}%; background:#3b82f6; height:100%; display:flex; align-items:center; justify-content:center; color:white; font-size:0.7rem; font-weight:bold;">
                            ${proyecto.porcentaje_completado || 0}%
                        </div>
                    </div>
                </td>
                <td data-label="Acciones">
                    <button class="btn-secondary btn-view-project" data-id="${proyecto.id_proyecto}" style="font-size:0.85rem; padding:4px 8px;">
                        Ver Detalles
                    </button>
                </td>
            `;

            tr.querySelector('.btn-view-project').addEventListener('click', () => {
                // Podría redirigir a una pantalla de detalles del proyecto
                console.log('Ver proyecto:', proyecto.id_proyecto);
                alert(`Proyecto: ${proyecto.nombre_proyecto}\n\nDetalles (por implementar)`);
            });

            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('[MIS_PROYECTOS] Error inesperado:', err);
    }
}

function setupEvents() {
    // Evento de búsqueda
    const searchInput = document.getElementById('searchMyProject');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadMyProjects();
        });
    }

    // Evento de filtro de estado
    const filterStatus = document.getElementById('filterMyStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            loadMyProjects();
        });
    }
}

export function setupScreen() {
    console.log('[MIS_PROYECTOS] Pantalla configurada');
}
