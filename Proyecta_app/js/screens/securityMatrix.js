import { supabase } from '../config.js';
import * as I18n from '../services/i18nService.js';

let currentProfile = null;
let currentMenu = null;

export async function render(container) {
    container.innerHTML = `
        <div class="screen-header">
            <h2>Arquitectura de Perfiles</h2>
        </div>

        <div class="arch-layout">
            <!-- COL 1: PERFILES -->
            <div class="arch-col">
                <div class="col-header">1. Perfiles</div>
                <div id="listProfiles" class="col-list"></div>
                <button class="btn-add" id="btnAddProfile">+ Crear Perfil</button>
            </div>

            <!-- COL 2: MENÚS DEL PERFIL -->
            <div class="arch-col">
                <div class="col-header">2. Menús (Agrupadores)</div>
                <div id="listMenus" class="col-list">
                    <p class="hint">Selecciona un perfil</p>
                </div>
                <button class="btn-add" id="btnAddMenuToProfile" disabled>+ Asignar Menú</button>
            </div>

            <!-- COL 3: PANTALLAS DEL MENÚ -->
            <div class="arch-col">
                <div class="col-header">3. Pantallas (Contenido)</div>
                <div id="listScreens" class="col-list">
                    <p class="hint">Selecciona un menú</p>
                </div>
                <button class="btn-add" id="btnAddScreenToMenu" disabled>+ Asignar Pantalla</button>
            </div>
        </div>

        <!-- MODAL GENERADOR (Sirve para agregar Menú o Pantalla) -->
        <div id="modalSelector" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalSelTitle">Seleccionar</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div id="modalSelList" style="max-height:300px; overflow-y:auto;"></div>
            </div>
        </div>

        <style>
            .arch-layout { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 15px; height: calc(100vh - 140px); }
            .arch-col { background: white; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
            .col-header { background: #f8fafc; padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .col-list { flex: 1; overflow-y: auto; padding: 5px; }
            .btn-add { background: #f1f5f9; border: none; border-top: 1px solid #e2e8f0; padding: 10px; color: #2563eb; font-weight: 600; cursor: pointer; text-align: left; }
            .btn-add:hover { background: #e2e8f0; }
            .btn-add:disabled { color: #94a3b8; cursor: not-allowed; }
            
            .list-item { padding: 10px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
            .list-item:hover { background: #f8fafc; }
            .list-item.active { background: #eff6ff; border-left: 3px solid #2563eb; }
            
            .hint { text-align: center; color: #94a3b8; margin-top: 20px; font-style: italic; }
            
            .screen-controls select { font-size: 0.75rem; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px; }
            .btn-remove { color: #ef4444; cursor: pointer; margin-left: 10px; font-size: 1.2rem; }

            @media (max-width: 768px) { .arch-layout { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr 1fr; height: auto; } }
        </style>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await loadProfiles();
}

// ======================= LOGICA DE CARGA =======================

async function loadProfiles() {
    const list = document.getElementById('listProfiles');
    const { data: profiles } = await supabase.from('pr_sis_perfiles').select('*').order('nombre_perfil');
    
    list.innerHTML = '';
    profiles.forEach(p => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerText = p.nombre_perfil;
        div.onclick = () => selectProfile(p, div);
        list.appendChild(div);
    });
}

async function selectProfile(profile, div) {
    currentProfile = profile;
    currentMenu = null;
    
    // UI Updates
    document.querySelectorAll('#listProfiles .list-item').forEach(d => d.classList.remove('active'));
    div.classList.add('active');
    document.getElementById('btnAddMenuToProfile').disabled = false;
    document.getElementById('listScreens').innerHTML = '<p class="hint">Selecciona un menú</p>';
    document.getElementById('btnAddScreenToMenu').disabled = true;

    await loadMenusForProfile(profile.id_perfil);
}

async function loadMenusForProfile(profileId) {
    const list = document.getElementById('listMenus');
    list.innerHTML = '<div class="spinner"></div>';

    // Obtenemos los menús ÚNICOS asignados a este perfil
    // Supabase no tiene DISTINCT directo fácil en JS, usamos RPC o filtrado manual.
    // Consulta: Trae todas las filas de este perfil, extrae el menú
    const { data } = await supabase
        .from('pr_sis_permisos_arbol')
        .select(`id_menu, orden_menu, pr_sis_menus (id_menu, codigo_menu, icono)`)
        .eq('id_perfil', profileId)
        .order('orden_menu');

    list.innerHTML = '';
    
    // Filtrar duplicados (porque la tabla tiene 1 fila por pantalla, así que el menú se repite)
    const uniqueMenus = [];
    const seen = new Set();

    if(data) {
        data.forEach(row => {
            if(!seen.has(row.id_menu)) {
                seen.add(row.id_menu);
                uniqueMenus.push({
                    id: row.id_menu,
                    code: row.pr_sis_menus.codigo_menu,
                    icon: row.pr_sis_menus.icono
                });
            }
        });
    }

    if (uniqueMenus.length === 0) {
        list.innerHTML = '<p class="hint">Perfil vacío. Agrega un menú.</p>';
        return;
    }

    uniqueMenus.forEach(m => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span><i class="material-symbols-outlined" style="font-size:16px; vertical-align:middle;">${m.icon}</i> ${m.code}</span>
            <span class="btn-remove" title="Quitar menú">&times;</span>
        `;
        
        // Evento Seleccionar
        div.onclick = (e) => {
            if(e.target.classList.contains('btn-remove')) return; // Ignorar clic si es borrar
            selectMenu(m, div);
        };

        // Evento Borrar Menú (Borra todas las pantallas asociadas a este menú para este perfil)
        div.querySelector('.btn-remove').onclick = async () => {
            if(confirm('¿Quitar este menú y todas sus pantallas del perfil?')) {
                await supabase.from('pr_sis_permisos_arbol')
                    .delete()
                    .eq('id_perfil', currentProfile.id_perfil)
                    .eq('id_menu', m.id);
                loadMenusForProfile(currentProfile.id_perfil);
            }
        };

        list.appendChild(div);
    });
}

