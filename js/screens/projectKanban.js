/**
 * Kanban de Proyecto
 * Codigo BD: PAN_PROY_KANBAN
 *
 * Tablero simple usando pr_tickets por proyecto.
 */

import { supabase } from '../config.js';

let currentProjectId = null;

const STATUS_COLUMNS = [
    { key: 'ABIERTO', label: 'Pendiente' },
    { key: 'EN_PROCESO', label: 'En Proceso' },
    { key: 'RESUELTO', label: 'Resuelto' },
    { key: 'CERRADO', label: 'Cerrado' }
];

export async function render(workspace, params) {
    currentProjectId = normalizeProjectId(params);

    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">Kanban de Proyecto</h2>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <label style="font-size:0.85rem; color:#64748b;">Proyecto</label>
                <select id="kanbanProjectSelect" class="form-control" style="min-width:260px;"></select>
                <button class="btn-secondary" id="btnRefreshKanban">Actualizar</button>
            </div>
        </div>

        <div class="kanban-board" id="kanbanBoard"></div>

        <style>
            .kanban-board {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 12px;
            }
            .kanban-column {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px;
                min-height: 300px;
            }
            .kanban-column h3 {
                margin: 0 0 10px 0;
                font-size: 0.95rem;
                color: #1e293b;
            }
            .kanban-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 10px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .kanban-meta {
                font-size: 0.8rem;
                color: #64748b;
            }
            .kanban-actions {
                margin-top: 8px;
                display: flex;
                gap: 6px;
                align-items: center;
            }
            .kanban-actions select {
                font-size: 0.8rem;
            }
        </style>
    `;

    await loadProjects();
    await loadBoard();

    document.getElementById('btnRefreshKanban').onclick = loadBoard;
    document.getElementById('kanbanProjectSelect').onchange = (e) => {
        currentProjectId = e.target.value || null;
        loadBoard();
    };
}

function normalizeProjectId(params) {
    if (!params) return null;
    if (typeof params === 'object' && params.projectId) return params.projectId;
    return params;
}

async function loadProjects() {
    const select = document.getElementById('kanbanProjectSelect');
    select.innerHTML = '<option value="">Cargando...</option>';

    const { data, error } = await supabase
        .from('pr_proyectos')
        .select('id_proyecto, nombre, codigo_proyecto')
        .order('nombre');

    if (error) {
        select.innerHTML = '<option value="">Error cargando proyectos</option>';
        console.error('[KANBAN] Error proyectos:', error);
        return;
    }

    select.innerHTML = '<option value="">Seleccione proyecto...</option>';
    if (data) {
        data.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id_proyecto;
            opt.innerText = `${p.codigo_proyecto || 'PROY'} - ${p.nombre}`;
            if (currentProjectId && String(currentProjectId) === String(p.id_proyecto)) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }
}

async function loadBoard() {
    const board = document.getElementById('kanbanBoard');
    board.innerHTML = '';

    if (!currentProjectId) {
        board.innerHTML = '<div style="color:#94a3b8; padding:20px;">Selecciona un proyecto.</div>';
        return;
    }

    const { data, error } = await supabase
        .from('pr_tickets')
        .select('id_ticket, codigo_visual, titulo, estado, prioridad, asignado:id_asignado (nombre_completo)')
        .eq('id_proyecto', currentProjectId)
        .order('id_ticket', { ascending: false });

    if (error) {
        board.innerHTML = `<div style="color:red; padding:20px;">${error.message}</div>`;
        return;
    }

    STATUS_COLUMNS.forEach(column => {
        const col = document.createElement('div');
        col.className = 'kanban-column';
        col.innerHTML = `<h3>${column.label}</h3>`;

        const items = (data || []).filter(t => (t.estado || 'ABIERTO') === column.key);
        if (items.length === 0) {
            col.innerHTML += '<div style="color:#94a3b8; font-size:0.8rem;">Sin tareas</div>';
        } else {
            items.forEach(task => {
                const card = document.createElement('div');
                card.className = 'kanban-card';
                card.innerHTML = `
                    <div style="font-weight:600;">${task.titulo || 'Sin titulo'}</div>
                    <div class="kanban-meta">${task.codigo_visual || 'N/A'} • ${task.prioridad || 'MEDIA'}</div>
                    <div class="kanban-meta">${task.asignado?.nombre_completo || 'Sin asignar'}</div>
                    <div class="kanban-actions">
                        <select data-ticket-id="${task.id_ticket}" class="status-select">
                            ${STATUS_COLUMNS.map(s => `<option value="${s.key}" ${s.key === column.key ? 'selected' : ''}>${s.label}</option>`).join('')}
                        </select>
                    </div>
                `;
                col.appendChild(card);
            });
        }

        board.appendChild(col);
    });

    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const ticketId = e.target.dataset.ticketId;
            const newStatus = e.target.value;
            const { error: updateError } = await supabase
                .from('pr_tickets')
                .update({ estado: newStatus })
                .eq('id_ticket', ticketId);

            if (updateError) {
                alert('Error actualizando estado: ' + updateError.message);
            } else {
                loadBoard();
            }
        });
    });
}
