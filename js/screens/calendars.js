/**
 * Calendarios
 * Codigo BD: PAN_CALENDARIOS
 *
 * Gestion simple de festivos por organizacion.
 */

import { supabase } from '../config.js';
import { Utils } from '../core/utils.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:8px;">
            <h2 style="margin:0;">Calendarios</h2>
            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <select id="calendarOrg" class="form-control" style="min-width:240px;"></select>
                <button class="btn-primary" id="btnNewCalendar">+ Nuevo Festivo</button>
                <button class="btn-secondary" id="btnRefreshCalendar">Actualizar</button>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table" id="calendarTable">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Descripcion</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="modalCalendar" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nuevo Festivo</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formCalendar">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="calName" class="form-control" required>
                    </div>
                    <div class="form-inline-group">
                        <label>Fecha</label>
                        <input type="date" id="calDate" required>
                    </div>
                    <div class="form-inline-group">
                        <label>Tipo</label>
                        <select id="calType">
                            <option value="FESTIVO">Festivo</option>
                            <option value="NO_LABORAL">No laboral</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripcion</label>
                        <textarea id="calDesc" class="form-control" rows="2"></textarea>
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
    await loadCalendar();
    setupEvents();
}

function setupEvents() {
    const modal = document.getElementById('modalCalendar');
    const form = document.getElementById('formCalendar');

    document.getElementById('btnNewCalendar').onclick = () => {
        modal.style.display = 'flex';
    };

    document.getElementById('btnRefreshCalendar').onclick = loadCalendar;
    document.getElementById('calendarOrg').onchange = loadCalendar;

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.onclick = () => { modal.style.display = 'none'; };
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        const orgId = document.getElementById('calendarOrg').value || null;
        const payload = {
            id_organizacion: orgId,
            nombre: document.getElementById('calName').value,
            fecha: document.getElementById('calDate').value,
            tipo: document.getElementById('calType').value,
            descripcion: document.getElementById('calDesc').value
        };

        const { error } = await supabase.from('pr_calendarios').insert(payload);
        if (error) {
            alert('Error: ' + error.message);
            return;
        }
        form.reset();
        modal.style.display = 'none';
        loadCalendar();
    };
}

async function loadOrganizations() {
    const select = document.getElementById('calendarOrg');
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

async function loadCalendar() {
    const tbody = document.querySelector('#calendarTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

    const orgId = document.getElementById('calendarOrg').value;

    let query = supabase
        .from('pr_calendarios')
        .select('*')
        .order('fecha', { ascending: true });

    if (orgId) query = query.eq('id_organizacion', orgId);

    const { data, error } = await query;
    if (error) {
        tbody.innerHTML = renderMissingTable(error, 'pr_calendarios', 5);
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
            <td>${Utils.formatDate(row.fecha)}</td>
            <td>${row.nombre || '-'}</td>
            <td>${row.tipo || '-'}</td>
            <td>${row.descripcion || ''}</td>
            <td><button class="btn-secondary btn-delete" data-id="${row.id_calendario}">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Eliminar este registro?')) return;
            const { error: delError } = await supabase
                .from('pr_calendarios')
                .delete()
                .eq('id_calendario', btn.dataset.id);
            if (delError) {
                alert('Error: ' + delError.message);
            } else {
                loadCalendar();
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
