import { supabase } from '../config.js';
import * as TicketsScreen from './ticketList.js'; 
import * as CalendarService from '../services/calendarService.js';
import * as I18n from '../services/i18nService.js';

let currentTicketId = null;
let currentTicketData = null; // Guardamos datos originales para comparar cambios

export async function render(container, ticketId) {
    // Validar que se reciba un ticketId
    if (!ticketId || ticketId === 'null' || ticketId === 'undefined') {
        container.innerHTML = `
            <div class="error-card" style="padding:20px; text-align:center;">
                <h3>⚠️ Ticket no especificado</h3>
                <p>No se proporcionó un ID de ticket válido.</p>
                <button id="btnBackToList" class="btn-primary">Volver a Lista de Tickets</button>
            </div>
        `;
        document.getElementById('btnBackToList').onclick = () => TicketsScreen.render(container);
        return;
    }

    currentTicketId = ticketId;
    container.innerHTML = '<div class="spinner"></div>';

    // Traemos datos del ticket y proyecto asociado (para finanzas)
    const { data: ticket, error } = await supabase
        .from('pr_tickets')
        .select(`*, pr_usuarios!id_solicitante(nombre_completo), pr_proyectos(id_contrato)`)
        .eq('id_ticket', ticketId)
        .single();

    if (error) { alert(error.message); return; }
    currentTicketData = ticket;

    container.innerHTML = `
        <div class="detail-header">
            <div class="detail-title">
                <h2>${ticket.titulo}</h2>
                <div class="detail-meta">
                    <span class="ticket-code" style="font-weight:bold; color:#2563eb;">${ticket.codigo_visual}</span> 
                    <span>| ${new Date(ticket.fecha_creacion).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="detail-actions">
                <button id="btnBack" class="btn-secondary" data-i18n="btn_back">Volver</button>
                <button id="btnSave" class="btn-primary" data-i18n="btn_save_changes">Guardar Cambios</button>
            </div>
        </div>

        <div class="tabs">
            <button class="tab-btn active" data-tab="tab-general" data-i18n="tab_general">General</button>
            <button class="tab-btn" data-tab="tab-time" data-i18n="tab_times">Tiempos</button>
        </div>

        <!-- 1. PESTAÑA GENERAL -->
        <div id="tab-general" class="tab-content active">
            <div class="card">
                <div id="dynamicDetailContainer"></div>

                <div class="form-inline-group">
                    <label data-i18n="lbl_status">Estado</label>
                    <select id="detailStatus">
                        <option value="ABIERTO">ABIERTO</option>
                        <option value="EN_PROCESO">EN PROCESO</option>
                        <option value="RESUELTO">RESUELTO</option>
                        <option value="CERRADO">CERRADO</option>
                    </select>
                </div>
                <div class="form-inline-group">
                    <label data-i18n="lbl_priority">Prioridad</label>
                    <select id="detailPriority">
                        <option value="BAJA">BAJA</option>
                        <option value="MEDIA">MEDIA</option>
                        <option value="ALTA">ALTA</option>
                    </select>
                </div>

                <div class="form-group" style="margin-top:10px;">
                    <label style="font-size:0.75rem; font-weight:600;" data-i18n="lbl_expected_result">Resultado Esperado</label>
                    <textarea id="detailExpected" class="form-control" rows="2" style="background:#fffbeb; font-size:0.85rem;">${ticket.resultado_esperado || ''}</textarea>
                </div>

                <div class="form-group">
                    <label style="font-size:0.75rem; font-weight:600;" data-i18n="lbl_descripcion">Descripción</label>
                    <textarea id="detailDesc" class="form-control" rows="3" style="font-size:0.85rem;">${ticket.descripcion}</textarea>
                </div>
            </div>
        </div>

        <!-- 2. PESTAÑA TIEMPOS -->
        <div id="tab-time" class="tab-content">
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; font-size:1rem;" data-i18n="lbl_hours_log">Horas</h3>
                    <button id="btnSyncCalendar" class="btn-primary" style="background-color:#db4437; padding:4px 10px; font-size:0.8rem;">
                        Importar de Google
                    </button>
                </div>
                <div class="help-text" style="color:#64748b; font-size:0.75rem; margin-bottom:10px;">
                    Usa código: <strong class="ticket-code">${ticket.codigo_visual}</strong> en tu calendario.
                </div>
                <table class="data-table" id="activitiesTable">
                    <thead><tr><th>Fecha</th><th>Resumen</th><th>Tiempo</th></tr></thead>
                    <tbody><tr><td colspan="3">Cargando...</td></tr></tbody>
                </table>
                <div style="text-align:right; margin-top:10px; font-weight:bold; font-size:0.9rem;" id="totalHours">0h 0m</div>
            </div>
        </div>

        <!-- MODAL DE CIERRE (NUEVO) -->
        <div id="modalCloseTicket" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Cerrar Ticket</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div style="padding:10px; background:#f0f9ff; border-radius:4px; margin-bottom:15px; font-size:0.9rem;">
                    Estás a punto de cerrar el ticket. Por favor, reporta el tiempo final invertido.
                </div>
                <div class="form-inline-group">
                    <label>Horas Finales</label>
                    <input type="number" id="closeHours" value="0.5" step="0.5" min="0">
                </div>
                <div class="form-group">
                    <label>Detalle de Solución / Cierre</label>
                    <textarea id="closeComment" class="form-control" rows="3" placeholder="Describe qué se hizo para resolverlo..."></textarea>
                </div>
                <div class="modal-footer">
                    <button id="btnCancelClose" class="btn-secondary">Cancelar</button>
                    <button id="btnConfirmClose" class="btn-primary">Confirmar Cierre</button>
                </div>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);

    // Cargar datos dinámicos
    await loadDetailDynamicFields(ticket.id_organizacion, ticket.valores_dinamicos);
    
    // Selects
    document.getElementById('detailStatus').value = ticket.estado;
    document.getElementById('detailPriority').value = ticket.prioridad;

    if (ticket.estado === 'CERRADO') lockScreenForClosedTicket(container);

    setupDetailEvents(container, ticketId);
}

function lockScreenForClosedTicket(container) {
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = true;
        input.style.backgroundColor = "#f1f5f9";
    });
    const btnSave = document.getElementById('btnSave');
    if (btnSave) btnSave.style.display = 'none';

    const header = container.querySelector('.detail-title');
    const badge = document.createElement('div');
    badge.innerHTML = '🔒 TICKET CERRADO';
    badge.style.cssText = 'background:#fee2e2; color:#b91c1c; padding:5px; border-radius:4px; font-size:0.8rem; display:inline-block; margin-top:5px; font-weight:bold;';
    header.appendChild(badge);
}

async function loadDetailDynamicFields(orgId, valoresActuales) {
    const container = document.getElementById('dynamicDetailContainer');
    container.innerHTML = '';
    const { data: fields } = await supabase.from('pr_campos_dinamicos').select('*').eq('id_organizacion', orgId).order('id_campo');
    if (fields) {
        fields.forEach(field => {
            const div = document.createElement('div');
            div.className = 'form-inline-group';
            const label = document.createElement('label');
            label.innerText = field.etiqueta;
            div.appendChild(label);
            let input;
            const valorGuardado = valoresActuales ? valoresActuales[field.nombre_campo] : '';
            if (field.tipo_dato === 'LISTA') {
                input = document.createElement('select');
                field.opciones.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt; o.innerText = opt;
                    if (opt === valorGuardado) o.selected = true;
                    input.appendChild(o);
                });
            } else {
                input = document.createElement('input');
                input.type = 'text'; input.value = valorGuardado;
            }
            input.classList.add('dynamic-input-detail');
            input.dataset.key = field.nombre_campo;
            div.appendChild(input);
            container.appendChild(div);
        });
    }
}

function setupDetailEvents(container, ticketId) {
    // Volver
    document.getElementById('btnBack').onclick = () => TicketsScreen.render(container);

    // Tabs
    const tabs = container.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        };
    });

    // --- LÓGICA DE GUARDADO ---
    const btnSave = document.getElementById('btnSave');
    const modalClose = document.getElementById('modalCloseTicket');

    btnSave.onclick = async () => {
        const newStatus = document.getElementById('detailStatus').value;

        // Si intenta cerrar, abrimos modal
       if (newStatus === 'RESUELTO' && currentTicketData.estado !== 'RESUELTO') {
            modalClose.style.display = 'flex';
            return; // Detenemos guardado estándar
        }

        // Guardado normal (sin cerrar)
        await saveTicketChanges();
    };

    // Modal Events
    document.getElementById('btnCancelClose').onclick = () => modalClose.style.display = 'none';
    document.querySelector('.close-modal').onclick = () => modalClose.style.display = 'none';
    
    document.getElementById('btnConfirmClose').onclick = async () => {
        const horas = parseFloat(document.getElementById('closeHours').value) || 0;
        const comentario = document.getElementById('closeComment').value;

        if (horas > 0) {
            // Importar servicios dinámicamente
            const { FinanceService } = await import('../services/financeService.js');
            const { State } = await import('../core/state.js');
            
            // Finanzas
            const contratoId = currentTicketData.pr_proyectos?.id_contrato;
            const rolUsuario = State.user.rol_facturacion || 'Consultor Senior';
            const finanzas = await FinanceService.calcularDesempeno(contratoId, rolUsuario, State.user);

            // Insertar Actividad
            await supabase.from('pr_actividades').insert({
                id_ticket: ticketId,
                id_usuario: State.user.id,
                tipo_actividad: 'CIERRE',
                resumen: comentario || 'Cierre de Ticket',
                duracion_minutos: Math.round(horas * 60),
                fecha_inicio: new Date().toISOString(),
                fecha_fin: new Date(new Date().getTime() + (horas * 3600000)).toISOString(),
                es_facturable: true,
                id_tarifa_aplicada: finanzas?.id_tarifa || null,
                costo_calculado: (finanzas?.costo_interno || 0) * horas,  // Variable corregida
                venta_calculada: (finanzas?.precio_venta || 0) * horas    // Variable corregida
            });
        }

        // Forzamos update de descripción con el comentario de cierre
        if (comentario) {
            document.getElementById('detailDesc').value += `\n[CIERRE]: ${comentario}`;
        }

        modalClose.style.display = 'none';
        await saveTicketChanges(); // Guardar ticket como cerrado
    };
    
    // --- FIN LÓGICA GUARDADO ---

    // Cargar Actividades (Google Sync)
    const btnSync = document.getElementById('btnSyncCalendar');
    const tableBody = document.querySelector('#activitiesTable tbody');
    const totalDisplay = document.getElementById('totalHours');

    const refrescarTablaActividades = async () => {
        const actividades = await CalendarService.obtenerActividadesLocales(ticketId);
        tableBody.innerHTML = '';
        if (!actividades || !actividades.length) { 
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center">-</td></tr>'; 
            totalDisplay.innerText = "0h 0m";
            return; 
        }
        
        let totalMin = 0;
        actividades.forEach(act => {
            totalMin += act.duracion_minutos;
            tableBody.innerHTML += `
                <tr>
                    <td>${new Date(act.fecha_inicio).toLocaleDateString()}</td>
                    <td>${act.resumen}</td>
                    <td style="font-weight:bold;">${(act.duracion_minutos/60).toFixed(1)}h</td>
                </tr>`;
        });
        totalDisplay.innerText = `${Math.floor(totalMin/60)}h ${totalMin%60}m`;
    };

    btnSync.onclick = async () => {
        btnSync.innerText = "...";
        try {
            const ticketCode = currentTicketData.codigo_visual;
            const n = await CalendarService.sincronizarEventosGoogle(ticketCode, ticketId);
            alert(`${n} eventos sincronizados.`);
            await refrescarTablaActividades();
        } catch(e) { alert(e.message); }
        finally { btnSync.innerText = 'Importar de Google'; }
    };

    refrescarTablaActividades();
}

// Función auxiliar para guardar el ticket
async function saveTicketChanges() {
    const newStatus = document.getElementById('detailStatus').value;
    const newPriority = document.getElementById('detailPriority').value;
    const newDesc = document.getElementById('detailDesc').value;
    const newExpected = document.getElementById('detailExpected').value;

    const valoresExtra = {};
    document.querySelectorAll('.dynamic-input-detail').forEach(input => {
        valoresExtra[input.dataset.key] = input.value;
    });

    const { error } = await supabase
        .from('pr_tickets')
        .update({ 
            estado: newStatus, 
            prioridad: newPriority,
            descripcion: newDesc,
            resultado_esperado: newExpected,
            valores_dinamicos: valoresExtra
        })
        .eq('id_ticket', currentTicketId);

    if (error) alert("Error: " + error.message);
    else {
        alert(I18n.t('msg_saved_ok') || "Guardado correctamente");
        // Recargar para refrescar estado
        render(document.getElementById('workspace'), currentTicketId);
    }
}