async function selectMenu(menu, div) {
    currentMenu = menu;
    
    document.querySelectorAll('#listMenus .list-item').forEach(d => d.classList.remove('active'));
    div.classList.add('active');
    document.getElementById('btnAddScreenToMenu').disabled = false;

    await loadScreensForMenu(currentProfile.id_perfil, menu.id);
}

async function loadScreensForMenu(profileId, menuId) {
    const list = document.getElementById('listScreens');
    list.innerHTML = '<div class="spinner"></div>';

    const { data } = await supabase
        .from('pr_sis_permisos_arbol')
        .select(`
            id_permiso, id_pantalla, nivel_acceso,
            pr_sis_pantallas ( clave_nombre )
        `)
        .eq('id_perfil', profileId)
        .eq('id_menu', menuId)
        .order('orden_pantalla');

    list.innerHTML = '';

    if (!data || data.length === 0) {
        list.innerHTML = '<p class="hint">Menú vacío. Agrega pantallas.</p>';
        return;
    }

    data.forEach(row => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.style.cursor = "default"; // No se selecciona, se edita
        
        // Selector de Nivel
        const sel = `
            <select class="level-changer" data-id="${row.id_permiso}">
                <option value="1" ${row.nivel_acceso===1?'selected':''}>Ver</option>
                <option value="2" ${row.nivel_acceso===2?'selected':''}>Edit</option>
                <option value="3" ${row.nivel_acceso===3?'selected':''}>Full</option>
            </select>
        `;

        div.innerHTML = `
            <span>${row.pr_sis_pantallas.clave_nombre}</span>
            <div class="screen-controls" style="display:flex; align-items:center; gap:5px;">
                ${sel}
                <span class="btn-remove" title="Quitar pantalla">&times;</span>
            </div>
        `;

        // Evento Cambiar Nivel
        div.querySelector('select').onchange = async (e) => {
            const newLevel = e.target.value;
            await supabase.from('pr_sis_permisos_arbol').update({ nivel_acceso: newLevel }).eq('id_permiso', row.id_permiso);
        };

        // Evento Quitar Pantalla
        div.querySelector('.btn-remove').onclick = async () => {
            await supabase.from('pr_sis_permisos_arbol').delete().eq('id_permiso', row.id_permiso);
            loadScreensForMenu(profileId, menuId);
        };

        list.appendChild(div);
    });
}

