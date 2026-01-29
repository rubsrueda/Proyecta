//js/screens/dashboard.js
import { State } from '../core/state.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    const user = State.profile;
    
    container.innerHTML = `
        <div class="screen-header">
            <h2>Dashboard</h2>
            <span style="color:#64748b; font-size:0.9rem;">Bienvenido, ${user.nombre_completo}</span>
        </div>

        <!-- GRID DE WIDGETS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
            
            <!-- WIDGET 1: RESUMEN -->
            <div class="card" style="border-left: 4px solid #2563eb;">
                <h3 style="margin:0; font-size:0.9rem; color:#64748b;">Mis Tickets Abiertos</h3>
                <div style="font-size:2rem; font-weight:bold; color:#1e293b;">3</div>
                <small style="color:#2563eb;">2 Alta Prioridad</small>
            </div>

            <!-- WIDGET 2: TAREAS -->
            <div class="card" style="border-left: 4px solid #16a34a;">
                <h3 style="margin:0; font-size:0.9rem; color:#64748b;">Tareas Proyecto</h3>
                <div style="font-size:2rem; font-weight:bold; color:#1e293b;">12</div>
                <small style="color:#16a34a;">Proy. Migración</small>
            </div>

            <!-- WIDGET 3: HORAS -->
            <div class="card" style="border-left: 4px solid #f59e0b;">
                <h3 style="margin:0; font-size:0.9rem; color:#64748b;">Horas Semanales</h3>
                <div style="font-size:2rem; font-weight:bold; color:#1e293b;">18.5h</div>
                <small style="color:#f59e0b;">Meta: 40h</small>
            </div>

        </div>

        <div style="margin-top: 30px;">
            <h3>Accesos Rápidos</h3>
            <div style="display:flex; gap:10px;">
                <button class="btn-primary" onclick="alert('Ir a nuevo ticket')">+ Nuevo Ticket</button>
                <button class="btn-secondary" onclick="alert('Ir a reporte')">Ver Reportes</button>
            </div>
        </div>
    `;
    
    // Traducir si hay etiquetas
    I18n.traducirPagina(container);
}