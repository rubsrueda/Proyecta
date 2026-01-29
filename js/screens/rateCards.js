import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

let currentContract = null;

export async function render(container, params) {
    if (!params || !params.contractId) {
        container.innerHTML = '<div class="error-card">Error: Contrato no seleccionado.</div>';
        return;
    }
    currentContract = params;

    container.innerHTML = `
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:5px;">
            <div style="font-size:0.85rem; color:#64748b;">
                <span style="cursor:pointer; text-decoration:underline;" id="btnBackContracts">Contratos</span> 
                > ${currentContract.contractName}
            </div>
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <h2 style="margin:0;">Tarifas de Venta</h2>
                <button id="btnNewRate" class="btn-primary">+ Nuevo Rol</button>
            </div>
        </div>

        <div class="card" style="margin-bottom:20px; background:#f8fafc; border:1px solid #e2e8f0;">
            <p style="margin:0; font-size:0.9rem; color:#475569;">
                Defina el precio de venta por hora para cada perfil en este contrato.
            </p>
        </div>

        <div class="table-container">
            <table class="data-table" id="ratesTable">
                <thead>
                    <tr>
                        <th>Rol / Perfil</th>
                        <th style="text-align:right">Precio Venta / Hora</th>
                        <th style="width:50px;">-</th>
                    </tr>
                </thead>
                <tbody><tr><td colspan="3" style="text-align:center">Cargando...</td></tr></tbody>
            </table>
        </div>

        <!-- MODAL SIMPLIFICADO -->
        <div id="modalRate" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nuevo Rol de Facturación</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formRate">
                    <div class="form-group">
                        <label>Nombre del Rol</label>
                        <input type="text" id="roleName" class="form-control" list="roleSuggestions" placeholder="Ej: Consultor Senior" required>
                        <datalist id="roleSuggestions">
                            <option value="Project Manager">
                            <option value="Consultor Senior">
                            <option value="Consultor Junior">
                            <option value="Desarrollador">
                        </datalist>
                    </div>

                    <div class="form-inline-group">
                        <label>Precio de Venta al Cliente</label>
                        <div style="display:flex; align-items:center; gap:5px;">
                            <input type="number" id="priceSale" step="0.01" placeholder="0.00" required class="form-control">
                            <span style="font-weight:bold;">${currentContract.currency || 'USD'}</span>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar Precio</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await loadRates();
}

async function loadRates() {
    const { data: rates, error } = await supabase
        .from('pr_com_tarifas')
        .select('*')
        .eq('id_contrato', currentContract.contractId)
        .order('precio_venta', { ascending: false });

    const tbody = document.querySelector('#ratesTable tbody');
    tbody.innerHTML = '';

    if (error || !rates.length) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#999;">Sin tarifas definidas.</td></tr>`;
        return;
    }

    rates.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.rol_seniority}</strong></td>
            <td style="text-align:right; font-size:1.1em; font-weight:bold; color:#059669;">
                ${Utils.formatCurrency(r.precio_venta, currentContract.currency)}
            </td>
            <td>
                <button class="btn-delete" style="color:red; background:none; border:none; cursor:pointer;">🗑️</button>
            </td>
        `;

        tr.querySelector('.btn-delete').onclick = async () => {
            if(confirm('¿Borrar esta tarifa?')) {
                await supabase.from('pr_com_tarifas').delete().eq('id_tarifa', r.id_tarifa);
                loadRates();
            }
        };
        tbody.appendChild(tr);
    });
}

function setupEvents() {
    document.getElementById('btnBackContracts').onclick = () => Router.navigate('PAN_CONTRATOS');
    
    const modal = document.getElementById('modalRate');
    const form = document.getElementById('formRate');

    document.getElementById('btnNewRate').onclick = () => {
        form.reset();
        modal.style.display = 'flex';
    };

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => 
        b.onclick = () => modal.style.display = 'none'
    );

    form.onsubmit = async (e) => {
        e.preventDefault();
        const newRate = {
            id_contrato: currentContract.contractId,
            rol_seniority: document.getElementById('roleName').value,
            costo_interno: 0, // YA NO SE USA AQUÍ. Se pone 0 o null.
            precio_venta: document.getElementById('priceSale').value,
            activo: true
        };

        const { error } = await supabase.from('pr_com_tarifas').insert(newRate);
        if (error) alert("Error: " + error.message);
        else {
            modal.style.display = 'none';
            loadRates();
        }
    };
}