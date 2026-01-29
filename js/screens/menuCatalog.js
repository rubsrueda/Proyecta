import { supabase } from '../config.js';
import * as I18n from '../services/i18nService.js';

let editingMenuId = null;

export async function render(container) {
    container.innerHTML = `
        <div class="screen-header">
            <h2>Mantenimiento de Menús</h2>
            <p style="color: #64748b; margin-top: 5px; font-size: 0.9rem;">Gestiona el catálogo de menús disponibles para asignar a perfiles</p>
        </div>

        <div class="menu-mgmt-layout">
            <!-- COLUMNA 1: LISTA DE MENÚS -->
            <div class="menu-list-col">
                <div class="col-header">Menús Disponibles</div>
                <div id="listMenus" class="col-list"></div>
                <button class="btn-add" id="btnAddMenu">+ Crear Menú</button>
            </div>

            <!-- COLUMNA 2: EDITOR -->
            <div class="menu-edit-col">
                <div class="col-header">Editor de Menú</div>
                <div id="editorPanel" class="editor-panel">
                    <p class="hint">Selecciona un menú para editar</p>
                </div>
            </div>
        </div>

        <style>
            .menu-mgmt-layout {
                display: grid;
                grid-template-columns: 1fr 1.5fr;
                gap: 15px;
                height: calc(100vh - 140px);
            }

            .menu-list-col, .menu-edit-col {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .col-header {
                background: #f8fafc;
                padding: 10px;
                font-weight: bold;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
            }

            .col-list {
                flex: 1;
                overflow-y: auto;
                padding: 5px;
            }

            .btn-add {
                background: #f1f5f9;
                border: none;
                border-top: 1px solid #e2e8f0;
                padding: 10px;
                color: #2563eb;
                font-weight: 600;
                cursor: pointer;
                text-align: left;
            }

            .btn-add:hover {
                background: #e2e8f0;
            }

            .list-item {
                padding: 10px;
                border-bottom: 1px solid #f1f5f9;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .list-item:hover {
                background: #f8fafc;
            }

            .list-item.active {
                background: #eff6ff;
                border-left: 3px solid #2563eb;
            }

            .hint {
                text-align: center;
                color: #94a3b8;
                margin-top: 20px;
                font-style: italic;
            }

            .editor-panel {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .form-group label {
                font-weight: 600;
                color: #334155;
                font-size: 0.9rem;
            }

            .form-group input, .form-group select {
                padding: 8px;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                font-size: 0.95rem;
            }

            .form-group input:focus, .form-group select:focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
            }

            .btn-remove {
                color: #ef4444;
                cursor: pointer;
                margin-left: 10px;
                font-size: 1.2rem;
            }

            .btn-remove:hover {
                opacity: 0.7;
            }

            .button-group {
                display: flex;
                gap: 10px;
                margin-top: auto;
            }

            .button-group button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95rem;
            }

            .btn-save {
                background: #2563eb;
                color: white;
            }

            .btn-save:hover {
                background: #1d4ed8;
            }

            .btn-cancel {
                background: #f1f5f9;
                color: #64748b;
            }

            .btn-cancel:hover {
                background: #e2e8f0;
            }

            .icon-picker {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 5px;
                max-height: 200px;
                overflow-y: auto;
                margin-top: 5px;
                padding: 10px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                background: #f8fafc;
            }

            .icon-option {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1.5rem;
                background: white;
            }

            .icon-option:hover {
                background: #eff6ff;
                border-color: #2563eb;
            }

            .icon-option.selected {
                background: #eff6ff;
                border: 2px solid #2563eb;
            }

            .error-msg {
                color: #ef4444;
                font-size: 0.85rem;
                margin-top: 3px;
            }

            .success-msg {
                color: #16a34a;
                font-size: 0.85rem;
                margin-top: 3px;
            }

            @media (max-width: 768px) {
                .menu-mgmt-layout {
                    grid-template-columns: 1fr;
                    grid-template-rows: 1fr 1fr;
                    height: auto;
                }
            }
        </style>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await loadMenus();
}

// ======================= LÓGICA DE CARGA =======================

async function loadMenus() {
    const list = document.getElementById('listMenus');
    try {
        const { data: menus, error } = await supabase
            .from('pr_sis_menus')
            .select('*')
            .order('orden');
        
        if (error) {
            console.error('Error cargando menús:', error);
            list.innerHTML = '<p style="color: red; padding: 10px;">Error: ' + error.message + '</p>';
            return;
        }
        
        list.innerHTML = '';
        
        if (!menus || menus.length === 0) {
            list.innerHTML = '<p class="hint">No hay menús creados</p>';
            return;
        }
        
        menus.forEach(m => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <span>
                    <i class="material-symbols-outlined" style="font-size:18px; vertical-align:middle; margin-right:8px;">${m.icono || 'settings'}</i>
                    ${m.codigo_menu}
                </span>
                <span class="btn-remove" title="Eliminar menú">&times;</span>
            `;
            
            // Evento Seleccionar
            div.onclick = (e) => {
                if(e.target.classList.contains('btn-remove')) return;
                selectMenu(m, div);
            };
            
            // Evento Eliminar
            div.querySelector('.btn-remove').onclick = async (e) => {
                e.stopPropagation();
                if(confirm(`¿Eliminar el menú "${m.codigo_menu}"? Esto eliminará todos los permisos asociados.`)) {
                    try {
                        // 1. Eliminar permisos asociados
                        const { error: permError } = await supabase.from('pr_sis_permisos_arbol')
                            .delete()
                            .eq('id_menu', m.id_menu);
                        
                        if (permError) throw permError;
                        
                        // 2. Eliminar menú
                        const { error: menuError } = await supabase.from('pr_sis_menus')
                            .delete()
                            .eq('id_menu', m.id_menu);
                        
                        if (menuError) throw menuError;
                        
                        editingMenuId = null;
                        document.getElementById('editorPanel').innerHTML = '<p class="hint">Selecciona un menú para editar</p>';
                        await loadMenus();
                    } catch (err) {
                        console.error('Error eliminando menú:', err);
                        alert('Error: ' + err.message);
                    }
                }
            };
            
            list.appendChild(div);
        });
    } catch (err) {
        console.error('Error en loadMenus:', err);
        list.innerHTML = '<p style="color: red; padding: 10px;">Error: ' + err.message + '</p>';
    }
}

