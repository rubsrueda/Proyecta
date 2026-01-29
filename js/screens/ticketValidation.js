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

        <!-- LISTA RESPONSIVE: TABLA EN DESKTOP, CARDS EN MÓVIL -->
        <div class="validation-list" id="validationList">
            <div style="text-align:center; padding:20px;">Buscando soluciones...</div>
        </div>

        <!-- MODAL DETALLES DEL TICKET -->
        <div id="modalDetails" class="modal-overlay">
            <div class="modal-content" style="max-width: 90%; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3 id="detailTitle">Detalles del Ticket</h3>
                    <span class="close-modal" id="closeDetails">&times;</span>
                </div>
                <div id="detailContent" style="padding:20px;">
                    <!-- Contenido dinámico -->
                </div>
            </div>
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

        <style>
            /* RESPONSIVE DESIGN PARA VALIDACIÓN */
            .validation-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .validation-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .validation-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                flex-wrap: wrap;
                gap: 8px;
            }

            .validation-card-title {
                font-weight: bold;
                color: #2563eb;
                font-size: 1rem;
            }

            .validation-card-code {
                font-size: 0.85rem;
                color: #64748b;
            }

            .validation-card-body {
                font-size: 0.9rem;
                color: #334155;
                margin-bottom: 10px;
            }

            .validation-card-meta {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                font-size: 0.85rem;
                color: #64748b;
                margin-bottom: 10px;
            }

            .validation-card-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .btn-detail, .btn-approve, .btn-reject {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.85rem;
                flex: 1;
                min-width: 80px;
            }

            .btn-detail {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }

            .btn-detail:active {
                background: #e5e7eb;
            }

            .btn-approve {
                background: #10b981;
                color: white;
                border: 1px solid #059669;
            }

            .btn-approve:active {
                background: #059669;
            }

            .btn-reject {
                background: #f3f4f6;
                color: #b91c1c;
                border: 1px solid #fecaca;
            }

            .btn-reject:active {
                background: #fee2e2;
            }

            /* DESKTOP: Mostrar tabla */
            @media (min-width: 1024px) {
                .validation-list {
                    display: table;
                    width: 100%;
                    border-collapse: collapse;
                }

                .validation-card {
                    display: table-row;
                    border: none;
                    padding: 0;
                    box-shadow: none;
                    background: transparent;
                }

                .validation-card-row {
                    display: table-cell;
                    padding: 12px;
                    border-bottom: 1px solid #e2e8f0;
                    vertical-align: middle;
                }

                .validation-card-row.actions {
                    text-align: right;
                }

                .validation-card-header,
                .validation-card-body,
                .validation-card-meta {
                    display: block;
                    margin: 0;
                    font-size: 0.95rem;
                }

                .validation-card-meta {
                    display: contents;
                }

                .validation-card-actions {
                    justify-content: flex-end;
                }
            }

            /* TABLET */
            @media (min-width: 768px) and (max-width: 1023px) {
                .validation-card {
                    padding: 14px;
                }

                .validation-card-actions {
                    flex-direction: row;
                }

                .btn-detail, .btn-approve, .btn-reject {
                    flex: 0 1 auto;
                    min-width: 90px;
                }
            }

            /* MÓVIL */
            @media (max-width: 767px) {
                .validation-card {
                    padding: 10px;
                }

                .validation-card-header {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .validation-card-meta {
                    grid-template-columns: 1fr;
                    gap: 4px;
                    font-size: 0.8rem;
                }

                .validation-card-actions {
                    flex-direction: column;
                    gap: 6px;
                }

                .btn-detail, .btn-approve, .btn-reject {
                    width: 100%;
                    padding: 8px 10px;
                    font-size: 0.8rem;
                }
            }

            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 10px;
            }

            .modal-overlay.show {
                display: flex;
            }

            .modal-content {
                background: white;
                border-radius: 8px;
                max-width: 500px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }

            .modal-header {
                padding: 16px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h3 {
                margin: 0;
                font-size: 1.1rem;
            }

            .close-modal {
                cursor: pointer;
                font-size: 1.5rem;
                color: #64748b;
            }

            .modal-footer {
                padding: 16px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                gap: 10px;
            }
        </style>
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

    const tbody = document.getElementById('validationList');
    tbody.innerHTML = '';

    if (error) { 
        tbody.innerHTML = `<div style="color:red; padding:20px; text-align:center;">${error.message}</div>`; 
        return; 
    }

    if (tickets.length === 0) {
        tbody.innerHTML = `<div style="text-align:center; padding:20px;">🎉 Todo al día. No tienes validaciones pendientes.</div>`;
        return;
    }

    tickets.forEach(t => {
        const card = document.createElement('div');
        card.className = 'validation-card';
        card.innerHTML = `
            <div class="validation-card-header">
                <div>
                    <div class="validation-card-title">${t.codigo_visual}</div>
                    <div class="validation-card-code">${t.titulo}</div>
                </div>
            </div>
            <div class="validation-card-body">
                <strong>Estado:</strong> ${t.estado}
            </div>
            <div class="validation-card-meta">
                <div><strong>Por:</strong> ${t.asignado?.nombre_completo || 'Equipo'}</div>
                <div><strong>Fecha:</strong> ${Utils.formatDate(t.fecha_fin_real || t.fecha_fin_estimada)}</div>
            </div>
            <div class="validation-card-actions">
                <button class="btn-detail" data-ticket-id="${t.id_ticket}">👁 Ver Detalle</button>
                <button class="btn-reject" data-ticket-id="${t.id_ticket}">Rechazar</button>
                <button class="btn-approve" data-ticket-id="${t.id_ticket}">Aprobar</button>
            </div>
        `;

        // BOTÓN VER DETALLE
        card.querySelector('.btn-detail').onclick = () => showDetailModal(t);

        // BOTÓN RECHAZAR
        card.querySelector('.btn-reject').onclick = async () => {
            const reason = prompt("¿Por qué rechazas la solución?");
            if (reason) {
                await supabase.from('pr_tickets').update({ 
                    estado: 'EN_PROCESO', 
                    resultado_final: null
                }).eq('id_ticket', t.id_ticket);
                await loadToValidate(userProfile, accessLevel);
            }
        };

        // BOTÓN APROBAR
        card.querySelector('.btn-approve').onclick = () => openRateModal(t);

        tbody.appendChild(card);
    });
}

