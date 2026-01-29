/**
 * Gestión de Catálogos
 * Código BD: PAN_CATALOGOS
 * 
 * Gestión de listas desplegables
 */

import { supabase } from '../config.js';
import { State } from '../core/state.js';

export async function render(workspace) {
    workspace.innerHTML = `
        <div class="screen-container">
            <div class="screen-header">
                <h1>Gestión de Catálogos</h1>
                <p class="subtitle">Código: PAN_CATALOGOS</p>
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
    console.log('[SCREEN] Cargada: Gestión de Catálogos');
    // Lógica específica aquí
}
