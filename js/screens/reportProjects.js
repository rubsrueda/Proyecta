/**
 * Reporte de Proyectos
 * Codigo BD: PAN_REP_PROYECTOS
 *
 * Resumen basico de proyectos y estados.
 */

import { supabase } from '../config.js';
import { Utils } from '../core/utils.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">Reporte de Proyectos</h2>
            <button class="btn-secondary" id="btnRefreshProjects">Actualizar</button>
        </div>

        <div class="kpi-grid" id="projectsKpis" style="margin-bottom:15px;"></div>

        <div class="card" style="padding:15px;">
            <h3 style="margin-top:0;">Listado</h3>
            <div class="table-container">
                <table class="data-table" id="projectsTable">
                    <thead>
                        <tr>
                            <th>Codigo</th>
                            <th>Proyecto</th>
                            <th>Estado</th>
                            <th>Metodologia</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    await loadProjectsReport();
    document.getElementById('btnRefreshProjects').onclick = loadProjectsReport;
}

async function loadProjectsReport() {
    const kpiContainer = document.getElementById('projectsKpis');
    const tbody = document.querySelector('#projectsTable tbody');

    kpiContainer.innerHTML = '';
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>';

    const { data, error } = await supabase
        .from('pr_proyectos')
        .select('id_proyecto, codigo_proyecto, nombre, estado, metodologia, fecha_inicio, fecha_fin')
        .order('id_proyecto', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">${error.message}</td></tr>`;
        return;
    }

    const projects = data || [];
    const total = projects.length;
    const activos = projects.filter(p => p.estado === 'ACTIVO').length;
    const plan = projects.filter(p => p.estado === 'PLANIFICADO').length;
    const riesgo = projects.filter(p => p.estado === 'EN_RIESGO').length;
    const cerrados = projects.filter(p => p.estado === 'CERRADO').length;

    kpiContainer.innerHTML = `
        <div class="kpi-card info">
            <div class="kpi-value">${total}</div>
            <div class="kpi-label">Total</div>
        </div>
        <div class="kpi-card success">
            <div class="kpi-value">${activos}</div>
            <div class="kpi-label">Activos</div>
        </div>
        <div class="kpi-card warning">
            <div class="kpi-value">${riesgo}</div>
            <div class="kpi-label">En riesgo</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-value">${cerrados}</div>
            <div class="kpi-label">Cerrados</div>
        </div>
    `;

    if (projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No hay proyectos</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    projects.slice(0, 20).forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="ticket-code">${p.codigo_proyecto || 'N/A'}</span></td>
            <td>${p.nombre || '-'}</td>
            <td><span class="badge ${p.estado || ''}">${p.estado || 'SIN_ESTADO'}</span></td>
            <td>${p.metodologia || '-'}</td>
            <td>${Utils.formatDate(p.fecha_inicio)}</td>
            <td>${Utils.formatDate(p.fecha_fin)}</td>
        `;
        tbody.appendChild(tr);
    });
}
