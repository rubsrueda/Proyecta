import { supabase } from '../config.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    container.innerHTML = `
        <div class="screen-header">
            <h2>Organizaciones y Clientes</h2>
            <button id="btnNewOrg" class="btn-primary">+ Nueva Org</button>
        </div>

        <div class="table-container">
            <table class="data-table" id="orgsTable">
                <thead>
                    <tr>
                        <th>Nombre Comercial</th>
                        <th>Tipo</th>
                        <th>Padre (Holding)</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody><tr><td colspan="4" style="text-align:center">Cargando...</td></tr></tbody>
            </table>
        </div>

        <!-- MODAL -->
        <div id="modalOrg" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Organización</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formOrg">
                    <input type="hidden" id="orgId">
                    
                    <div class="form-group">
                        <label>Nombre Comercial</label>
                        <input type="text" id="orgName" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="orgType" class="form-control">
                            <option value="false">Cliente Externo</option>
                            <option value="true">Interna (Nuestra Empresa)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Empresa Padre (Opcional)</label>
                        <select id="orgParent" class="form-control">
                            <option value="">- Ninguna -</option>
                        </select>
                    </div>

                    <div class="form-inline-group" style="margin-top:10px;">
                        <label><input type="checkbox" id="orgActive" checked> Activo</label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    await loadOrgs();
    setupEvents();
}

async function loadOrgs() {
    const { data: orgs, error } = await supabase
        .from('pr_organizaciones')
        .select('*, padre:id_organizacion_padre(nombre_comercial)')
        .order('nombre_comercial');

    const tbody = document.querySelector('#orgsTable tbody');
    const selectParent = document.getElementById('orgParent');
    tbody.innerHTML = '';
    
    // Limpiar select padre (dejando opción default)
    while (selectParent.options.length > 1) selectParent.remove(1);

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:red">${error.message}</td></tr>`;
        return;
    }

    orgs.forEach(o => {
        // Llenar tabla
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
            <td><strong>${o.nombre_comercial}</strong></td>
            <td>${o.es_interna ? '<span class="badge blue">INTERNA</span>' : 'CLIENTE'}</td>
            <td>${o.padre?.nombre_comercial || '-'}</td>
            <td>${o.activo ? '✅' : '❌'}</td>
        `;
        tr.onclick = () => openModal(o);
        tbody.appendChild(tr);

        // Llenar select
        const opt = document.createElement('option');
        opt.value = o.id_organizacion;
        opt.innerText = o.nombre_comercial;
        selectParent.appendChild(opt);
    });
}

function openModal(org = null) {
    const modal = document.getElementById('modalOrg');
    const form = document.getElementById('formOrg');
    
    document.getElementById('modalTitle').innerText = org ? "Editar Organización" : "Nueva Organización";
    form.reset();

    if (org) {
        document.getElementById('orgId').value = org.id_organizacion;
        document.getElementById('orgName').value = org.nombre_comercial;
        document.getElementById('orgType').value = org.es_interna.toString();
        document.getElementById('orgParent').value = org.id_organizacion_padre || "";
        document.getElementById('orgActive').checked = org.activo;
    } else {
        document.getElementById('orgId').value = "";
    }
    
    modal.style.display = 'flex';
}

function setupEvents() {
    const modal = document.getElementById('modalOrg');
    
    document.getElementById('btnNewOrg').onclick = () => openModal(null);
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => b.onclick = () => modal.style.display = 'none');

    document.getElementById('formOrg').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('orgId').value;
        const data = {
            nombre_comercial: document.getElementById('orgName').value,
            es_interna: document.getElementById('orgType').value === 'true',
            id_organizacion_padre: document.getElementById('orgParent').value || null,
            activo: document.getElementById('orgActive').checked
        };

        let res;
        if (id) res = await supabase.from('pr_organizaciones').update(data).eq('id_organizacion', id);
        else res = await supabase.from('pr_organizaciones').insert(data);

        if (res.error) alert(res.error.message);
        else {
            modal.style.display = 'none';
            loadOrgs();
        }
    };
}