function selectMenu(menu, div) {
    editingMenuId = menu.id_menu;
    
    document.querySelectorAll('#listMenus .list-item').forEach(d => d.classList.remove('active'));
    div.classList.add('active');
    
    showEditor(menu);
}

function showEditor(menu) {
    const editor = document.getElementById('editorPanel');
    
    const commonIcons = [
        'dashboard', 'settings', 'person', 'group', 'description',
        'attach_money', 'trending_up', 'support_agent', 'build', 'assignment',
        'calendar_month', 'schedule', 'people', 'assessment', 'notifications',
        'task', 'shopping_cart', 'library_books', 'info', 'favorite'
    ];
    
    const iconsHTML = commonIcons.map(icon => `
        <div class="icon-option ${menu.icono === icon ? 'selected' : ''}" data-icon="${icon}">
            <i class="material-symbols-outlined">${icon}</i>
        </div>
    `).join('');
    
    editor.innerHTML = `
        <div class="form-group">
            <label>Código del Menú *</label>
            <input type="text" id="menuCode" value="${menu.codigo_menu}" placeholder="Ej: FINANZAS, OPERACION">
        </div>
        
        <div class="form-group">
            <label>Descripción</label>
            <input type="text" id="menuDesc" value="${menu.descripcion || ''}" placeholder="Descripción breve del menú">
        </div>
        
        <div class="form-group">
            <label>Orden</label>
            <input type="number" id="menuOrder" value="${menu.orden || 1}" min="1">
        </div>
        
        <div class="form-group">
            <label>Icono</label>
            <div class="icon-picker" id="iconPicker">
                ${iconsHTML}
            </div>
        </div>
        
        <div id="feedbackMsg"></div>
        
        <div class="button-group">
            <button class="btn-save" id="btnSave">Guardar Cambios</button>
            <button class="btn-cancel" id="btnCancel">Cancelar</button>
        </div>
    `;
    
    let selectedIcon = menu.icono || 'settings';
    
    // Selector de Icono
    document.querySelectorAll('.icon-option').forEach(opt => {
        opt.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedIcon = opt.dataset.icon;
        };
    });
    
    // Guardar
    document.getElementById('btnSave').onclick = async () => {
        const code = document.getElementById('menuCode').value.trim();
        const desc = document.getElementById('menuDesc').value.trim();
        const order = parseInt(document.getElementById('menuOrder').value) || 1;
        
        const feedback = document.getElementById('feedbackMsg');
        
        if (!code) {
            feedback.innerHTML = '<div class="error-msg">El código es requerido</div>';
            return;
        }
        
        try {
            const { error } = await supabase.from('pr_sis_menus').update({
                codigo_menu: code,
                descripcion: desc,
                orden: order,
                icono: selectedIcon
            }).eq('id_menu', editingMenuId);
            
            if (error) throw error;
            
            feedback.innerHTML = '<div class="success-msg">✓ Menú actualizado correctamente</div>';
            setTimeout(() => {
                loadMenus();
            }, 800);
        } catch (err) {
            console.error('Error guardando menú:', err);
            feedback.innerHTML = '<div class="error-msg">Error: ' + err.message + '</div>';
        }
    };
    
    // Cancelar
    document.getElementById('btnCancel').onclick = () => {
        editingMenuId = null;
        document.getElementById('editorPanel').innerHTML = '<p class="hint">Selecciona un menú para editar</p>';
        document.querySelectorAll('#listMenus .list-item').forEach(d => d.classList.remove('active'));
    };
}

// ======================= LÓGICA DE CREAR =======================

function setupEvents() {
    document.getElementById('btnAddMenu').onclick = async () => {
        const code = prompt("Código del Menú (Ej: FINANZAS, OPERACION):");
        if (code && code.trim()) {
            try {
                const { data, error } = await supabase.from('pr_sis_menus').insert({
                    codigo_menu: code.trim().toUpperCase(),
                    descripcion: '',
                    orden: 999, // Se especifica al editar
                    icono: 'settings'
                }).select();
                
                if (error) throw error;
                
                await loadMenus();
                
                // Seleccionar automáticamente el menú recién creado
                setTimeout(() => {
                    const menuDivs = document.querySelectorAll('#listMenus .list-item');
                    const lastMenuDiv = menuDivs[menuDivs.length - 1];
                    if (lastMenuDiv) {
                        lastMenuDiv.click();
                    }
                }, 100);
            } catch (err) {
                console.error('Error creando menú:', err);
                if (err.message.includes('duplicate')) {
                    alert('Este código de menú ya existe');
                } else {
                    alert('Error: ' + err.message);
                }
            }
        }
    };
}
