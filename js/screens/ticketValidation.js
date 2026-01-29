//js/screens/ticketValidation.js
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { State } from '../core/state.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        container.innerHTML = '<p>Error: Usuario no autenticado</p>';
        return;
    }

    // Obtener usuario de BD (intentar múltiples estrategias)
    let userData = null;
    const r1 = await supabase.from('pr_usuarios').select('id_usuario, id_perfil_defecto').eq('email', user.email).maybeSingle();
    if (!r1.error && r1.data) {
        userData = r1.data;
    } else {
        const r2 = await supabase.from('pr_usuarios').select('id_usuario, id_perfil_defecto').eq('auth_user_id', user.id).maybeSingle();
        if (!r2.error && r2.data) {
            userData = r2.data;
        } else {
            const r3 = await supabase.from('pr_usuarios').select('id_usuario, id_perfil_defecto').eq('id_usuario', user.id).maybeSingle();
            if (!r3.error && r3.data) userData = r3.data;
        }
    }

    if (!userData) {
        container.innerHTML = '<p style="color:red;">Error: Tu usuario no está registrado en el sistema</p>';
        return;
    }
    
    console.log('[VALIDACION] Usuario encontrado:', userData);

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
    await loadToValidate(userData);
}

async function loadToValidate(userData) {
    console.log('[VALIDACION] Iniciando loadToValidate para usuario:', userData);
    
    if (!userData || !userData.id_perfil_defecto) {
        console.error('[VALIDACION] Error: userData no tiene perfil');
        document.getElementById('validationBody').innerHTML = `<tr><td colspan="4" style="color:red">Error: Usuario sin perfil asignado</td></tr>`;
        return;
    }
    
    const userId = userData.id_usuario;
    const userProfile = parseInt(userData.id_perfil_defecto);
    console.log('[VALIDACION] Perfil convertido a número:', userProfile);
    
    let query = supabase
        .from('pr_tickets')
        .select(`*, asignado:id_asignado(nombre_completo), solicitante:id_solicitante(nombre_completo)`)
        .eq('estado', 'RESUELTO');
    
    // Perfil 5 = Cliente: Ve tickets que ÉL solicitó (id_solicitante)
    // Perfil 3 = Gerente/Distribuidor: Ve TODOS los tickets RESUELTOS (para validar en nombre del cliente)
    // Otros perfiles: No ven nada en esta pantalla
    if (userProfile === 5) {
        console.log('[VALIDACION] Perfil CLIENTE - filtrando por id_solicitante');
        query = query.eq('id_solicitante', userId);
    } else if (userProfile === 3) {
        console.log('[VALIDACION] Perfil GERENTE/DISTRIBUIDOR - sin filtro (todos los tickets resueltos)');
        // No aplicamos filtro adicional, ve todos los RESUELTOS
    } else {
        console.log('[VALIDACION] Perfil sin acceso a esta pantalla');
        document.getElementById('validationBody').innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">⚠️ No tienes acceso a esta pantalla</td></tr>`;
        return;
    }
    
    const { data: tickets, error } = await query;
    
    console.log('[VALIDACION] Tickets obtenidos:', tickets?.length || 0, 'Error:', error);

    const tbody = document.getElementById('validationBody');
    tbody.innerHTML = '';

    if (error) { tbody.innerHTML = `<tr><td colspan="4" style="color:red">${error.message}</td></tr>`; return; }

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
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const r = await supabase.from('pr_usuarios').select('id_usuario, id_perfil_defecto').eq('email', authUser.email).maybeSingle();
                if (r.data) loadToValidate(r.data);
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
        
        // Recargar lista
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const r = await supabase.from('pr_usuarios').select('id_usuario, id_perfil_defecto').eq('email', authUser.email).maybeSingle();
        if (r.data) loadToValidate(r.data);
    };
}