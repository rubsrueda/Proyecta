import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    container.innerHTML = `
        <div class="screen-header">
            <h2>Directorio de Usuarios</h2>
            <button id="btnNewUser" class="btn-primary">+ Nuevo Usuario</button>
        </div>

        <div class="filters-bar">
            <input type="text" id="searchUser" placeholder="Buscar..." class="search-input">
        </div>

        <div class="table-container">
            <table class="data-table" id="usersTable">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Perfil</th>
                        <th>Org. Principal</th>
                        <th>Accesos Extra</th> <!-- NUEVO -->
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody id="usersBody">
                    <tr><td colspan="5" style="text-align:center">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- MODAL USUARIO -->
        <div id="modalUser" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Configurar Usuario</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formUser">
                    <input type="hidden" id="userId">

                    <!-- DATOS BÁSICOS -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div class="form-group">
                            <label>Nombre</label>
                            <input type="text" id="userName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="userEmail" class="form-control" required>
                        </div>
                    </div>

                    <!-- 1. PERFIL (QUÉ HACE) -->
                    <div class="form-group" style="background:#f0f9ff; padding:10px; border:1px solid #bae6fd; border-radius:4px;">
                        <label style="color:#0369a1; font-weight:bold;">1. Perfil Funcional (Roles)</label>
                        <select id="userProfile" class="form-control" required></select>
                        <div class="form-inline-group" style="margin-top:5px;">
                            <label style="font-size:0.8rem;">Rol Facturación:</label>
                            <input type="text" id="userBillRole" class="form-control" list="rolesList" placeholder="Ej: Senior" style="height:28px;">
                            <datalist id="rolesList">
                                <option value="Consultor Senior"><option value="Consultor Junior"><option value="Project Manager">
                            </datalist>
                        </div>
                    </div>

                    <!-- 2. ALCANCE DE DATOS (QUÉ VE) -->
                    <div class="form-group" style="background:#f0fdf4; padding:10px; border:1px solid #bbf7d0; border-radius:4px;">
                        <label style="color:#15803d; font-weight:bold;">2. Alcance de Datos (Organizaciones)</label>
                        
                        <div class="form-group">
                            <label>Organización Principal (Default)</label>
                            <select id="userOrg" class="form-control" required></select>
                        </div>

                        <label style="margin-top:10px; display:block;">Accesos Adicionales:</label>
                        <div id="multiOrgContainer" style="max-height:100px; overflow-y:auto; border:1px solid #e2e8f0; background:white; padding:5px;">
                            <!-- Checkboxes dinámicos -->
                        </div>
                    </div>

                    <div class="form-inline-group" style="margin-top:15px;">
                        <label style="display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" id="userActive" checked style="width:20px; height:20px;"> 
                            Usuario Activo
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar Configuración</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    await Promise.all([loadCatalogs(), loadUsers()]);
    setupEvents();
}

// 1. CARGA DE USUARIOS + ACCESOS DE DATOS
async function loadUsers() {
    const search = document.getElementById('searchUser').value.toLowerCase();

    const { data: users, error } = await supabase
        .from('pr_usuarios')
        .select(`
            *,
            pr_organizaciones!id_organizacion_principal ( nombre_comercial ),
            pr_sis_perfiles ( nombre_perfil ),
            pr_usuarios_acceso_datos ( id_organizacion )
        `)
        .order('nombre_completo');

    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = '';

    if (error) { tbody.innerHTML = `<tr><td colspan="5" style="color:red">${error.message}</td></tr>`; return; }

    const filtered = users.filter(u => 
        (u.nombre_completo || '').toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search)
    );

    filtered.forEach(u => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        
        const statusBadge = u.activo 
            ? `<span class="badge" style="background:#dcfce7; color:#166534;">ACTIVO</span>` 
            : `<span class="badge" style="background:#fee2e2; color:#b91c1c;">INACTIVO</span>`;

        // Contar accesos extra
        const extraCount = u.pr_usuarios_acceso_datos ? u.pr_usuarios_acceso_datos.length : 0;
        const extraText = extraCount > 0 ? `+ ${extraCount} extras` : '-';

        tr.innerHTML = `
            <td><strong>${u.nombre_completo}</strong><br><small style="color:#64748b;">${u.email}</small></td>
            <td>${u.pr_sis_perfiles?.nombre_perfil || '-'}</td>
            <td>${u.pr_organizaciones?.nombre_comercial || '-'}</td>
            <td style="color:#2563eb; font-size:0.8rem;">${extraText}</td>
            <td>${statusBadge}</td>
        `;

        tr.onclick = () => openModal(u);
        tbody.appendChild(tr);
    });
}

// 2. CARGA DE CATÁLOGOS Y CHECKBOXES
let cachedOrgs = [];

async function loadCatalogs() {
    // Orgs
    const { data: orgs } = await supabase.from('pr_organizaciones').select('id_organizacion, nombre_comercial').order('nombre_comercial');
    cachedOrgs = orgs || [];
    
    // Combo Principal
    const orgSelect = document.getElementById('userOrg');
    orgSelect.innerHTML = '<option value="">Seleccione...</option>';
    cachedOrgs.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id_organizacion;
        opt.innerText = o.nombre_comercial;
        orgSelect.appendChild(opt);
    });

    // Perfiles
    const { data: profiles } = await supabase.from('pr_sis_perfiles').select('id_perfil, nombre_perfil').order('nombre_perfil');
    const profSelect = document.getElementById('userProfile');
    profSelect.innerHTML = '<option value="">Seleccione...</option>';
    if(profiles) profiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id_perfil;
        opt.innerText = p.nombre_perfil;
        profSelect.appendChild(opt);
    });
}

// 3. ABRIR MODAL
function openModal(user = null) {
    const modal = document.getElementById('modalUser');
    const form = document.getElementById('formUser');
    form.reset();

    // Renderizar Checkboxes de Multi-Org
    const container = document.getElementById('multiOrgContainer');
    container.innerHTML = '';
    
    // Mapa de accesos actuales del usuario
    const accessMap = {};
    if (user && user.pr_usuarios_acceso_datos) {
        user.pr_usuarios_acceso_datos.forEach(a => accessMap[a.id_organizacion] = true);
    }

    cachedOrgs.forEach(o => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.marginBottom = '4px';
        
        const isChecked = accessMap[o.id_organizacion] ? 'checked' : '';
        
        div.innerHTML = `
            <input type="checkbox" class="chk-org-access" value="${o.id_organizacion}" ${isChecked} style="margin-right:8px;">
            <span style="font-size:0.85rem;">${o.nombre_comercial}</span>
        `;
        container.appendChild(div);
    });

    if (user) {
        document.getElementById('modalTitle').innerText = "Editar Usuario";
        document.getElementById('userId').value = user.id_usuario;
        document.getElementById('userName').value = user.nombre_completo;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userOrg').value = user.id_organizacion_principal;
        document.getElementById('userProfile').value = user.id_perfil_defecto;
        document.getElementById('userBillRole').value = user.rol_facturacion || '';
        document.getElementById('userActive').checked = user.activo;
        document.getElementById('userEmail').disabled = true;
    } else {
        document.getElementById('modalTitle').innerText = "Nuevo Usuario";
        document.getElementById('userId').value = "";
        document.getElementById('userActive').checked = true;
        document.getElementById('userEmail').disabled = false;
    }

    modal.style.display = 'flex';
}

// 4. GUARDAR
function setupEvents() {
    const modal = document.getElementById('modalUser');
    const form = document.getElementById('formUser');

    document.getElementById('searchUser').addEventListener('keyup', loadUsers);
    document.getElementById('btnNewUser').onclick = () => openModal(null);
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => b.onclick = () => modal.style.display = 'none');

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const userId = document.getElementById('userId').value;
        const mainOrg = document.getElementById('userOrg').value;
        
        const userData = {
            nombre_completo: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            id_organizacion_principal: mainOrg,
            id_perfil_defecto: document.getElementById('userProfile').value,
            rol_facturacion: document.getElementById('userBillRole').value,
            activo: document.getElementById('userActive').checked
        };

        // A. Guardar Usuario (Cabecera)
        let finalId = userId;
        let error;

        if (userId) {
            const res = await supabase.from('pr_usuarios').update(userData).eq('id_usuario', userId);
            error = res.error;
        } else {
            const res = await supabase.from('pr_usuarios').insert(userData).select().single();
            error = res.error;
            if (res.data) finalId = res.data.id_usuario;
        }

        if(error) { alert("Error: " + error.message); return; }

        // B. Guardar Accesos de Datos (Detalle)
        // 1. Borrar anteriores
        await supabase.from('pr_usuarios_acceso_datos').delete().eq('id_usuario', finalId);
        
        // 2. Insertar seleccionados
        const checkboxes = document.querySelectorAll('.chk-org-access:checked');
        const accesos = [];
        
        // Siempre incluir la Org Principal
        const accessSet = new Set();
        accessSet.add(parseInt(mainOrg));

        checkboxes.forEach(chk => accessSet.add(parseInt(chk.value)));

        accessSet.forEach(orgId => {
            accesos.push({ id_usuario: finalId, id_organizacion: orgId });
        });

        if (accesos.length > 0) {
            const { error: errAccess } = await supabase.from('pr_usuarios_acceso_datos').insert(accesos);
            if(errAccess) console.error("Error guardando accesos:", errAccess);
        }

        modal.style.display = 'none';
        loadUsers();
    };
}