// ======================= LOGICA DE AGREGAR =======================

function setupEvents() {
    const modal = document.getElementById('modalSelector');
    const modalList = document.getElementById('modalSelList');
    const modalTitle = document.getElementById('modalSelTitle');

    // CERRAR MODAL
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => modal.style.display = 'none');

    // AGREGAR PERFIL
    document.getElementById('btnAddProfile').onclick = async () => {
        const name = prompt("Nombre del Nuevo Perfil:");
        if (name) {
            await supabase.from('pr_sis_perfiles').insert({ nombre_perfil: name });
            loadProfiles();
        }
    };

    // AGREGAR MENÚ (Abrir catálogo de menús)
    document.getElementById('btnAddMenuToProfile').onclick = async () => {
        modalTitle.innerText = "Agregar Menú al Perfil";
        modalList.innerHTML = '<div class="spinner"></div>';
        modal.style.display = 'flex';

        // Cargar Catálogo de Menús
        const { data: allMenus } = await supabase.from('pr_sis_menus').select('*').order('orden');
        
        modalList.innerHTML = '';
        allMenus.forEach(m => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<span><i class="material-symbols-outlined">${m.icono}</i> ${m.codigo_menu}</span>`;
            div.onclick = async () => {
                // Al agregar un menú, técnicamente no agregamos nada a la tabla ARBOL hasta que tenga una pantalla.
                // PERO para UX, podemos agregar una pantalla "Dummy" o simplemente refrescar la vista.
                // ESTRATEGIA: No se puede tener menú vacío en esta BD relacional estricta.
                // SOLUCIÓN UX: Al elegir menú, forzamos a elegir la primera pantalla de inmediato.
                modal.style.display = 'none';
                currentMenu = { id: m.id_menu }; // Seleccionamos temporalmente
                document.getElementById('btnAddScreenToMenu').click(); // Disparamos el siguiente paso
            };
            modalList.appendChild(div);
        });
    };

    // AGREGAR PANTALLA (Abrir catálogo de pantallas)
    document.getElementById('btnAddScreenToMenu').onclick = async () => {
        if (!currentMenu) return;
        
        modalTitle.innerText = "Agregar Pantalla al Menú";
        modalList.innerHTML = '<div class="spinner"></div>';
        modal.style.display = 'flex';

        const { data: allScreens } = await supabase.from('pr_sis_pantallas').select('*').order('clave_nombre');
        
        modalList.innerHTML = '';
        allScreens.forEach(s => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerText = s.clave_nombre;
            
            div.onclick = async () => {
                // INSERTAR RELACIÓN
                const { error } = await supabase.from('pr_sis_permisos_arbol').insert({
                    id_perfil: currentProfile.id_perfil,
                    id_menu: currentMenu.id, // O m.id_menu si venimos del paso anterior
                    id_pantalla: s.id_pantalla,
                    nivel_acceso: 1 // Por defecto Ver
                });

                if(error) {
                    if(error.code === '23505') alert("Esta pantalla ya está en este menú.");
                    else alert(error.message);
                } else {
                    modal.style.display = 'none';
                    // Si veníamos de agregar menú nuevo, hay que refrescar la columna 2 también
                    await loadMenusForProfile(currentProfile.id_perfil);
                    // Refrescar columna 3
                    await loadScreensForMenu(currentProfile.id_perfil, currentMenu.id);
                    
                    // Restaurar visual selection del menú
                    // (Simplificación: El loadMenus regenera el DOM, habría que buscar el ID y ponerle active)
                }
            };
            modalList.appendChild(div);
        });
    };
}