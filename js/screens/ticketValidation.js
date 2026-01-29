//js/screens/ticketValidation.js
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { State } from '../core/state.js';
import { Security } from '../core/security.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        container.innerHTML = '<p>Error: Usuario no autenticado</p>';
        return;
    }

    // 1. VERIFICAR ACCESO BASADO EN MATRIZ DE SEGURIDAD
    const screenCode = 'PAN_VALIDACION_SOP';
    const accessLevel = Security.getLevel(screenCode);
    
    if (!Security.canAccess(screenCode)) {
        container.innerHTML = `
            <div class="error-card" style="padding:20px; text-align:center;">
                <h3>⛔ Acceso Denegado</h3>
                <p>Tu perfil no tiene permisos para acceder a esta pantalla.</p>
            </div>`;
        return;
    }

    console.log(`[VALIDACION] Acceso permitido. Nivel: ${accessLevel}`);

    container.innerHTML = `
        <div class="screen-header">
            <h2>Validación de Cierres</h2>
            <div style="font-size:0.85rem; color:#64748b;">
                Confirma que tus solicitudes fueron resueltas correctamente.
            </div>
        </div>

        <div class="table-container">
            <table class="data-table" id="validationTable">
                <thead>
                    <tr>
                        <th>Ticket</th>
                        <th>Resuelto Por</th>
                        <th>Fecha Resolución</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="validationBody">
                    <tr><td colspan="4" style="text-align:center">Buscando soluciones...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- MODAL CALIFICACIÓN -->
        <div id="modalRate" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Calificar Servicio</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div style="text-align:center; padding:20px;">
                    <p id="rateTitle" style="font-weight:bold;">-</p>
                    <div id="starsContainer" style="font-size:2rem; cursor:pointer; color:#e2e8f0; margin-bottom:15px;">
                        <span data-val="1">★</span><span data-val="2">★</span><span data-val="3">★</span><span data-val="4">★</span><span data-val="5">★</span>
                    </div>
                    <textarea id="rateComment" class="form-control" placeholder="Comentario opcional..." rows="2"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-primary" id="btnConfirmClose">Confirmar Cierre</button>
                </div>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await loadToValidate(State.profile, accessLevel);
}

async function loadToValidate(userProfile, accessLevel) {
    console.log('[VALIDACION] Iniciando loadToValidate con nivel de acceso:', accessLevel);
    
    const userId = userProfile.id_usuario;
    let query = supabase
        .from('pr_tickets')
        .select(`*, asignado:id_asignado(nombre_completo), solicitante:id_solicitante(nombre_completo)`)
        .in('estado', ['RESUELTO', 'CERRADO']);
    
    /**
     * LÓGICA DE NEGOCIO BASADA EN NIVEL DE ACCESO:
     * 
     * Nivel 1 (Ver): Ve solo sus propios tickets (que ÉL solicitó)
     * Nivel 2 (Edit): Ve tickets de su área/equipo (en este caso, también propios)
     * Nivel 3 (Full): Ve TODOS los tickets (acceso total)
     * 
     * IMPORTANTE: Se decide aquí, no por ID de perfil fijo
     */
    
    if (accessLevel === 1) {
        console.log('[VALIDACION] Nivel 1: Viendo solo tus propios tickets');
        query = query.eq('id_solicitante', userId);
    } else if (accessLevel === 2) {
        console.log('[VALIDACION] Nivel 2: Viendo tus tickets y del equipo');
        // Nivel 2: Podría ser tu departamento o equipo
        // Por ahora, similar a nivel 1. Si tienes una tabla de equipos, agrega la lógica aquí
        query = query.eq('id_solicitante', userId);
    } else if (accessLevel === 3) {
        console.log('[VALIDACION] Nivel 3: Acceso total a todos los tickets');
        // Nivel 3: Sin filtro, ve TODOS
    } else {
        console.log('[VALIDACION] Nivel desconocido:', accessLevel);
        document.getElementById('validationBody').innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">⚠️ Nivel de acceso no reconocido</td></tr>`;
        return;
    }
    
    const { data: tickets, error } = await query;
    
    console.log('[VALIDACION] Tickets obtenidos:', tickets?.length || 0, 'Error:', error);

    const tbody = document.getElementById('validationBody');
    tbody.innerHTML = '';

    if (error) { 
        tbody.innerHTML = `<tr><td colspan="4" style="color:red">${error.message}</td></tr>`; 
        return; 
    }

    if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">🎉 Todo al día. No tienes validaciones pendientes.</td></tr>`;
        return;
    }

    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Ticket">
                <strong style="color:#2563eb;">${t.codigo_visual}</strong>
                <div style="font-size:0.9rem;">${t.titulo}</div>
            </td>
            <td data-label="Resuelto Por">${t.asignado?.nombre_completo || 'Equipo'}</td>
            <td data-label="Fecha">${Utils.formatDate(t.fecha_fin_real || t.fecha_fin_estimada)}</td>
            <td data-label="Acciones">
                <div style="display:flex; gap:10px; justify-content: flex-end;">
                    <button class="btn-secondary btn-reject" style="color:#b91c1c; border-color:#fecaca;">Rechazar</button>
                    <button class="btn-primary btn-approve" style="background:#10b981; border-color:#10b981;">Aprobar</button>
                </div>
            </td>
        `;

        // RECHAZAR: Vuelve a EN_PROCESO
        tr.querySelector('.btn-reject').onclick = async () => {
            const reason = prompt("¿Por qué rechazas la solución?");
            if (reason) {
                await supabase.from('pr_tickets').update({ 
                    estado: 'EN_PROCESO', 
                    resultado_final: null // Limpiamos resultado
                }).eq('id_ticket', t.id_ticket);
                
                // Recargar
                await loadToValidate(userProfile, accessLevel);
            }
        };

        // APROBAR: Abre Modal Estrellas
        tr.querySelector('.btn-approve').onclick = () => openRateModal(t);

        tbody.appendChild(tr);
    });
}

let currentRateTicket = null;
let currentStars = 5;

function openRateModal(ticket) {
    currentRateTicket = ticket;
    document.getElementById('rateTitle').innerText = ticket.titulo;
    document.getElementById('modalRate').style.display = 'flex';
    updateStars(5);
}

function updateStars(val) {
    currentStars = val;
    const spans = document.querySelectorAll('#starsContainer span');
    spans.forEach((s, idx) => {
        if (idx < val) s.style.color = '#f59e0b'; // Oro
        else s.style.color = '#e2e8f0'; // Gris
    });
}

function setupEvents() {
    // Estrellas
    document.querySelectorAll('#starsContainer span').forEach(s => {
        s.onclick = () => updateStars(parseInt(s.dataset.val));
    });

    document.querySelector('.close-modal').onclick = () => 
        document.getElementById('modalRate').style.display = 'none';

    // Confirmar Cierre
    document.getElementById('btnConfirmClose').onclick = async () => {
        const comment = document.getElementById('rateComment').value;
        
        // 1. Guardar Evaluación
        await supabase.from('pr_cal_evaluaciones').insert({
            id_ticket: currentRateTicket.id_ticket,
            calificacion: currentStars,
            comentario: comment
        });

        // 2. Cerrar Ticket
        await supabase.from('pr_tickets').update({ estado: 'CERRADO' }).eq('id_ticket', currentRateTicket.id_ticket);

        document.getElementById('modalRate').style.display = 'none';
        
        // Recargar lista (usar State.profile y el nivel de acceso actual)
        const accessLevel = Security.getLevel('PAN_VALIDACION_SOP');
        await loadToValidate(State.profile, accessLevel);
    };
}