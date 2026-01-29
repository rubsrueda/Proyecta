import { supabase } from '../config.js';
import * as I18n from './i18nService.js';

export async function cargarMenu(idPerfil) {
    console.log(`[MENU] Construyendo menú dinámico para perfil: ${idPerfil}`);

    // NUEVA CONSULTA: Lee de la tabla ARBOL
    // Agrupamos por Menú y ordenamos
    const { data, error } = await supabase
        .from('pr_sis_permisos_arbol')
        .select(`
            id_menu,
            orden_menu,
            pr_sis_menus ( codigo_menu, icono ),
            pr_sis_pantallas ( codigo_pantalla )
        `)
        .eq('id_perfil', idPerfil)
        .order('orden_menu');

    if (error) { console.error(error); return []; }

    // Procesar para agrupar (Un menú puede tener varias pantallas)
    const menuMap = new Map();

    data.forEach(row => {
        const menuId = row.id_menu;
        
        if (!menuMap.has(menuId)) {
            menuMap.set(menuId, {
                id: menuId,
                codigo_menu: row.pr_sis_menus.codigo_menu,
                icono: row.pr_sis_menus.icono,
                // La pantalla default será la primera que encontremos
                pantalla_default: row.pr_sis_pantallas.codigo_pantalla
            });
        }
    });

    return Array.from(menuMap.values());
}

export function renderizarMenu(items, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = ''; 

    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="material-symbols-outlined">${item.icono}</span>
            <span>${I18n.t(item.codigo_menu) || item.codigo_menu}</span>
        `;
        li.dataset.code = item.pantalla_default; 
        container.appendChild(li);
    });
}