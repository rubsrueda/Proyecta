// js/core/router.js
import { State } from './state.js';
import { Security } from './security.js'; // Asumo que tienes este archivo, si no, avísame
import * as I18n from '../services/i18nService.js';

export const Router = {
    container: null, 

    init(domElement) {
        this.container = domElement;

        // --- [NUEVO] Escuchar cambios en la URL (Botones Atrás/Adelante del navegador) ---
        window.onhashchange = () => {
            const hash = window.location.hash.replace('#', '');
            if (!hash) return;
            
            // Separar el código de pantalla de los parámetros: #PAN_TICKET_DETALLE/123
            const [screenCode, param] = hash.split('/');
            
            // Solo navegamos si el código es válido
            if (screenCode && State.screenMap[screenCode]) {
                // Pasamos false para no volver a empujar al historial (ya estamos ahí)
                this.navigate(screenCode, param || null, false);
            }
        };
    },

    // --- [CAMBIO] Añadido parámetro updateHistory para control de URL ---
    async navigate(screenCode, params = null, updateHistory = true) {
        if (!this.container) {
            console.error("Router no inicializado.");
            return;
        }

        console.log(`[ROUTER] Navegando a: ${screenCode}`);

        // 1. Verificar Seguridad
        // Si no tienes Security.js aún, comenta este bloque IF
        if (Security && !Security.canAccess(screenCode)) {
             this.container.innerHTML = `
                <div class="error-card" style="padding:20px; text-align:center;">
                    <h3>⛔ Acceso Denegado</h3>
                    <p>No tienes permisos para ver: <strong>${screenCode}</strong></p>
                </div>`;
            return;
        }

        // 2. Obtener metadatos
        const screenData = State.screenMap[screenCode];
        
        if (!screenData) {
            console.error(`Pantalla ${screenCode} no encontrada en screenMap.`);
            this.container.innerHTML = `<p>Error 404: Pantalla no encontrada (${screenCode})</p>`;
            return;
        }

        const fileName = screenData.file; 

        // --- [NUEVO] Actualizar URL Visual ---
        if (updateHistory) {
            // Esto cambia la URL a .../app.html#PAN_TICKET_DETALLE/123
            const hashUrl = params ? `#${screenCode}/${params}` : `#${screenCode}`;
            window.history.pushState(null, null, hashUrl);
        }

        // 3. Spinner
        this.container.innerHTML = '<div class="spinner-container" style="padding:50px; text-align:center;">Cargando...</div>';

        try {
            // 4. Importación Dinámica
            // Asumimos ruta relativa desde /js/core/ hacia /js/screens/
            const module = await import(`../screens/${fileName}`);

            if (!module.render) {
                throw new Error(`El archivo ${fileName} no tiene 'render'.`);
            }

            // 5. Renderizar
            // Aquí es donde tus archivos actuales (ticketList.js) reciben el control
            await module.render(this.container, params);
            
            // 6. Traducir
            I18n.traducirPagina(this.container);

        } catch (error) {
            console.error(`[ROUTER] Error cargando ${fileName}:`, error);
            this.container.innerHTML = `
                <div class="error-card" style="color:red; padding:20px;">
                    <h3>🔥 Error de Carga</h3>
                    <p>Fallo al cargar script: <strong>${fileName}</strong></p>
                    <pre>${error.message}</pre>
                </div>`;
        }
    }
};