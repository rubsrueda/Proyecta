import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

console.log('[CONTRACT LIST v1.0002] Módulo cargado');

let currentContract = null; // Para edición

export async function render(container) {
    console.log('[CONTRACT LIST] Renderizando pantalla de contratos');
    container.innerHTML = `
        <div class="screen-header">
            <h2>Gestión de Contratos</h2>
            <button id="btnNewContract" class="btn-primary">+ Nuevo Contrato</button>
        </div>

        <div class="table-container">
            <table class="data-table" id="contractsTable">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Cliente</th>
                        <th>Nombre</th>
                        <th>Vigencia</th>
                        <th style="text-align:right">Horas Vendidas</th>
                        <th style="text-align:right">Monto Total</th>
                        <th>Estado</th>
                        <th>Facturado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody><tr><td colspan="9">Cargando...</td></tr></tbody>
            </table>
        </div>

        <!-- MODAL CONTRATO -->
        <div id="modalContract" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Nuevo Contrato</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formContract">
                    <input type="hidden" id="contractId">
                    
                    <div class="form-group">
                        <label>Cliente</label>
                        <select id="contractOrg" class="form-control" required></select>
                    </div>

                    <div class="form-inline-group">
                        <label>Código Único</label>
                        <input type="text" id="contractCode" placeholder="Ej: CTR-2026-A" required>
                    </div>

                    <div class="form-group">
                        <label>Nombre Descriptivo</label>
                        <input type="text" id="contractName" class="form-control" required>
                    </div>

                    <!-- SECCIÓN DINERO -->
                    <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:15px;">
                        <div class="form-inline-group">
                            <label>Monto Total del Contrato</label>
                            <div style="display:flex; gap:5px;">
                                <input type="number" id="contractAmount" step="0.01" required>
                                <select id="contractCurrency" style="width:80px;"><option>USD</option><option>EUR</option><option>MXN</option></select>
                            </div>
                        </div>

                        <div class="form-inline-group">
                            <label>Horas Totales Vendidas</label>
                            <input type="number" id="contractHours" step="1" required>
                        </div>
                        
                        <div style="text-align:right; font-size:0.85rem; color:#64748b; margin-top:5px;">
                            Precio Promedio: <strong id="lblAvgPrice">-</strong> / hr
                        </div>
                    </div>

                    <div class="form-inline-group">
                         <label>Fecha Inicio</label>
                         <input type="date" id="contractStart" required>
                    </div>
                    <div class="form-inline-group">
                         <label>Fecha Fin</label>
                         <input type="date" id="contractEnd" required>
                    </div>
                    
                    <!-- SECCIÓN FACTURACIÓN -->
                    <div style="background:#fef3c7; padding:10px; border-radius:8px; margin-bottom:15px;">
                        <div class="form-group">
                            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                                <input type="checkbox" id="contractBilled">
                                <span>✅ Marcar como Facturado/Cobrado</span>
                            </label>
                            <small style="color:#92400e; font-size:0.75rem;">
                                ⚠️ Una vez facturado, el contrato no podrá editarse
                            </small>
                        </div>
                        
                        <div id="billingDateContainer" style="display:none; margin-top:10px;">
                            <label>Fecha de Facturación</label>
                            <input type="date" id="contractBillingDate" class="form-control">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Observaciones</label>
                        <textarea id="contractNotes" class="form-control" rows="2" placeholder="Notas adicionales..."></textarea>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary" id="btnSaveContract">Guardar Contrato</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    await loadContracts();
    setupEvents();
}

async function loadContracts() {
    console.log('[CONTRACT LIST] Cargando contratos...');
    
    const { data: contracts, error } = await supabase
        .from('pr_com_contratos')
        .select(`*, pr_organizaciones ( nombre_comercial )`)
        .order('fecha_fin', { ascending: false });

    const tbody = document.querySelector('#contractsTable tbody');
    tbody.innerHTML = '';

    if (error) { 
        console.error('[CONTRACT LIST] Error cargando contratos:', error);
        tbody.innerHTML = `<tr><td colspan="9">Error: ${error.message}</td></tr>`; 
        return; 
    }

    console.log('[CONTRACT LIST] Contratos cargados:', contracts.length);

    contracts.forEach(c => {
        const tr = document.createElement('tr');
        const isBilled = c.facturado || false;
        const canEdit = !isBilled;
        
        // Estilos según estado
        if (isBilled) {
            tr.style.backgroundColor = '#f9fafb';
            tr.style.opacity = '0.8';
        }
        
        tr.innerHTML = `
            <td><span class="ticket-code">${c.codigo_contrato}</span></td>
            <td><strong>${c.pr_organizaciones?.nombre_comercial}</strong></td>
            <td>${c.nombre_contrato}</td>
            <td>${Utils.formatDate(c.fecha_inicio)} - ${Utils.formatDate(c.fecha_fin)}</td>
            <td style="text-align:right">${c.horas_totales || 0} h</td>
            <td style="text-align:right">${Utils.formatCurrency(c.monto_total, c.moneda)}</td>
            <td><span class="badge ${c.estado}">${c.estado}</span></td>
            <td style="text-align:center">
                ${isBilled ? 
                    `<span style="color:#16a34a; font-weight:600;">✅ Facturado</span>` : 
                    `<span style="color:#94a3b8;">⏳ Pendiente</span>`
                }
            </td>
            <td style="text-align:center;">
                <button class="btn-edit-contract" data-id="${c.id_contrato}" 
                        style="padding:4px 12px; font-size:0.8rem; ${canEdit ? '' : 'opacity:0.5; cursor:not-allowed;'}" 
                        ${canEdit ? '' : 'disabled'}>
                    ${canEdit ? '✏️ Editar' : '🔒 Bloqueado'}
                </button>
                <button class="btn-view-rates" data-id="${c.id_contrato}" data-name="${c.nombre_contrato}" data-currency="${c.moneda}"
                        style="padding:4px 12px; font-size:0.8rem; background:#059669; margin-left:5px;">
                    💰 Tarifas
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Agregar eventos a los botones
    document.querySelectorAll('.btn-edit-contract').forEach(btn => {
        if (!btn.disabled) {
            btn.onclick = (e) => {
                e.stopPropagation();
                editContract(btn.dataset.id);
            };
        }
    });
    
    document.querySelectorAll('.btn-view-rates').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            Router.navigate('PAN_TARIFAS', { 
                contractId: btn.dataset.id, 
                contractName: btn.dataset.name, 
                currency: btn.dataset.currency 
            });
        };
    });
}

