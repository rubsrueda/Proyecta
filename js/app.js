import { supabase } from './config.js';
import { State } from './core/state.js';
import { Router } from './core/router.js';
import * as I18n from './services/i18nService.js';
import * as MenuService from './services/menuService.js';
import { APP_CONFIG, validateUserAccess } from './appConfig.js';
import { VERSION } from './version.js';

// 1. EVENTO DE ARRANQUE
document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    initApp();
});

// LÓGICA DEL SISTEMA
async function initApp() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContent = document.getElementById('app-content');

    // 1. VERIFICAR MODO ARQUITECTO
    const isArchitect = localStorage.getItem('PROYECTA_ARCHITECT_MODE') === 'true';
    let userId = null;

    // 2. Verificar sesión REAL de Supabase primero
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Si hay sesión real, no usar modo arquitecto
        localStorage.removeItem('PROYECTA_ARCHITECT_MODE');
        State.user = session.user;
        userId = session.user.id;
    } else if (isArchitect) {
        console.warn("⚠️ MODO ARQUITECTO ACTIVADO");
        // Usamos el ID fijo que creamos en SQL
        userId = '00000000-0000-0000-0000-000000000000';
        
        // Simulamos un objeto usuario en el State
        State.user = { id: userId, email: 'architect@sys' };
    } else {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Cargar contexto con el ID (sea real o sea el del arquitecto)
        await loadFullContext(userId);
        
        // VALIDAR ACCESO A LA APP (ahora es asincrónica)
        const hasAccess = await validateUserAccess(State.profile);
        if (!hasAccess) {
            console.error('[APP] Usuario sin acceso a esta aplicación');
            alert(APP_CONFIG.ERROR_MESSAGE);
            await supabase.auth.signOut();
            localStorage.removeItem('PROYECTA_ARCHITECT_MODE');
            
            // Redirigir al fallback o al index
            const fallbackUrl = APP_CONFIG.FALLBACK_URL || 'index.html';
            window.location.href = fallbackUrl;
            return;
        }
        
        console.log('[APP] Usuario validado para', APP_CONFIG.APP_ID);

        const workspace = document.getElementById('workspace');
        Router.init(workspace);

        await I18n.cargarDiccionario(State.profile.codigo_idioma || 'es');

        const menuItems = await MenuService.cargarMenu(State.profile.id_perfil_defecto);
        MenuService.renderizarMenu(menuItems, 'dynamicMenu');
        
        setupNavigation();
        setupUI();

        // Pantalla inicial por defecto
        Router.navigate('PAN_DASHBOARD');

        // Actualizar marca de agua con la versión
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = VERSION.number;
        }

        loadingScreen.style.display = 'none';
        appContent.style.display = 'flex';

    } catch (error) {
        console.error("Error Fatal:", error);
        // Si falla el modo arquitecto, lo desactivamos para no buclear
        if (isArchitect) localStorage.removeItem('PROYECTA_ARCHITECT_MODE');
        alert("Error iniciando sistema: " + error.message);
        window.location.href = 'index.html';
    }
}

// CARGA DE CONTEXTO
async function loadFullContext(userId) {
    // 1. Cargar Usuario y su Perfil
    const baseSelect = `
            *,
            pr_sis_perfiles!id_perfil_defecto ( nombre_perfil ),
            pr_organizaciones!id_organizacion_principal ( nombre_comercial, es_interna )
        `;

    let usuario = null;
    let error = null;

    // Estrategia 1: id_usuario directo
    const r1 = await supabase
        .from('pr_usuarios')
        .select(baseSelect)
        .eq('id_usuario', userId)
        .maybeSingle();

    if (!r1.error && r1.data) {
        usuario = r1.data;
    } else {
        // Estrategia 2: por email de la sesión
        const email = State.user?.email;
        if (email) {
            const r2 = await supabase
                .from('pr_usuarios')
                .select(baseSelect)
                .eq('email', email)
                .maybeSingle();

            if (!r2.error && r2.data) {
                usuario = r2.data;
            } else {
                // Estrategia 3: por auth_user_id (si existe columna)
                const r3 = await supabase
                    .from('pr_usuarios')
                    .select(baseSelect)
                    .eq('auth_user_id', userId)
                    .maybeSingle();

                if (!r3.error && r3.data) {
                    usuario = r3.data;
                } else {
                    error = r3.error || r2.error || r1.error;
                }
            }
        } else {
            error = r1.error;
        }
    }

    if (error || !usuario) throw new Error("No se pudo cargar el usuario.");
    
    State.profile = usuario;
    State.organization = usuario.pr_organizaciones;

    // 2. CARGAR PERMISOS (NUEVA TABLA ARBOL)
    // Ahora leemos pr_sis_permisos_arbol
    const { data: permisos, error: errPerm } = await supabase
        .from('pr_sis_permisos_arbol')
        .select(`
            nivel_acceso,
            pr_sis_pantallas ( codigo_pantalla, ruta_archivo )
        `)
        .eq('id_perfil', usuario.id_perfil_defecto);

    if (errPerm) throw new Error("Error cargando matriz de seguridad.");

    // 3. Llenar el Mapa de Seguridad en Memoria
    State.screenMap = {}; // Limpiar anterior
    
    if (permisos) {
        permisos.forEach(p => {
            if (p.pr_sis_pantallas) {
                State.screenMap[p.pr_sis_pantallas.codigo_pantalla] = {
                    level: p.nivel_acceso,
                    file: p.pr_sis_pantallas.ruta_archivo
                };
            }
        });
    }
    
    console.log("[STATE] Mapa de seguridad cargado:", Object.keys(State.screenMap).length, "pantallas.");
}

// NAVEGACIÓN (Menú Lateral)
function setupNavigation() {
    // Los eventos de toggle del menú ya están en menuService.js
    // Aquí solo manejamos los clics en los items del submenu
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // Delegación de eventos para items del submenu (generados dinámicamente)
    document.getElementById('dynamicMenu').addEventListener('click', (e) => {
        const submenuItem = e.target.closest('.submenu-item');
        
        if (submenuItem) {
            // Remover active de todos los items
            document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
            submenuItem.classList.add('active');
            
            const screenCode = submenuItem.dataset.code;
            if(screenCode) {
                Router.navigate(screenCode);
            }

            // Cerrar sidebar en móvil
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        }
    });
}

// UI GENERAL
function setupUI() {
    document.getElementById('user-name').innerText = State.profile.nombre_completo;
    document.getElementById('user-role').innerText = State.profile.pr_sis_perfiles?.nombre_perfil || "Perfil";

    if (State.organization) {
        document.getElementById('org-name').innerText = State.organization.nombre_comercial;
        const orgType = document.getElementById('org-type');
        const isInterna = State.organization.es_interna;
        orgType.innerText = isInterna ? "INTERNA" : "CLIENTE";
        orgType.style.background = isInterna ? "#dbeafe" : "#dcfce7";
        orgType.style.color = isInterna ? "#1e40af" : "#166534";
    }

    document.getElementById('btnLogout').onclick = async () => {
        State.clear();
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    };
    I18n.traducirPagina();
}

function setupMobileMenu() {
    const btnToggle = document.querySelector('.toggle-menu'); 
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (btnToggle && sidebar && overlay) {
        btnToggle.onclick = (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        };

        overlay.onclick = () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        };
    }
}