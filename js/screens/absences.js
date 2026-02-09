/**
 * Ausencias
 * Codigo BD: PAN_AUSENCIAS
 *
 * Solicitudes basicas de ausencias.
 */

import { supabase } from '../config.js';
import { Utils } from '../core/utils.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">Ausencias</h2>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <select id="absenceUser" class="form-control" style="min-width:240px;"></select>
                <button class="btn-primary" id="btnNewAbsence">+ Nueva Solicitud</button>
                <button class="btn-secondary" id="btnRefreshAbsence">Actualizar</button>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table" id="absenceTable">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Tipo</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="modalAbsence" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nueva Ausencia</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formAbsence">
                    <div class="form-group">
                        <label>Usuario</label>
                        <select id="absenceUserSelect" class="form-control" required></select>
                    </div>
                    <div class="form-inline-group">
                        <label>Tipo</label>
                        <select id="absenceType">
                            <option value="VACACIONES">Vacaciones</option>
                            <option value="PERMISO">Permiso</option>
                            <option value="ENFERMEDAD">Enfermedad</option>
                        </select>
                    </div>
                    <div class="form-inline-group">
                        <label>Inicio</label>
                        <input type="date" id="absenceStart" required>
                    </div>
                    <div class="form-inline-group">
                        <label>Fin</label>
                        <input type="date" id="absenceEnd" required>
                    </div>
                    <div class="form-group">
                        <label>Comentario</label>
                        <textarea id="absenceComment" class="form-control" rows="2"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadUsers();
    await loadAbsences();
    setupEvents();
}

function setupEvents() {
    const modal = document.getElementById('modalAbsence');
    const form = document.getElementById('formAbsence');

    document.getElementById('btnNewAbsence').onclick = () => {
        modal.style.display = 'flex';
    };

    document.getElementById('btnRefreshAbsence').onclick = loadAbsences;
    document.getElementById('absenceUser').onchange = loadAbsences;

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.onclick = () => { modal.style.display = 'none'; };
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            id_usuario: document.getElementById('absenceUserSelect').value,
            tipo: document.getElementById('absenceType').value,
            fecha_inicio: document.getElementById('absenceStart').value,
            fecha_fin: document.getElementById('absenceEnd').value,
            estado: 'SOLICITADA',
            comentario: document.getElementById('absenceComment').value
        };

        const { error } = await supabase.from('pr_ausencias').insert(payload);
        if (error) {
            alert('Error: ' + error.message);
            return;
        }
        form.reset();
        modal.style.display = 'none';
        loadAbsences();
    };
}

async function loadUsers() {
    const filterSelect = document.getElementById('absenceUser');
    const formSelect = document.getElementById('absenceUserSelect');
    filterSelect.innerHTML = '<option value="">Cargando...</option>';
    formSelect.innerHTML = '<option value="">Cargando...</option>';

    const { data, error } = await supabase
        .from('pr_usuarios')
        .select('id_usuario, nombre_completo')
        .order('nombre_completo');

    if (error) {
        filterSelect.innerHTML = '<option value="">Error cargando usuarios</option>';
        formSelect.innerHTML = '<option value="">Error cargando usuarios</option>';
        return;
    }

    filterSelect.innerHTML = '<option value="">Todos los usuarios</option>';
    formSelect.innerHTML = '<option value="">Seleccione usuario...</option>';
    (data || []).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id_usuario;
        opt.innerText = u.nombre_completo || u.id_usuario;
        filterSelect.appendChild(opt.cloneNode(true));
        formSelect.appendChild(opt);
    });
}

async function loadAbsences() {
    const tbody = document.querySelector('#absenceTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>';

    const userId = document.getElementById('absenceUser').value;
    let query = supabase
        .from('pr_ausencias')
        .select('id_ausencia, id_usuario, tipo, fecha_inicio, fecha_fin, estado, comentario, usuario:id_usuario (nombre_completo)')
        .order('id_ausencia', { ascending: false });

    if (userId) query = query.eq('id_usuario', userId);

    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = renderMissingTable(error, 'pr_ausencias', 6);
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Sin registros</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.usuario?.nombre_completo || row.id_usuario}</td>
            <td>${row.tipo || '-'}</td>
            <td>${Utils.formatDate(row.fecha_inicio)}</td>
            <td>${Utils.formatDate(row.fecha_fin)}</td>
            <td>${row.estado || '-'}</td>
            <td>
                <button class="btn-secondary btn-approve" data-id="${row.id_ausencia}">Aprobar</button>
                <button class="btn-secondary btn-reject" data-id="${row.id_ausencia}">Rechazar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.onclick = () => updateAbsenceStatus(btn.dataset.id, 'APROBADA');
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.onclick = () => updateAbsenceStatus(btn.dataset.id, 'RECHAZADA');
    });
}

async function updateAbsenceStatus(id, status) {
    if (!confirm(`Cambiar estado a ${status}?`)) return;
    const { error } = await supabase
        .from('pr_ausencias')
        .update({ estado: status })
        .eq('id_ausencia', id);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    loadAbsences();
}

function renderMissingTable(error, tableName, colSpan) {
    if (error && error.message && error.message.includes('does not exist')) {
        return `
            <tr>
                <td colspan="${colSpan}" style="text-align:center; color:#b91c1c;">
                    Falta la tabla ${tableName}. Ejecuta sql_setup_rrhh.sql en Supabase.
                </td>
            </tr>
        `;
    }
    return `<tr><td colspan="${colSpan}" style="color:red; text-align:center;">${error.message}</td></tr>`;
}