let currentRateTicket = null;
let currentStars = 5;

function showDetailModal(ticket) {
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div style="display: grid; gap: 15px; font-size: 0.9rem;">
            <div>
                <strong>Código:</strong> ${ticket.codigo_visual}
            </div>
            <div>
                <strong>Título:</strong> ${ticket.titulo}
            </div>
            <div>
                <strong>Descripción:</strong>
                <p style="margin: 5px 0; padding: 8px; background: #f8fafc; border-radius: 4px; white-space: pre-wrap;">
                    ${ticket.descripcion || 'Sin descripción'}
                </p>
            </div>
            <div>
                <strong>Estado:</strong> ${ticket.estado}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <strong>Solicitante:</strong><br/>
                    ${ticket.solicitante?.nombre_completo || 'Desconocido'}
                </div>
                <div>
                    <strong>Asignado a:</strong><br/>
                    ${ticket.asignado?.nombre_completo || 'Sin asignar'}
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <strong>Prioridad:</strong><br/>
                    ${ticket.prioridad || 'Normal'}
                </div>
                <div>
                    <strong>Categoría:</strong><br/>
                    ${ticket.categoria || 'General'}
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <strong>Fecha Creación:</strong><br/>
                    ${Utils.formatDate(ticket.fecha_creacion)}
                </div>
                <div>
                    <strong>Fecha Resolución:</strong><br/>
                    ${Utils.formatDate(ticket.fecha_fin_real || ticket.fecha_fin_estimada)}
                </div>
            </div>
            ${ticket.resultado_final ? `
                <div>
                    <strong>Resultado Final:</strong>
                    <p style="margin: 5px 0; padding: 8px; background: #f0fdf4; border-radius: 4px; white-space: pre-wrap;">
                        ${ticket.resultado_final}
                    </p>
                </div>
            ` : ''}
        </div>
    `;
    document.getElementById('modalDetails').classList.add('show');
}

function openRateModal(ticket) {
    currentRateTicket = ticket;
    document.getElementById('rateTitle').innerText = ticket.codigo_visual + ' - ' + ticket.titulo;
    document.getElementById('modalRate').classList.add('show');
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
    // Cerrar modal de detalles
    document.getElementById('closeDetails').onclick = () => 
        document.getElementById('modalDetails').classList.remove('show');

    // Cerrar modal de calificación (X)
    document.querySelector('.close-modal').onclick = () => 
        document.getElementById('modalRate').classList.remove('show');

    // Estrellas de calificación
    document.querySelectorAll('#starsContainer span').forEach(s => {
        s.onclick = () => updateStars(parseInt(s.dataset.val));
    });

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

        document.getElementById('modalRate').classList.remove('show');
        
        // Recargar lista (usar State.profile y el nivel de acceso actual)
        const accessLevel = Security.getLevel('PAN_VALIDACION_SOP');
        await loadToValidate(State.profile, accessLevel);
    };
}