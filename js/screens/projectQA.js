/**
 * QA de Entregas
 * Codigo BD: PAN_QA_ENTREGAS
 *
 * Lista tareas resueltas por proyecto y permite aprobar/rechazar.
 */

import { supabase } from '../config.js';

let currentProjectId = null;

export async function render(workspace, params) {
    currentProjectId = normalizeProjectId(params);

    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">QA de Entregas</h2>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <label style="font-size:0.85rem; color:#64748b;">Proyecto</label>
                <select id="qaProjectSelect" class="form-control" style="min-width:260px;"></select>
                <button class="btn-secondary" id="btnRefreshQA">Actualizar</button>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table" id="qaTable">
                <thead>
                    <tr>
                        <th>Codigo</th>
                        <th>Entregable</th>
                        <th>Responsable</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    await loadProjects();
    await loadQaItems();

    document.getElementById('btnRefreshQA').onclick = loadQaItems;
    document.getElementById('qaProjectSelect').onchange = (e) => {
        currentProjectId = e.target.value || null;
        loadQaItems();
    };
}

function normalizeProjectId(params) {
    if (!params) return null;
    if (typeof params === 'object' && params.projectId) return params.projectId;
    return params;
}

async function loadProjects() {
    const select = document.getElementById('qaProjectSelect');
    select.innerHTML = '<option value="">Cargando...</option>';

    const { data, error } = await supabase
        .from('pr_proyectos')
        .select('id_proyecto, nombre, codigo_proyecto')
        .order('nombre');

    if (error) {
        select.innerHTML = '<option value="">Error cargando proyectos</option>';
        console.error('[QA] Error proyectos:', error);
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

async function loadQaItems() {
    const tbody = document.querySelector('#qaTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

    if (!currentProjectId) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Selecciona un proyecto.</td></tr>';
        return;
    }

    const { data, error } = await supabase
        .from('pr_tickets')
        .select('id_ticket, codigo_visual, titulo, estado, asignado:id_asignado (nombre_completo)')
        .eq('id_proyecto', currentProjectId)
        .eq('estado', 'RESUELTO')
        .order('id_ticket', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No hay entregables pendientes de QA.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="ticket-code">${item.codigo_visual || 'N/A'}</span></td>
            <td>${item.titulo || '-'}</td>
            <td>${item.asignado?.nombre_completo || '<span style="color:#cbd5e1">--</span>'}</td>
            <td><span class="badge ${item.estado || ''}">${item.estado || 'SIN_ESTADO'}</span></td>
            <td>
                <button class="btn-primary btn-approve" data-id="${item.id_ticket}">Aprobar</button>
                <button class="btn-secondary btn-reject" data-id="${item.id_ticket}">Rechazar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.onclick = () => updateQaStatus(btn.dataset.id, 'CERRADO');
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.onclick = () => updateQaStatus(btn.dataset.id, 'EN_PROCESO');
    });
}

async function updateQaStatus(ticketId, newStatus) {
    const ok = confirm(`Confirmar cambio a ${newStatus}?`);
    if (!ok) return;

    const { error } = await supabase
        .from('pr_tickets')
        .update({ estado: newStatus })
        .eq('id_ticket', ticketId);

    if (error) {
        alert('Error actualizando: ' + error.message);
        return;
    }

    loadQaItems();
}
