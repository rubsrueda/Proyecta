//js/screens/ticketValidationDirective.js
/**
 * Pantalla de Validación de Tickets para Directivos/Administradores
 * 
 * Permite validar TODOS los tickets (nivel 3)
 * Con información adicional para auditoría y reportes
 */

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
    const screenCode = 'PAN_VALIDACION_DIRECTIVO';
    const accessLevel = Security.getLevel(screenCode);
    
    if (!Security.canAccess(screenCode) || accessLevel < 3) {
        container.innerHTML = `
            <div class="error-card" style="padding:20px; text-align:center;">
                <h3>⛔ Acceso Denegado</h3>
                <p>Solo administradores y directivos pueden acceder a esta pantalla.</p>
            </div>`;
        return;
    }

    console.log(`[VALIDACION DIRECTIVO] Acceso permitido. Nivel: ${accessLevel}`);

    container.innerHTML = `
        <div class="screen-header">
            <h2>Validación General - Directivo</h2>
            <div style="font-size:0.85rem; color:#64748b;">
                Revisa y valida todos los tickets resueltos en el sistema.
            </div>
        </div>

        <!-- FILTROS (OPCIONAL) -->
        <div style="margin-bottom: 15px; padding: 10px; background: #f8fafc; border-radius: 8px; display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="text" id="filterTicket" placeholder="Filtrar por ticket..." style="flex: 1; min-width: 150px; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;">
            <select id="filterSortBy" style="padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.9rem;">
                <option value="fecha-desc">Más Recientes</option>
                <option value="fecha-asc">Más Antiguos</option>
                <option value="codigo">Por Código</option>
            </select>
        </div>

        <!-- ESTADÍSTICAS RÁPIDAS -->
        <div id="quickStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px;">
            <!-- Se llena dinámicamente -->
        </div>

        <!-- LISTA RESPONSIVE: TABLA EN DESKTOP, CARDS EN MÓVIL -->
        <div class="validation-list" id="validationList">
            <div style="text-align:center; padding:20px;">Cargando tickets...</div>
        </div>

        <!-- MODAL DETALLES DEL TICKET (CON INFO ADICIONAL PARA DIRECTIVO) -->
        <div id="modalDetails" class="modal-overlay">
            <div class="modal-content" style="max-width: 90%; max-height: 90vh; overflow-y: auto;">
                <div id="detailContent" style="padding:20px;">
                    <!-- Contenido dinámico -->
                </div>
            </div>
        </div>

        <!-- MODAL APROBACIÓN DIRECTIVO -->
        <div id="modalApprove" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Aprobar Validación</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div style="padding:20px;">
                    <p id="approveTitle" style="font-weight:bold; margin-bottom: 15px;">-</p>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;"><strong>Notas (opcional):</strong></label>
                        <textarea id="approveComment" class="form-control" placeholder="Observaciones de auditoría..." rows="3" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="btnCancelApprove" style="background: #e5e7eb; border: 1px solid #d1d5db; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancelar</button>
                    <button type="button" class="btn-primary" id="btnConfirmApprove" style="background: #10b981; color: white; border: 1px solid #059669; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Aprobar</button>
                </div>
            </div>
        </div>

        <style>
            /* RESPONSIVE DESIGN PARA VALIDACIÓN DIRECTIVO */
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

            .validation-card.directive-info {
                border-left: 4px solid #2563eb;
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

            /* ESTADÍSTICAS RÁPIDAS */
            .stat-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                text-align: center;
            }

            .stat-card-number {
                font-size: 1.8rem;
                font-weight: bold;
                color: #2563eb;
                margin: 8px 0;
            }

            .stat-card-label {
                font-size: 0.85rem;
                color: #64748b;
            }

            /* DESKTOP */
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
                    border-left: none;
                }

                .validation-card-header,
                .validation-card-body,
                .validation-card-meta {
                    display: block;
                    margin: 0;
                    font-size: 0.95rem;
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
                justify-content: flex-end;
            }

            .form-control {
                font-family: inherit;
                font-size: 0.9rem;
            }

            .btn-secondary {
                background: #e5e7eb;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
            }

            .btn-secondary:active {
                background: #d1d5db;
            }

            .btn-primary {
                background: #2563eb;
                color: white;
                border: 1px solid #1d4ed8;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
            }

            .btn-primary:active {
                background: #1d4ed8;
            }
        </style>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await loadDirectiveTickets(State.profile, accessLevel);
}

async function loadDirectiveTickets(userProfile, accessLevel) {
    console.log('[VALIDACION DIRECTIVO] Cargando tickets con acceso total');
    
    // Nivel 3: Sin filtro, ve TODOS
    const { data: tickets, error } = await supabase
        .from('pr_tickets')
        .select(`*, asignado:id_asignado(nombre_completo), solicitante:id_solicitante(nombre_completo)`)
        .eq('estado', 'RESUELTO')
        .order('fecha_creacion', { ascending: false });
    
    console.log('[VALIDACION DIRECTIVO] Tickets obtenidos:', tickets?.length || 0, 'Error:', error);

    const tbody = document.getElementById('validationList');
    tbody.innerHTML = '';

    if (error) { 
        tbody.innerHTML = `<div style="color:red; padding:20px; text-align:center;">${error.message}</div>`; 
        return; 
    }

    // Mostrar estadísticas
    const stats = document.getElementById('quickStats');
    if (tickets && tickets.length > 0) {
        stats.innerHTML = `
            <div class="stat-card">
                <div class="stat-card-label">Pendientes de Validación</div>
                <div class="stat-card-number">${tickets.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Clientes Únicos</div>
                <div class="stat-card-number">${new Set(tickets.map(t => t.id_solicitante)).size}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-label">Equipos Responsables</div>
                <div class="stat-card-number">${new Set(tickets.map(t => t.id_asignado)).size}</div>
            </div>
        `;
    }

    if (tickets.length === 0) {
        tbody.innerHTML = `<div style="text-align:center; padding:20px;">✅ Todos los tickets están validados.</div>`;
        return;
    }

    tickets.forEach(t => {
        const card = document.createElement('div');
        card.className = 'validation-card directive-info';
        card.innerHTML = `
            <div class="validation-card-header">
                <div>
                    <div class="validation-card-title">${t.codigo_visual}</div>
                    <div class="validation-card-code">${t.titulo}</div>
                </div>
            </div>
            <div class="validation-card-body">
                <strong>Solicitante:</strong> ${t.solicitante?.nombre_completo || 'Desconocido'} | 
                <strong>Resuelto por:</strong> ${t.asignado?.nombre_completo || 'Equipo'}
            </div>
            <div class="validation-card-meta">
                <div><strong>Prioridad:</strong> ${t.prioridad || 'Normal'}</div>
                <div><strong>Fecha:</strong> ${Utils.formatDate(t.fecha_fin_real || t.fecha_fin_estimada)}</div>
            </div>
            <div class="validation-card-actions">
                <button class="btn-detail" data-ticket-id="${t.id_ticket}">👁 Detalles</button>
                <button class="btn-reject" data-ticket-id="${t.id_ticket}">Rechazar</button>
                <button class="btn-approve" data-ticket-id="${t.id_ticket}">Aprobar</button>
            </div>
        `;

        // BOTÓN VER DETALLE
        card.querySelector('.btn-detail').onclick = () => showDetailModal(t);

        // BOTÓN RECHAZAR
        card.querySelector('.btn-reject').onclick = async () => {
            const reason = prompt("Motivo del rechazo:");
            if (reason) {
                try {
                    await supabase.from('pr_tickets').update({ 
                        estado: 'EN_PROCESO', 
                        resultado_final: null
                    }).eq('id_ticket', t.id_ticket);
                    
                    await loadDirectiveTickets(userProfile, Security.getLevel('PAN_VALIDACION_DIRECTIVO'));
                } catch (err) {
                    console.error('Error rechazando:', err);
                    alert('Error al rechazar');
                }
            }
        };

        // BOTÓN APROBAR (Modal para el directivo)
        card.querySelector('.btn-approve').onclick = () => openApproveModal(t);

        tbody.appendChild(card);
    });
}

let currentApproveTicket = null;

function showDetailModal(ticket) {
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div style="display: grid; gap: 15px; font-size: 0.9rem;">
            <div style="padding: 8px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <strong>👤 Información del Solicitante</strong>
            </div>
            <div>
                <strong>Solicitante:</strong> ${ticket.solicitante?.nombre_completo || 'Desconocido'}
            </div>
            <div style="padding: 8px; background: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
                <strong>🎫 Detalles del Ticket</strong>
            </div>
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
            <div style="padding: 8px; background: #dcfce7; border-left: 4px solid #10b981; border-radius: 4px;">
                <strong>✅ Resolución</strong>
            </div>
            <div>
                <strong>Resuelto por:</strong> ${ticket.asignado?.nombre_completo || 'Sin asignar'}
            </div>
            <div>
                <strong>Resultado Final:</strong>
                <p style="margin: 5px 0; padding: 8px; background: #f0fdf4; border-radius: 4px; white-space: pre-wrap;">
                    ${ticket.resultado_final || 'No especificado'}
                </p>
            </div>
            <div style="padding: 8px; background: #f3f4f6; border-left: 4px solid #6b7280; border-radius: 4px;">
                <strong>📊 Metadatos</strong>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <strong>Prioridad:</strong> ${ticket.prioridad || 'Normal'}
                </div>
                <div>
                    <strong>Categoría:</strong> ${ticket.categoria || 'General'}
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <strong>Creado:</strong> ${Utils.formatDate(ticket.fecha_creacion)}
                </div>
                <div>
                    <strong>Resuelto:</strong> ${Utils.formatDate(ticket.fecha_fin_real || ticket.fecha_fin_estimada)}
                </div>
            </div>
        </div>
    `;
    
    const modalDetails = document.getElementById('modalDetails');
    modalDetails.classList.add('show');
    
    modalDetails.onclick = (e) => {
        if (e.target === modalDetails) {
            modalDetails.classList.remove('show');
        }
    };
}

