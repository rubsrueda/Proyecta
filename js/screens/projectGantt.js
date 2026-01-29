/**
 * Gantt de Proyecto
 * Código BD: PAN_PROY_GANTT
 * 
 * Visualización temporal
 */

import { supabase } from '../config.js';
import { State } from '../core/state.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-container">
            <div class="screen-header">
                <h1>Gantt de Proyecto</h1>
                <p class="subtitle">Código: PAN_PROY_GANTT</p>
            </div>
            <div class="screen-content">
                <div class="alert alert-info">
                    <strong>En desarrollo:</strong> Esta pantalla será completada en la siguiente fase.
                </div>
            </div>
        </div>
    `;
    
    setupScreen();
}

function setupScreen() {
    console.log('[SCREEN] Cargada: Gantt de Proyecto');
    // Lógica específica aquí
}
