/**
 * Turnos
 * Codigo BD: PAN_TURNOS
 *
 * Gestion simple de turnos por organizacion.
 */

import { supabase } from '../config.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">Turnos</h2>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <select id="shiftOrg" class="form-control" style="min-width:240px;"></select>
                <button class="btn-primary" id="btnNewShift">+ Nuevo Turno</button>
                <button class="btn-secondary" id="btnRefreshShift">Actualizar</button>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table" id="shiftTable">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Horario</th>
                        <th>Dias</th>
                        <th>Activo</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="modalShift" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nuevo Turno</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formShift">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="shiftName" class="form-control" required>
                    </div>
                    <div class="form-inline-group">
                        <label>Hora inicio</label>
                        <input type="time" id="shiftStart" required>
                    </div>
                    <div class="form-inline-group">
                        <label>Hora fin</label>
                        <input type="time" id="shiftEnd" required>
                    </div>
                    <div class="form-group">
                        <label>Dias de semana (comma)</label>
                        <input type="text" id="shiftDays" class="form-control" placeholder="Lun,Mar,Mie,Jue,Vie">
                    </div>
                    <div class="form-inline-group">
                        <label>Activo</label>
                        <select id="shiftActive">
                            <option value="true">Si</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadOrganizations();
    await loadShifts();
    setupEvents();
}

function setupEvents() {
    const modal = document.getElementById('modalShift');
    const form = document.getElementById('formShift');

    document.getElementById('btnNewShift').onclick = () => {
        modal.style.display = 'flex';
    };

    document.getElementById('btnRefreshShift').onclick = loadShifts;
    document.getElementById('shiftOrg').onchange = loadShifts;

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.onclick = () => { modal.style.display = 'none'; };
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const orgId = document.getElementById('shiftOrg').value || null;
        const payload = {
            id_organizacion: orgId,
            nombre: document.getElementById('shiftName').value,
            hora_inicio: document.getElementById('shiftStart').value,
            hora_fin: document.getElementById('shiftEnd').value,
            dias_semana: document.getElementById('shiftDays').value,
            activo: document.getElementById('shiftActive').value === 'true'
        };

        const { error } = await supabase.from('pr_turnos').insert(payload);
        if (error) {
            alert('Error: ' + error.message);
            return;
        }
        form.reset();
        modal.style.display = 'none';
        loadShifts();
    };
}

async function loadOrganizations() {
    const select = document.getElementById('shiftOrg');
    select.innerHTML = '<option value="">Cargando...</option>';

    const { data, error } = await supabase
        .from('pr_organizaciones')
        .select('id_organizacion, nombre_comercial')
        .order('nombre_comercial');

    if (error) {
        select.innerHTML = '<option value="">Error cargando organizaciones</option>';
        return;
    }

    select.innerHTML = '<option value="">Todas las organizaciones</option>';
    (data || []).forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id_organizacion;
        opt.innerText = o.nombre_comercial;
        select.appendChild(opt);
    });
}

async function loadShifts() {
    const tbody = document.querySelector('#shiftTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

    const orgId = document.getElementById('shiftOrg').value;
    let query = supabase
        .from('pr_turnos')
        .select('*')
        .order('id_turno', { ascending: false });

    if (orgId) query = query.eq('id_organizacion', orgId);

    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = renderMissingTable(error, 'pr_turnos', 5);
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Sin registros</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.nombre || '-'}</td>
            <td>${row.hora_inicio || '--'} - ${row.hora_fin || '--'}</td>
            <td>${row.dias_semana || '-'}</td>
            <td>${row.activo ? 'Si' : 'No'}</td>
            <td><button class="btn-secondary btn-delete" data-id="${row.id_turno}">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Eliminar este turno?')) return;
            const { error: delError } = await supabase
                .from('pr_turnos')
                .delete()
                .eq('id_turno', btn.dataset.id);
            if (delError) {
                alert('Error: ' + delError.message);
            } else {
                loadShifts();
            }
        };
    });
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
