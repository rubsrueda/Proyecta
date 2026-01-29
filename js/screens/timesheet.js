import { supabase } from '../config.js';
import { State } from '../core/state.js';
// [CAMBIO] Importamos el servicio financiero
import { FinanceService } from '../services/financeService.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

let currentWeekStart = new Date();
// [CAMBIO] Variable para guardar la tarifa detectada temporalmente
let currentRateSnapshot = null; 

export async function render(container) {
    // ... (Tu lógica de fechas se queda igual) ...
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1); 
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0,0,0,0);

    const user = State.user;

    container.innerHTML = `
        <div class="screen-header">
            <h2>Hoja de Tiempos</h2>
            <!-- ... (Botones semana iguales) ... -->
             <div style="display:flex; gap:10px; align-items:center;">
                <button id="btnPrevWeek" class="btn-secondary" style="padding:5px 10px;">◀</button>
                <span id="labelWeek" style="font-size:0.8rem; font-weight:bold;">Semana actual</span>
                <button id="btnNextWeek" class="btn-secondary" style="padding:5px 10px;">▶</button>
            </div>
        </div>

        <div class="card" style="background:#f8fafc; margin-bottom:15px; text-align:center; padding:15px;">
            <div style="font-size:0.8rem; color:#64748b;">Total Horas Semana</div>
            <div style="font-size:2rem; font-weight:bold; color:#2563eb;" id="totalWeeklyHours">0.0</div>
        </div>

        <div class="table-container">
            <table class="data-table" id="timesheetTable">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Ticket / Actividad</th>
                        <th>Descripción</th>
                        <th style="text-align:center;">Horas</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="timesheetBody">
                    <tr><td colspan="5" style="text-align:center">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <button id="btnAddEntry" class="btn-primary" style="width:100%; margin-top:15px;">+ Agregar Horas</button>

        <!-- MODAL -->
        <div id="modalTime" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Registrar Horas</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formTime">
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="timeDate" required class="form-control">
                    </div>
                    
                    <div class="form-group">
                        <label>Ticket / Proyecto</label>
                        <select id="timeProject" class="form-control" required></select>
                    </div>

                    <!-- [CAMBIO] PREVISUALIZACIÓN FINANCIERA -->
                    <div id="financialPreview" style="background:#ecfdf5; color:#047857; padding:10px; border-radius:6px; font-size:0.85rem; margin-bottom:10px; display:none;">
                        💰 Tarifa: <strong id="lblRate">-</strong> | Total: <strong id="lblTotal">-</strong>
                    </div>

                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea id="timeDesc" class="form-control" rows="2"></textarea>
                    </div>
                    <div class="form-inline-group">
                        <label>Horas</label>
                        <input type="number" id="timeHours" step="0.5" min="0.5" max="24" required class="form-control">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    updateWeekLabel();
    setupEvents(user.id);
    await loadTimesheet(user.id);
}

// ... (updateWeekLabel y loadTimesheet IDÉNTICOS a tu código) ...
// Solo copio loadTimesheet resumido para ahorrar espacio, tú déjalo igual
function updateWeekLabel() { /* ... tu código ... */ }
async function loadTimesheet(userId) { /* ... tu código ... */ }

// [CAMBIO] Función para llenar el select, pero ahora guardamos metadata (contratoId)
async function loadProjectsCombo(userId) {
    const select = document.getElementById('timeProject');
    select.innerHTML = '<option>Cargando...</option>';
    
    // Traemos tickets Y sus proyectos Y sus contratos
    const { data: tickets } = await supabase
        .from('pr_tickets')
        .select(`
            id_ticket, codigo_visual, titulo,
            pr_proyectos ( id_contrato )
        `)
        .eq('id_asignado', userId)
        //.neq('estado', 'CERRADO');

    select.innerHTML = '';
    if (tickets && tickets.length > 0) {
        // Opción vacía por defecto
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.text = "Seleccione Actividad...";
        select.appendChild(defaultOpt);

        tickets.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id_ticket;
            opt.innerText = `${t.codigo_visual} - ${t.titulo}`;
            
            // Guardamos el ID del contrato en un atributo HTML para leerlo luego
            if (t.pr_proyectos && t.pr_proyectos.id_contrato) {
                opt.dataset.contractId = t.pr_proyectos.id_contrato;
            }
            select.appendChild(opt);
        });
    } else {
        select.innerHTML = '<option value="">No tienes tickets asignados</option>';
    }
}

function setupEvents(userId) {
    const modal = document.getElementById('modalTime');
    const form = document.getElementById('formTime');

    // 1. Navegación Semanal
    document.getElementById('btnPrevWeek').onclick = () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        updateWeekLabel();
        loadTimesheet(userId);
    };
    document.getElementById('btnNextWeek').onclick = () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        updateWeekLabel();
        loadTimesheet(userId);
    };

    // 2. Botón Agregar (Abre Modal para entrada Manual)
    const btnAdd = document.getElementById('btnAddEntry');
    if(btnAdd) {
        btnAdd.onclick = async () => {
            const today = new Date();
            const endWeek = new Date(currentWeekStart); 
            endWeek.setDate(endWeek.getDate() + 6);
            
            // Pre-seleccionar fecha lógica
            if (today >= currentWeekStart && today <= endWeek) {
                document.getElementById('timeDate').valueAsDate = today;
            } else {
                document.getElementById('timeDate').valueAsDate = currentWeekStart;
            }

            await loadProjectsCombo(userId);
            modal.style.display = 'flex';
        };
    }

    // Cerrar Modal
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => 
        b.onclick = () => modal.style.display = 'none'
    );

    // 3. GUARDAR (Cálculo Financiero + Insert)
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        // Datos del Formulario
        const dateVal = document.getElementById('timeDate').value;
        const hours = parseFloat(document.getElementById('timeHours').value);
        const mins = Math.round(hours * 60);
        
        // Calcular timestamps
        const fechaInicio = new Date(`${dateVal}T09:00:00`);
        const fechaFin = new Date(fechaInicio.getTime() + (mins * 60000));

        // Obtener ID Contrato desde el Select (dataset)
        const select = document.getElementById('timeProject');
        const selectedOption = select.options[select.selectedIndex];
        const contractId = selectedOption ? selectedOption.dataset.contractId : null;

        // Calcular Venta y Costo (Usando el Servicio)
        let ventaHora = 0;
        let costoHora = 0;

        if (contractId) {
            // Import dinámico para asegurar que FinanceService esté disponible
            const { FinanceService } = await import('../services/financeService.js');
            
            // Pasamos el ID del contrato y el objeto Usuario completo (para leer su costo interno)
            const finanzas = await FinanceService.calcularDesempeno(contractId, State.user);
            
            if (finanzas) {
                ventaHora = finanzas.precio_venta_hora; // (Monto Contrato / Horas Contrato)
                costoHora = finanzas.costo_real_hora;   // (Costo específico del usuario)
            }
        }

        // Construir objeto
        const newLog = {
            id_usuario: userId,
            id_ticket: select.value,
            resumen: document.getElementById('timeDesc').value,
            tipo_actividad: 'MANUAL',
            fecha_inicio: fechaInicio.toISOString(),
            fecha_fin: fechaFin.toISOString(),
            duracion_minutos: mins,
            es_facturable: true,
            estado: 'COMPLETADO',
            
            // Guardar Snapshot Financiero
            valor_venta_hora: ventaHora,
            costo_real_hora: costoHora
        };

        const { error } = await supabase.from('pr_actividades').insert(newLog);

        if(error) alert("Error guardando tiempo: " + error.message);
        else {
            modal.style.display = 'none';
            loadTimesheet(userId);
        }
    };
}