/**
 * Gantt de Proyecto
 * Codigo BD: PAN_PROY_GANTT
 *
 * Vista simple basada en tareas (pr_tickets) por proyecto.
 */

import { supabase } from '../config.js';
import { Utils } from '../core/utils.js';

let currentProjectId = null;

export async function render(workspace, params) {
    currentProjectId = normalizeProjectId(params);

    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">Gantt de Proyecto</h2>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <label style="font-size:0.85rem; color:#64748b;">Proyecto</label>
                <select id="ganttProjectSelect" class="form-control" style="min-width:260px;"></select>
                <button class="btn-secondary" id="btnRefreshGantt">Actualizar</button>
            </div>
        </div>

        <div class="card" style="padding:10px; margin-bottom:15px;">
            <div style="font-size:0.9rem; color:#64748b;">
                Vista simplificada por tareas. Usa la fecha limite para ordenar.
            </div>
        </div>

        <div class="table-container">
            <table class="data-table" id="ganttTable">
                <thead>
                    <tr>
                        <th>Codigo</th>
                        <th>Tarea</th>
                        <th>Responsable</th>
                        <th>Estado</th>
                        <th>Fecha limite</th>
                        <th>Estimado</th>
                        <th>Linea de tiempo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    await loadProjects();
    await loadTasks();

    document.getElementById('btnRefreshGantt').onclick = loadTasks;
    document.getElementById('ganttProjectSelect').onchange = (e) => {
        currentProjectId = e.target.value || null;
        loadTasks();
    };
}

function normalizeProjectId(params) {
    if (!params) return null;
    if (typeof params === 'object' && params.projectId) return params.projectId;
    return params;
}

async function loadProjects() {
    const select = document.getElementById('ganttProjectSelect');
    select.innerHTML = '<option value="">Cargando...</option>';

    const { data, error } = await supabase
        .from('pr_proyectos')
        .select('id_proyecto, nombre, codigo_proyecto')
        .order('nombre');

    if (error) {
        select.innerHTML = '<option value="">Error cargando proyectos</option>';
        console.error('[GANTT] Error proyectos:', error);
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

async function loadTasks() {
    const tbody = document.querySelector('#ganttTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>';

    if (!currentProjectId) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8;">Selecciona un proyecto.</td></tr>';
        return;
    }

    const { data, error } = await supabase
        .from('pr_tickets')
        .select('id_ticket, codigo_visual, titulo, estado, fecha_limite, tiempo_estimado_horas, prioridad, asignado:id_asignado (nombre_completo)')
        .eq('id_proyecto', currentProjectId)
        .order('fecha_limite', { ascending: true });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8;">No hay tareas para este proyecto.</td></tr>';
        return;
    }

    const today = new Date();

    tbody.innerHTML = '';
    data.forEach(task => {
        const dueDate = task.fecha_limite ? new Date(task.fecha_limite) : null;
        const daysLeft = dueDate ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
        const clamped = daysLeft === null ? null : Math.max(-30, Math.min(30, daysLeft));
        const percent = clamped === null ? 20 : Math.round(((30 - clamped) / 30) * 100);
        const barWidth = Math.max(10, Math.min(100, percent));

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="ticket-code">${task.codigo_visual || 'N/A'}</span></td>
            <td>${task.titulo || '-'}</td>
            <td>${task.asignado?.nombre_completo || '<span style="color:#cbd5e1">--</span>'}</td>
            <td><span class="badge ${task.estado || ''}">${task.estado || 'SIN_ESTADO'}</span></td>
            <td>${Utils.formatDate(task.fecha_limite)}</td>
            <td>${task.tiempo_estimado_horas || 0}h</td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="height:6px; background:#e2e8f0; border-radius:6px; width:120px; overflow:hidden;">
                        <div style="height:6px; width:${barWidth}%; background:${daysLeft !== null && daysLeft < 0 ? '#ef4444' : '#3b82f6'};"></div>
                    </div>
                    <span style="font-size:0.75rem; color:#64748b;">${daysLeft === null ? '--' : daysLeft + 'd'}</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