async function editContract(contractId) {
    console.log('[CONTRACT LIST] Editando contrato ID:', contractId);
    
    // Obtener datos del contrato
    const { data: contract, error } = await supabase
        .from('pr_com_contratos')
        .select('*')
        .eq('id_contrato', contractId)
        .single();
    
    if (error || !contract) {
        console.error('[CONTRACT LIST] Error cargando contrato:', error);
        alert('Error al cargar el contrato');
        return;
    }
    
    console.log('[CONTRACT LIST] Datos del contrato:', contract);
    
    // Verificar si puede editarse
    if (contract.facturado) {
        console.warn('[CONTRACT LIST] ⚠️ Intento de editar contrato facturado');
        alert('⚠️ Este contrato ya está facturado y no puede editarse.');
        return;
    }
    
    currentContract = contract;
    
    // Cargar clientes y abrir modal
    await cargarClientes();
    
    // Llenar formulario
    document.getElementById('modalTitle').innerText = 'Editar Contrato';
    document.getElementById('btnSaveContract').innerText = 'Actualizar Contrato';
    document.getElementById('contractId').value = contract.id_contrato;
    document.getElementById('contractOrg').value = contract.id_organizacion;
    document.getElementById('contractCode').value = contract.codigo_contrato;
    document.getElementById('contractName').value = contract.nombre_contrato;
    document.getElementById('contractAmount').value = contract.monto_total;
    document.getElementById('contractHours').value = contract.horas_totales;
    document.getElementById('contractCurrency').value = contract.moneda;
    document.getElementById('contractStart').value = contract.fecha_inicio;
    document.getElementById('contractEnd').value = contract.fecha_fin;
    document.getElementById('contractBilled').checked = contract.facturado || false;
    document.getElementById('contractBillingDate').value = contract.fecha_facturacion || '';
    document.getElementById('contractNotes').value = contract.observaciones || '';
    
    // Mostrar/ocultar fecha de facturación
    const billingDateContainer = document.getElementById('billingDateContainer');
    billingDateContainer.style.display = contract.facturado ? 'block' : 'none';
    
    // Calcular precio promedio
    if (contract.horas_totales > 0) {
        const avg = contract.monto_total / contract.horas_totales;
        document.getElementById('lblAvgPrice').innerText = Utils.formatCurrency(avg, contract.moneda);
    }
    
    console.log('[CONTRACT LIST] Modal de edición listo');
    document.getElementById('modalContract').style.display = 'flex';
}

