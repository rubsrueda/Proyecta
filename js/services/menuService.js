import { supabase } from '../config.js';
import * as I18n from './i18nService.js';

export async function cargarMenu(idPerfil) {
    console.log(`[MENU] Construyendo menú dinámico para perfil: ${idPerfil}`);

    // NUEVA CONSULTA: Lee de la tabla ARBOL
    const { data, error } = await supabase
        .from('pr_sis_permisos_arbol')
        .select(`
            id_menu,
            orden_menu,
            orden_pantalla,
            pr_sis_menus ( codigo_menu, icono ),
            pr_sis_pantallas ( codigo_pantalla, clave_nombre )
        `)
        .eq('id_perfil', idPerfil)
        .order('orden_menu')
        .order('orden_pantalla');

    if (error) { console.error(error); return []; }

    // CORREGIDO: Procesar para agrupar TODAS las pantallas por menú
    const menuMap = new Map();

    data.forEach(row => {
        const menuId = row.id_menu;
        
        if (!menuMap.has(menuId)) {
            menuMap.set(menuId, {
                id: menuId,
                codigo_menu: row.pr_sis_menus.codigo_menu,
                icono: row.pr_sis_menus.icono,
                pantallas: [] // Array para múltiples pantallas
            });
        }
        
        // Agregar pantalla al array
        menuMap.get(menuId).pantallas.push({
            codigo: row.pr_sis_pantallas.codigo_pantalla,
            nombre: row.pr_sis_pantallas.clave_nombre
        });
    });

    return Array.from(menuMap.values());
}

export function renderizarMenu(items, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = ''; 

    items.forEach(item => {
        // Crear el elemento del menú principal
        const menuLi = document.createElement('li');
        menuLi.className = 'menu-item';
        menuLi.innerHTML = `
            <div class="menu-header">
                <span class="material-symbols-outlined">${item.icono}</span>
                <span>${I18n.t(item.codigo_menu) || item.codigo_menu}</span>
                <span class="material-symbols-outlined menu-arrow">expand_more</span>
            </div>
        `;
        
        // Crear submenu con pantallas
        const submenu = document.createElement('ul');
        submenu.className = 'submenu';
        submenu.style.display = 'none'; // Oculto por defecto
        
        item.pantallas.forEach(pantalla => {
            const pantallaLi = document.createElement('li');
            pantallaLi.className = 'submenu-item';
            pantallaLi.innerHTML = `<span>${I18n.t(pantalla.nombre) || pantalla.nombre}</span>`;
            pantallaLi.dataset.code = pantalla.codigo;
            submenu.appendChild(pantallaLi);
        });
        
        menuLi.appendChild(submenu);
        
        // Toggle del submenu
        menuLi.querySelector('.menu-header').addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = submenu.style.display === 'block';
            submenu.style.display = isOpen ? 'none' : 'block';
            menuLi.classList.toggle('open', !isOpen);
        });
        
        container.appendChild(menuLi);
    });
}