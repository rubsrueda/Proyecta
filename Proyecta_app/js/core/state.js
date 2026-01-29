// js/core/state.js

export const State = {
    user: null,         // Objeto usuario de Supabase
    profile: null,      // Datos de pr_usuarios (perfil, idioma)
    organization: null, // Datos de pr_organizaciones
    
    // El Mapa de Seguridad:
    // Es un objeto donde la clave es el CODIGO_PANTALLA (Ej: PAN_TICKET_ALTA)
    // y el valor es el objeto con nivel y ruta.
    // Ejemplo: { 'PAN_TICKET_ALTA': { level: 2, file: 'ticketCreate.js' } }
    screenMap: {},

    // Reinicia el estado al cerrar sesión
    clear() {
        this.user = null;
        this.profile = null;
        this.organization = null;
        this.screenMap = {};
    }
};