function setupEvents() {
    console.log('[CONTRACT LIST] Configurando eventos');
    
    const modal = document.getElementById('modalContract');
    const form = document.getElementById('formContract');
    const checkboxBilled = document.getElementById('contractBilled');
    const billingDateContainer = document.getElementById('billingDateContainer');
    
    // Mostrar/ocultar fecha de facturación
    checkboxBilled.onchange = () => {
        billingDateContainer.style.display = checkboxBilled.checked ? 'block' : 'none';
        if (checkboxBilled.checked && !document.getElementById('contractBillingDate').value) {
            document.getElementById('contractBillingDate').value = new Date().toISOString().split('T')[0];
        }
    };
    
    document.getElementById('btnNewContract').onclick = async () => {
        console.log('[CONTRACT LIST] Abriendo modal para nuevo contrato');
        currentContract = null;
        await cargarClientes();
        form.reset();
        document.getElementById('modalTitle').innerText = 'Nuevo Contrato';
        document.getElementById('btnSaveContract').innerText = 'Guardar Contrato';
        document.getElementById('lblAvgPrice').innerText = '-';
        document.getElementById('contractId').value = '';
        billingDateContainer.style.display = 'none';
        modal.style.display = 'flex';
    };

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => b.onclick = () => {
        console.log('[CONTRACT LIST] Cerrando modal');
        modal.style.display = 'none';
    });

    // Calculadora al vuelo
    const calc = () => {
        const monto = parseFloat(document.getElementById('contractAmount').value) || 0;
        const horas = parseFloat(document.getElementById('contractHours').value) || 0;
        if(horas > 0) {
            const avg = monto / horas;
            document.getElementById('lblAvgPrice').innerText = Utils.formatCurrency(avg, document.getElementById('contractCurrency').value);
        } else {
            document.getElementById('lblAvgPrice').innerText = '-';
        }
    };
    document.getElementById('contractAmount').addEventListener('input', calc);
    document.getElementById('contractHours').addEventListener('input', calc);

    form.onsubmit = async (e) => {
        e.preventDefault();
        console.log('[CONTRACT LIST] ========== SUBMIT CONTRATO ==========');
        
        const contractId = document.getElementById('contractId').value;
        const isEdit = !!contractId;
        
        console.log('[CONTRACT LIST] Modo:', isEdit ? 'EDICIÓN' : 'CREACIÓN');
        console.log('[CONTRACT LIST] ID Contrato:', contractId || 'NUEVO');
        
        const data = {
            id_organizacion: document.getElementById('contractOrg').value,
            codigo_contrato: document.getElementById('contractCode').value,
            nombre_contrato: document.getElementById('contractName').value,
            monto_total: document.getElementById('contractAmount').value,
            horas_totales: document.getElementById('contractHours').value,
            moneda: document.getElementById('contractCurrency').value,
            fecha_inicio: document.getElementById('contractStart').value,
            fecha_fin: document.getElementById('contractEnd').value,
            estado: 'ACTIVO',
            facturado: document.getElementById('contractBilled').checked,
            fecha_facturacion: document.getElementById('contractBilled').checked ? 
                document.getElementById('contractBillingDate').value : null,
            observaciones: document.getElementById('contractNotes').value
        };
        
        console.log('[CONTRACT LIST] Datos:', data);

        let error;
        if (isEdit) {
            console.log('[CONTRACT LIST] Actualizando contrato...');
            const result = await supabase
                .from('pr_com_contratos')
                .update(data)
                .eq('id_contrato', contractId);
            error = result.error;
        } else {
            console.log('[CONTRACT LIST] Insertando nuevo contrato...');
            const result = await supabase
                .from('pr_com_contratos')
                .insert(data);
            error = result.error;
        }
        
        if (error) {
            console.error('[CONTRACT LIST] ❌ Error:', error);
            if (error.code === '23505') {
                alert("Error: El Código de Contrato ya existe. Usa uno único.");
            } else {
                alert("Error: " + error.message);
            }
        } else {
            console.log('[CONTRACT LIST] ✅ Contrato guardado exitosamente');
            
            if (data.facturado) {
                alert('⚠️ Contrato guardado y marcado como FACTURADO.\nYa no podrá editarse.');
            } else {
                alert('✅ Contrato guardado correctamente');
            }
            
            modal.style.display = 'none';
            loadContracts();
        }
        
        console.log('[CONTRACT LIST] ========== FIN SUBMIT ==========');
    };
}

async function cargarClientes() {
    const select = document.getElementById('contractOrg');
    if(select.options.length > 0) return;
    const { data } = await supabase.from('pr_organizaciones').select('id_organizacion, nombre_comercial').eq('es_interna', false);
    if(data) data.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id_organizacion;
        opt.innerText = o.nombre_comercial;
        select.appendChild(opt);
    });
}