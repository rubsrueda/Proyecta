//js/screens/ticketDispatcher.js
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

let selectedTicketId = null;

export async function render(container) {
    container.innerHTML = `
        <div class="screen-header">
            <h2>Mesa de Ayuda (Dispatcher)</h2>
            <div style="font-size:0.85rem; color:#64748b;">
                Distribución de tickets pendientes.
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; height: calc(100vh - 140px);">
            
            <!-- COLUMNA IZQUIERDA: TICKETS SIN ASIGNAR -->
            <div class="card" style="display:flex; flex-direction:column; overflow:hidden; padding:0;">
                <div style="padding:15px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-weight:bold;">
                    📥 Pendientes de Asignación (<span id="countPending">0</span>)
                </div>
                <div id="pendingList" style="flex:1; overflow-y:auto; padding:10px;">
                    <div class="spinner"></div>
                </div>
            </div>

            <!-- COLUMNA DERECHA: CARGA DE EQUIPO -->
            <div class="card" style="display:flex; flex-direction:column; overflow:hidden; padding:0;">
                <div style="padding:15px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-weight:bold;">
                    👥 Carga del Equipo
                </div>
                <div id="teamLoadList" style="flex:1; overflow-y:auto; padding:10px;">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>

        <!-- MODAL DE ASIGNACIÓN RÁPIDA -->
        <div id="modalAssign" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Asignar Ticket</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <p id="assignTicketTitle" style="color:#64748b; margin-bottom:15px;"></p>
                
                <div class="form-group">
                    <label>Selecciona Consultor</label>
                    <div id="consultantSelector" class="consultant-list-select">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                </div>
            </div>
        </div>

        <style>
            /* Estilos específicos para esta pantalla */
            .pending-item {
                background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 10px;
                cursor: pointer; transition: all 0.2s; position: relative;
            }
            .pending-item:hover { transform: translateX(3px); border-color: #2563eb; }
            .pending-item.priority-ALTA { border-left: 4px solid #ef4444; }
            .pending-item.priority-MEDIA { border-left: 4px solid #f59e0b; }
            .pending-item.priority-BAJA { border-left: 4px solid #10b981; }

            .team-member {
                display: flex; align-items: center; justify-content: space-between;
                padding: 10px; border-bottom: 1px solid #f1f5f9;
            }
            .load-bar-bg { width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-top:5px; }
            .load-bar-fill { height: 100%; background: #10b981; }

            .consultant-option {
                display: flex; justify-content: space-between; align-items: center;
                padding: 10px; border: 1px solid #e2e8f0; margin-bottom: 5px; border-radius: 6px; cursor: pointer;
            }
            .consultant-option:hover { background: #f0f9ff; border-color: #2563eb; }
            
            /* Ajuste para móvil: Colapsar columnas */
            @media (max-width: 768px) {
                div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; height: auto !important; }
                .card { height: 400px; margin-bottom: 20px; }
            }
        </style>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await loadDashboard();
}

async function loadDashboard() {
    await Promise.all([loadPendingTickets(), loadTeamLoad()]);
}

async function loadPendingTickets() {
    const list = document.getElementById('pendingList');
    
    // Traemos tickets SIN ASIGNAR (id_asignado IS NULL) y que NO estén cerrados
    const { data: tickets, error } = await supabase
        .from('pr_tickets')
        .select(`*, pr_organizaciones(nombre_comercial)`)
        .is('id_asignado', null) 
        .neq('estado', 'CERRADO')
        .order('prioridad', { ascending: false }) // Urgentes primero
        .order('fecha_creacion', { ascending: true }); // Más viejos primero

    list.innerHTML = '';
    
    if (error) { list.innerHTML = 'Error cargando tickets'; return; }
    
    document.getElementById('countPending').innerText = tickets.length;

    if (tickets.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:#94a3b8;">🎉 No hay tickets pendientes</div>`;
        return;
    }

    tickets.forEach(t => {
        const div = document.createElement('div');
        div.className = `pending-item priority-${t.prioridad}`;
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong style="color:#2563eb; font-size:0.8rem;">${t.codigo_visual}</strong>
                <span class="badge" style="font-size:0.7rem;">${t.prioridad}</span>
            </div>
            <div style="font-weight:600; margin:5px 0; font-size:0.95rem;">${t.titulo}</div>
            <div style="font-size:0.8rem; color:#64748b;">
                ${t.pr_organizaciones?.nombre_comercial} • ${Utils.formatDate(t.fecha_creacion)}
            </div>
            <button class="btn-primary btn-assign" style="margin-top:10px; width:100%; font-size:0.8rem; padding:5px;">
                Asignar Agente
            </button>
        `;

        // Botón Asignar
        div.querySelector('.btn-assign').onclick = (e) => {
            e.stopPropagation();
            openAssignModal(t);
        };
        
        // Clic en la tarjeta -> Ver detalle (Solo lectura o edición según permisos)
        div.onclick = () => Router.navigate('PAN_TICKET_DETALLE', t.id_ticket);

        list.appendChild(div);
    });
}

async function loadTeamLoad() {
    const list = document.getElementById('teamLoadList');
    
    // CAMBIO CRÍTICO: FILTRADO POR PERFIL ASIGNABLE
    // Usamos !inner para forzar que solo traiga usuarios que cumplan la condición del perfil
    const { data: users, error } = await supabase
        .from('pr_usuarios')
        .select(`
            id_usuario, 
            nombre_completo,
            pr_sis_perfiles!inner ( es_asignable )
        `)
        .eq('activo', true)
        .eq('pr_sis_perfiles.es_asignable', true) // <--- EL FILTRO DE SEGURIDAD
        .order('nombre_completo');

    if (error) {
        console.error("Error cargando equipo:", error);
        return;
    }

    // ... (El resto de la función sigue igual: contar tickets y pintar barras) ...
    // Solo asegúrate de copiar el resto del código original abajo de esto.
    
    // AQUI TE DEJO EL RESTO DE LA FUNCIÓN PARA QUE COPIES Y PEGUES TODO EL BLOQUE SI PREFIERES:
    
    const { data: tickets } = await supabase
        .from('pr_tickets')
        .select('id_asignado')
        .neq('estado', 'CERRADO')
        .not('id_asignado', 'is', null);

    const loadMap = {};
    if(tickets) {
        tickets.forEach(t => {
            loadMap[t.id_asignado] = (loadMap[t.id_asignado] || 0) + 1;
        });
    }

    list.innerHTML = '';
    
    if(users) {
        users.forEach(u => {
            const count = loadMap[u.id_usuario] || 0;
            let color = '#10b981'; 
            let percent = (count / 5) * 100;
            if (count >= 3) color = '#f59e0b';
            if (count >= 5) color = '#ef4444';
            if (percent > 100) percent = 100;

            const div = document.createElement('div');
            div.className = 'team-member';
            div.innerHTML = `
                <div>
                    <div style="font-weight:600; font-size:0.9rem;">${u.nombre_completo}</div>
                    <div class="load-bar-bg">
                        <div class="load-bar-fill" style="width:${percent}%; background:${color};"></div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <span style="font-weight:bold; color:${color}; font-size:1.1rem;">${count}</span>
                    <div style="font-size:0.7rem; color:#94a3b8;">Tickets</div>
                </div>
            `;
            list.appendChild(div);
        });
    }

    window.cachedUsers = users; 
    window.cachedLoad = loadMap;
}

function openAssignModal(ticket) {
    selectedTicketId = ticket.id_ticket;
    document.getElementById('assignTicketTitle').innerText = `${ticket.codigo_visual}: ${ticket.titulo}`;
    const modal = document.getElementById('modalAssign');
    const container = document.getElementById('consultantSelector');
    
    container.innerHTML = '';
    
    // Reusamos los datos cargados en loadTeamLoad
    if (window.cachedUsers) {
        window.cachedUsers.forEach(u => {
            const count = window.cachedLoad[u.id_usuario] || 0;
            let badgeColor = count < 3 ? '#dcfce7' : (count < 5 ? '#fef3c7' : '#fee2e2');
            let badgeText = count < 3 ? 'Libre' : (count < 5 ? 'Ocupado' : 'Saturado');

            const div = document.createElement('div');
            div.className = 'consultant-option';
            div.innerHTML = `
                <div>
                    <strong>${u.nombre_completo}</strong>
                    <div style="font-size:0.75rem; color:#64748b;">Carga actual: ${count}</div>
                </div>
                <span class="badge" style="background:${badgeColor}; color:#333;">${badgeText}</span>
            `;
            
            div.onclick = async () => {
                if(confirm(`¿Asignar a ${u.nombre_completo}?`)) {
                    await assignTicket(u.id_usuario);
                }
            };
            container.appendChild(div);
        });
    }

    modal.style.display = 'flex';
}

async function assignTicket(userId) {
    const modal = document.getElementById('modalAssign');
    modal.style.display = 'none'; // Cerrar visualmente rápido

    // Actualizar Base de Datos
    const { error } = await supabase
        .from('pr_tickets')
        .update({ 
            id_asignado: userId,
            estado: 'EN_PROCESO' // Cambiamos estado automáticamente
        })
        .eq('id_ticket', selectedTicketId);

    if (error) {
        alert("Error al asignar: " + error.message);
    } else {
        // Refrescar pantalla
        await loadDashboard();
    }
}

function setupEvents() {
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => 
        b.onclick = () => document.getElementById('modalAssign').style.display = 'none'
    );
}