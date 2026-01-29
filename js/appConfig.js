// js/appConfig.js - Configuración específica de la aplicación

/**
 * Configuración de identificación de aplicación
 * 
 * Si tienes múltiples apps usando el mismo Supabase:
 * 1. Cambia APP_ID para cada aplicación
 * 2. Configura ALLOWED_ORGANIZATIONS con los IDs de org permitidos
 * 3. O usa VALIDATION_MODE: 'none' para desactivar validación
 */

// js/appConfig.js - Configuración específica de la aplicación

/**
 * Configuración de identificación de aplicación
 * 
 * Proyecta: Valida usuarios en la tabla pr_usuarios
 * Iberion: Usa directamente usuarios de Supabase Auth (sin validación extra)
 * 
 * Si usuario NO está en pr_usuarios → redirige a Iberion
 */

export const APP_CONFIG = {
    // ID único de esta aplicación
    APP_ID: 'PROYECTA',
    
    // Modo de validación:
    // 'database' - Valida si el usuario existe en pr_usuarios (solo para Proyecta)
    // 'none' - Sin validación (para Iberion, que usa Supabase Auth directamente)
    VALIDATION_MODE: 'database',
    
    // Tabla donde buscar el usuario (Proyecta usa pr_usuarios)
    USER_TABLE: 'pr_usuarios',
    
    // Mensaje de error personalizado
    ERROR_MESSAGE: 'Tu cuenta no está registrada en Proyecta. Por favor usa Iberion.',
    
    // URL de redirect después de OAuth
    REDIRECT_PATH: '/app.html',
    
    // URL a donde redirigir si el usuario no pertenece a esta app
    // Déjalo vacío para redirigir a index.html
    FALLBACK_URL: 'https://rubsrueda.github.io/Iberion/'
};

/**
 * Valida si un usuario tiene acceso a esta aplicación
 * Busca si el usuario existe en pr_usuarios (tabla de Proyecta)
 * @param {Object} userProfile - Perfil del usuario desde State
 * @returns {Promise<boolean>} - true si tiene acceso, false si no
 */
export async function validateUserAccess(userProfile) {
    console.log(`[APP] Validando acceso para ${userProfile?.email}`);
    
    // Sin validación
    if (APP_CONFIG.VALIDATION_MODE === 'none') {
        console.log('[APP] VALIDATION_MODE: none - acceso permitido');
        return true;
    }
    
    // Validación en base de datos (Proyecta)
    if (APP_CONFIG.VALIDATION_MODE === 'database') {
        try {
            // Buscar en la tabla pr_usuarios si este usuario existe
            const { data, error } = await window.supabaseClient
                .from(APP_CONFIG.USER_TABLE)
                .select('id_usuario')
                .eq('email', userProfile.email)
                .single();
            
            if (error) {
                console.log(`[APP] Usuario NO encontrado en ${APP_CONFIG.USER_TABLE}: ${userProfile.email}`);
                console.log('[APP] → El usuario pertenece a otra aplicación (Iberion)');
                return false;
            }
            
            if (data) {
                console.log(`[APP] ✅ Usuario validado en Proyecta: ${userProfile.email}`);
                return true;
            }
            
            return false;
        } catch (err) {
            console.error('[APP] Error en validación de BD:', err);
            // Si hay error, permitir acceso (mejor que bloquear)
            return true;
        }
    }
    
    return true;
}

/**
 * Obtiene la URL de redirect para OAuth
 * @returns {string} - URL completa de redirect
 */
export function getRedirectUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const customRedirect = urlParams.get('redirect');
    
    if (customRedirect) {
        return `${window.location.origin}${customRedirect}`;
    }
    
    // Detectar carpeta actual (Proyecta o Iberion)
    const pathname = window.location.pathname; // /Proyecta/index.html o /Proyecta/
    const baseFolderMatch = pathname.match(/^\/([^/]+)/);
    const baseFolder = baseFolderMatch ? baseFolderMatch[1] : '';
    
    const fullPath = baseFolder ? `/${baseFolder}${APP_CONFIG.REDIRECT_PATH}` : APP_CONFIG.REDIRECT_PATH;
    
    return `${window.location.origin}${fullPath}?app=${APP_CONFIG.APP_ID}`;
}
