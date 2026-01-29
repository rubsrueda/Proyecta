/**
 * Turnos
 * Código BD: PAN_TURNOS
 * 
 * Definición de horarios
 */

import { supabase } from '../config.js';
import { State } from '../core/state.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-container">
            <div class="screen-header">
                <h1>Turnos</h1>
                <p class="subtitle">Código: PAN_TURNOS</p>
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
    console.log('[SCREEN] Cargada: Turnos');
    // Lógica específica aquí
}
