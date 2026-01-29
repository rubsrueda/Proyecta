//js/screens/profitabilityReport.js

import { supabase } from '../config.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    // Fechas por defecto (Mes actual)
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    container.innerHTML = `
        <div class="screen-header">
            <h2>Rentabilidad Financiera</h2>
            <div style="font-size:0.85rem; color:#64748b;">Márgenes por Proyecto (Real vs Costo)</div>
        </div>

        <!-- FILTROS -->
        <div class="card" style="margin-bottom:20px; padding:15px;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:end;">
                <div class="form-group" style="margin:0;">
                    <label>Desde</label>
                    <input type="date" id="repStart" class="form-control" value="${firstDay}">
                </div>
                <div class="form-group" style="margin:0;">
                    <label>Hasta</label>
                    <input type="date" id="repEnd" class="form-control" value="${lastDay}">
                </div>
                <button id="btnRunReport" class="btn-primary" style="height:38px;">Ejecutar Reporte</button>
            </div>
        </div>

        <!-- KPI GLOBAL -->
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-bottom:20px;">
            <div class="card" style="text-align:center; padding:10px; border-top: 4px solid #64748b;">
                <div style="font-size:0.8rem; color:#64748b;">Costo Nómina</div>
                <div style="font-weight:bold; font-size:1.1rem;" id="kpiCost">$0.00</div>
            </div>
            <div class="card" style="text-align:center; padding:10px; border-top: 4px solid #2563eb;">
                <div style="font-size:0.8rem; color:#64748b;">Facturación</div>
                <div style="font-weight:bold; font-size:1.1rem; color:#2563eb;" id="kpiRevenue">$0.00</div>
            </div>
            <div class="card" style="text-align:center; padding:10px; border-top: 4px solid #10b981;">
                <div style="font-size:0.8rem; color:#64748b;">Margen</div>
                <div style="font-weight:bold; font-size:1.1rem; color:#10b981;" id="kpiMargin">0%</div>
            </div>
        </div>

        <div class="table-container">
            <table class="data-table" id="reportTable">
                <thead>
                    <tr>
                        <th>Proyecto</th>
                        <th style="text-align:center">Horas</th>
                        <th style="text-align:right">Costo</th>
                        <th style="text-align:right">Venta (Devengado)</th>
                        <th style="text-align:right">Margen</th>
                    </tr>
                </thead>
                <tbody id="reportBody">
                    <tr><td colspan="5" style="text-align:center">Define fechas y ejecuta.</td></tr>
                </tbody>
            </table>
        </div>
    `;

    I18n.traducirPagina(container);
    
    document.getElementById('btnRunReport').onclick = () => runReport();
}

async function runReport() {
    const start = document.getElementById('repStart').value;
    const end = document.getElementById('repEnd').value;
    const tbody = document.getElementById('reportBody');
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Calculando... (Esto puede tardar)</td></tr>';

    // 1. TRAER ACTIVIDADES (TIEMPOS) EN EL RANGO
    const { data: logs, error } = await supabase
        .from('pr_actividades')
        .select(`
            duracion_minutos,
            id_usuario,
            pr_tickets!inner (
                id_proyecto,
                pr_proyectos ( nombre, id_contrato )
            ),
            pr_usuarios ( nombre_completo, rol_facturacion )
        `)
        .gte('fecha_inicio', start)
        .lte('fecha_inicio', end + 'T23:59:59')
        .eq('es_facturable', true); // Solo lo facturable

    if (error) { tbody.innerHTML = `<tr><td colspan="5" style="color:red">${error.message}</td></tr>`; return; }

    if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No hay actividad registrada en este periodo.</td></tr>`;
        resetKPIs();
        return;
    }

    // 2. TRAER TARIFAS (RATE CARDS) DE LOS CONTRATOS INVOLUCRADOS
    // Extraemos IDs de contratos únicos
    const contractIds = [...new Set(logs.map(l => l.pr_tickets?.pr_proyectos?.id_contrato).filter(id => id))];
    
    let rateCards = [];
    if (contractIds.length > 0) {
        const { data: rates } = await supabase
            .from('pr_com_tarifas')
            .select('*')
            .in('id_contrato', contractIds);
        rateCards = rates || [];
    }

    // 3. CÁLCULO EN MEMORIA (Agrupar por Proyecto)
    const report = {}; // { 'Proyecto A': { hours: 0, cost: 0, rev: 0 } }

    logs.forEach(log => {
        const project = log.pr_tickets?.pr_proyectos;
        const projectName = project?.nombre || 'Sin Proyecto';
        const contractId = project?.id_contrato;
        const role = log.pr_usuarios?.rol_facturacion; // Ej: 'Senior'
        const hours = log.duracion_minutos / 60;

        // Buscar tarifa para este Contrato + Rol
        // Si no hay tarifa exacta, asumimos costo 0 y venta 0 (Alerta financiera)
        const rate = rateCards.find(r => 
            r.id_contrato === contractId && 
            r.rol_seniority === role
        );

        const costRate = rate ? rate.costo_interno : 0;
        const saleRate = rate ? rate.precio_venta : 0;

        // Acumular
        if (!report[projectName]) report[projectName] = { hours: 0, cost: 0, rev: 0 };
        
        report[projectName].hours += hours;
        report[projectName].cost += (hours * costRate);
        report[projectName].rev += (hours * saleRate);
    });

    // 4. RENDERIZAR
    tbody.innerHTML = '';
    let totalCost = 0, totalRev = 0;

    Object.keys(report).forEach(projName => {
        const row = report[projName];
        const margin = row.rev - row.cost;
        const marginPercent = row.rev > 0 ? (margin / row.rev) * 100 : 0;
        
        totalCost += row.cost;
        totalRev += row.rev;

        // Colores semáforo
        let color = '#10b981'; // Verde
        if (marginPercent < 30) color = '#f59e0b';
        if (marginPercent < 0) color = '#ef4444';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Proyecto"><strong>${projName}</strong></td>
            <td data-label="Horas" style="text-align:center;">${row.hours.toFixed(1)}</td>
            <td data-label="Costo" style="text-align:right; color:#64748b;">${Utils.formatCurrency(row.cost)}</td>
            <td data-label="Venta" style="text-align:right;">${Utils.formatCurrency(row.rev)}</td>
            <td data-label="Margen" style="text-align:right; font-weight:bold; color:${color};">
                ${Utils.formatCurrency(margin)} (${marginPercent.toFixed(0)}%)
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Actualizar KPIs
    document.getElementById('kpiCost').innerText = Utils.formatCurrency(totalCost);
    document.getElementById('kpiRevenue').innerText = Utils.formatCurrency(totalRev);
    const totalMargin = totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0;
    const kpiM = document.getElementById('kpiMargin');
    kpiM.innerText = totalMargin.toFixed(1) + '%';
    kpiM.style.color = totalMargin < 0 ? '#ef4444' : '#10b981';
}

function resetKPIs() {
    document.getElementById('kpiCost').innerText = '$0.00';
    document.getElementById('kpiRevenue').innerText = '$0.00';
    document.getElementById('kpiMargin').innerText = '0%';
}