function openApproveModal(ticket) {
    currentApproveTicket = ticket;
    document.getElementById('approveTitle').innerText = `${ticket.codigo_visual} - ${ticket.titulo}`;
    document.getElementById('modalApprove').classList.add('show');
}

function setupEvents() {
    // Cerrar modal de aprobación
    const modalApprove = document.getElementById('modalApprove');
    document.querySelector('.close-modal').onclick = () => 
        modalApprove.classList.remove('show');
    
    document.getElementById('btnCancelApprove').onclick = () =>
        modalApprove.classList.remove('show');
    
    modalApprove.onclick = (e) => {
        if (e.target === modalApprove) {
            modalApprove.classList.remove('show');
        }
    };

    // CONFIRMAR APROBACIÓN
    document.getElementById('btnConfirmApprove').onclick = async () => {
        const comment = document.getElementById('approveComment').value;
        
        try {
            // Guardar auditoría/comentario del directivo
            if (comment) {
                await supabase.from('pr_tickets').update({
                    notas_auditoria: comment
                }).eq('id_ticket', currentApproveTicket.id_ticket);
            }
            
            // Cerrar ticket
            await supabase.from('pr_tickets').update({ 
                estado: 'CERRADO' 
            }).eq('id_ticket', currentApproveTicket.id_ticket);

            modalApprove.classList.remove('show');
            
            // Recarga
            await loadDirectiveTickets(State.profile, Security.getLevel('PAN_VALIDACION_DIRECTIVO'));
        } catch (err) {
            console.error('Error aprobando:', err);
            alert('Error al aprobar el ticket');
        }
    };

    // FILTROS
    const filterTicket = document.getElementById('filterTicket');
    if (filterTicket) {
        filterTicket.addEventListener('input', () => applyFilters());
    }

    const filterSort = document.getElementById('filterSortBy');
    if (filterSort) {
        filterSort.addEventListener('change', () => applyFilters());
    }
}

function applyFilters() {
    const filterText = document.getElementById('filterTicket')?.value.toLowerCase() || '';
    const cards = document.querySelectorAll('.validation-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(filterText) ? 'block' : 'none';
    });
}
