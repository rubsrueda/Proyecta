/**
 * Reporte de Soporte
 * Codigo BD: PAN_REP_SOPORTE
 *
 * Resumen basico de tickets por estado y prioridad.
 */

import { supabase } from '../config.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">Reporte de Soporte</h2>
            <button class="btn-secondary" id="btnRefreshSupport">Actualizar</button>
        </div>

        <div class="kpi-grid" id="supportKpis" style="margin-bottom:15px;"></div>

        <div class="card" style="padding:15px;">
            <h3 style="margin-top:0;">Tickets recientes</h3>
            <div class="table-container">
                <table class="data-table" id="supportTable">
                    <thead>
                        <tr>
                            <th>Codigo</th>
                            <th>Titulo</th>
                            <th>Estado</th>
                            <th>Prioridad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadSupportReport();
    document.getElementById('btnRefreshSupport').onclick = loadSupportReport;
}

async function loadSupportReport() {
    const kpiContainer = document.getElementById('supportKpis');
    const tbody = document.querySelector('#supportTable tbody');

    kpiContainer.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>';

    const { data, error } = await supabase
        .from('pr_tickets')
        .select('id_ticket, codigo_visual, titulo, estado, prioridad')
        .order('id_ticket', { ascending: false })
        .limit(50);

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">${error.message}</td></tr>`;
        return;
    }

    const tickets = data || [];
    const total = tickets.length;
    const abiertos = tickets.filter(t => t.estado === 'ABIERTO' || t.estado === 'EN_PROCESO').length;
    const resueltos = tickets.filter(t => t.estado === 'RESUELTO').length;
    const cerrados = tickets.filter(t => t.estado === 'CERRADO').length;

    kpiContainer.innerHTML = `
        <div class="kpi-card info">
            <div class="kpi-value">${total}</div>
            <div class="kpi-label">Total (ultimos 50)</div>
        </div>
        <div class="kpi-card warning">
            <div class="kpi-value">${abiertos}</div>
            <div class="kpi-label">Abiertos</div>
        </div>
        <div class="kpi-card success">
            <div class="kpi-value">${resueltos}</div>
            <div class="kpi-label">Resueltos</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${cerrados}</div>
            <div class="kpi-label">Cerrados</div>
        </div>
    `;

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No hay tickets</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    tickets.slice(0, 10).forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="ticket-code">${t.codigo_visual || 'N/A'}</span></td>
            <td>${t.titulo || '-'}</td>
            <td><span class="badge ${t.estado || ''}">${t.estado || 'SIN_ESTADO'}</span></td>
            <td>${t.prioridad || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}
