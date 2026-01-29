import { supabase } from '../config.js';
import * as I18n from './i18nService.js';

export async function cargarMenu(idPerfil) {
    console.log(`[MENU] Construyendo menú dinámico para perfil: ${idPerfil}`);

    // NUEVA CONSULTA: Lee de la tabla ARBOL
    const { data, error } = await supabase
        .from('pr_sis_permisos_arbol')
        .select(`
            id_menu,
            id_pantalla,
            pr_sis_menus ( codigo_menu, icono, orden ),
            pr_sis_pantallas ( codigo_pantalla, clave_nombre )
        `)
        .eq('id_perfil', idPerfil);

    if (error) { 
        console.error('[MENU] Error cargando permisos:', error); 
        return []; 
    }
    
    if (!data || data.length === 0) {
        console.warn('[MENU] No se encontraron permisos para perfil:', idPerfil);
        return [];
    }

    // CORREGIDO: Procesar para agrupar TODAS las pantallas por menú
    const menuMap = new Map();

    data.forEach(row => {
        // Validar que los datos existen
        if (!row.pr_sis_menus || !row.pr_sis_pantallas) {
            console.warn('[MENU] Registro incompleto:', row);
            return;
        }
        
        const menuId = row.id_menu;
        
        if (!menuMap.has(menuId)) {
            menuMap.set(menuId, {
                id: menuId,
                codigo_menu: row.pr_sis_menus.codigo_menu,
                icono: row.pr_sis_menus.icono,
                orden: row.pr_sis_menus.orden,
                pantallas: [] // Array para múltiples pantallas
            });
        }
        
        // Agregar pantalla al array
        menuMap.get(menuId).pantallas.push({
            codigo: row.pr_sis_pantallas.codigo_pantalla,
            nombre: row.pr_sis_pantallas.clave_nombre
        });
    });

    // Ordenar menús por el campo orden
    const menusOrdenados = Array.from(menuMap.values()).sort((a, b) => a.orden - b.orden);
    
    return menusOrdenados;
}

export function renderizarMenu(items, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = ''; 

    console.log('[MENU] Renderizando', items.length, 'menús');

    items.forEach(item => {
        console.log('[MENU]', item.codigo_menu, '- Pantallas:', item.pantallas.length);
        
        // Crear el elemento del menú principal
        const menuLi = document.createElement('li');
        menuLi.className = 'menu-item';
        
        // Header del menú
        const menuHeader = document.createElement('div');
        menuHeader.className = 'menu-header';
        menuHeader.innerHTML = `
            <span class="material-symbols-outlined">${item.icono}</span>
            <span>${I18n.t(item.codigo_menu) || item.codigo_menu}</span>
            <span class="material-symbols-outlined menu-arrow">expand_more</span>
        `;
        
        menuLi.appendChild(menuHeader);
        
        // Crear submenu con pantallas
        const submenu = document.createElement('ul');
        submenu.className = 'submenu';
        
        item.pantallas.forEach(pantalla => {
            const pantallaLi = document.createElement('li');
            pantallaLi.className = 'submenu-item';
            pantallaLi.innerHTML = `<span>${I18n.t(pantalla.nombre) || pantalla.nombre}</span>`;
            pantallaLi.dataset.code = pantalla.codigo;
            submenu.appendChild(pantallaLi);
        });
        
        menuLi.appendChild(submenu);
        
        // Toggle del submenu
        menuHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Cerrar otros menús
            document.querySelectorAll('.menu-item').forEach(otherMenu => {
                if (otherMenu !== menuLi && otherMenu.classList.contains('open')) {
                    otherMenu.classList.remove('open');
                    const otherSubmenu = otherMenu.querySelector('.submenu');
                    if (otherSubmenu) otherSubmenu.style.display = 'none';
                }
            });
            
            // Toggle este menú
            const isOpen = menuLi.classList.contains('open');
            menuLi.classList.toggle('open');
            submenu.style.display = isOpen ? 'none' : 'block';
            
            console.log('[MENU] Toggle', item.codigo_menu, '- Abierto:', !isOpen);
        });
        
        container.appendChild(menuLi);
    });
}