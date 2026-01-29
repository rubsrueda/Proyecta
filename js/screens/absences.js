/**
 * Ausencias
 * Código BD: PAN_AUSENCIAS
 * 
 * Solicitud de vacaciones
 */

import { supabase } from '../config.js';
import { State } from '../core/state.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-container">
            <div class="screen-header">
                <h1>Ausencias</h1>
                <p class="subtitle">Código: PAN_AUSENCIAS</p>
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
    console.log('[SCREEN] Cargada: Ausencias');
    // Lógica específica aquí
}
