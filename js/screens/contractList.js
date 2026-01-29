import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
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
                    </tr>
                </thead>
                <tbody><tr><td colspan="7">Cargando...</td></tr></tbody>
            </table>
        </div>

        <!-- MODAL CONTRATO -->
        <div id="modalContract" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nuevo Contrato</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formContract">
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

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar Contrato</button>
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
    const { data: contracts, error } = await supabase
        .from('pr_com_contratos')
        .select(`*, pr_organizaciones ( nombre_comercial )`)
        .order('fecha_fin', { ascending: false });

    const tbody = document.querySelector('#contractsTable tbody');
    tbody.innerHTML = '';

    if (error) { tbody.innerHTML = `<tr><td colspan="7">Error: ${error.message}</td></tr>`; return; }

    contracts.forEach(c => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
            <td><span class="ticket-code">${c.codigo_contrato}</span></td>
            <td><strong>${c.pr_organizaciones?.nombre_comercial}</strong></td>
            <td>${c.nombre_contrato}</td>
            <td>${Utils.formatDate(c.fecha_inicio)} - ${Utils.formatDate(c.fecha_fin)}</td>
            <td style="text-align:right">${c.horas_totales || 0} h</td>
            <td style="text-align:right">${Utils.formatCurrency(c.monto_total, c.moneda)}</td>
            <td><span class="badge ${c.estado}">${c.estado}</span></td>
        `;
        
        tr.onclick = () => Router.navigate('PAN_TARIFAS', { 
            contractId: c.id_contrato, 
            contractName: c.nombre_contrato, 
            currency: c.moneda 
        });
        
        tbody.appendChild(tr);
    });
}

function setupEvents() {
    const modal = document.getElementById('modalContract');
    const form = document.getElementById('formContract');
    
    document.getElementById('btnNewContract').onclick = async () => {
        await cargarClientes();
        form.reset();
        document.getElementById('lblAvgPrice').innerText = '-';
        modal.style.display = 'flex';
    };

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => b.onclick = () => modal.style.display = 'none');

    // Calculadora al vuelo
    const calc = () => {
        const monto = parseFloat(document.getElementById('contractAmount').value) || 0;
        const horas = parseFloat(document.getElementById('contractHours').value) || 0;
        if(horas > 0) {
            const avg = monto / hours;
            document.getElementById('lblAvgPrice').innerText = Utils.formatCurrency(avg, document.getElementById('contractCurrency').value);
        } else {
            document.getElementById('lblAvgPrice').innerText = '-';
        }
    };
    document.getElementById('contractAmount').addEventListener('input', calc);
    document.getElementById('contractHours').addEventListener('input', calc);

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const data = {
            id_organizacion: document.getElementById('contractOrg').value,
            codigo_contrato: document.getElementById('contractCode').value,
            nombre_contrato: document.getElementById('contractName').value,
            monto_total: document.getElementById('contractAmount').value,
            horas_totales: document.getElementById('contractHours').value,
            moneda: document.getElementById('contractCurrency').value,
            fecha_inicio: document.getElementById('contractStart').value,
            fecha_fin: document.getElementById('contractEnd').value,
            estado: 'ACTIVO'
        };

        const { error } = await supabase.from('pr_com_contratos').insert(data);
        
        if (error) {
            // Manejo específico de duplicados (Error 23505 en Postgres)
            if (error.code === '23505') alert("Error: El Código de Contrato ya existe. Usa uno único.");
            else alert("Error: " + error.message);
        } else {
            modal.style.display = 'none';
            loadContracts();
        }
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