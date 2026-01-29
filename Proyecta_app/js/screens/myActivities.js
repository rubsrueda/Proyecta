//MYACTIVITIES.JS
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { State } from '../core/state.js'; // <--- USAMOS EL ESTADO GLOBAL
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    // 1. OBTENER USUARIO DESDE EL STATE (Más rápido y seguro)
    const user = State.user;

    if (!user) {
        container.innerHTML = '<div class="error-card">Error: Sesión no encontrada. Recarga la página.</div>';
        return;
    }

    container.innerHTML = `
        <div class="screen-header">
            <h2>Mis Actividades</h2>
            <div style="font-size:0.85rem; color:#64748b;">
                Todo lo que tienes pendiente en tu plato.
            </div>
        </div>

        <!-- KPI RÁPIDOS -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
            <div class="card" style="text-align:center; padding:10px; border-bottom:3px solid #ef4444;">
                <div style="font-size:1.5rem; font-weight:bold; color:#ef4444;" id="kpiUrgent">0</div>
                <div style="font-size:0.75rem;">Urgentes</div>
            </div>
            <div class="card" style="text-align:center; padding:10px; border-bottom:3px solid #2563eb;">
                <div style="font-size:1.5rem; font-weight:bold; color:#2563eb;" id="kpiTasks">0</div>
                <div style="font-size:0.75rem;">Tareas Proyecto</div>
            </div>
            <div class="card" style="text-align:center; padding:10px; border-bottom:3px solid #10b981;">
                <div style="font-size:1.5rem; font-weight:bold; color:#10b981;" id="kpiTickets">0</div>
                <div style="font-size:0.75rem;">Soporte</div>
            </div>
        </div>

        <!-- FILTROS -->
        <div class="filters-bar" style="display:flex; gap:5px; margin-bottom:15px; overflow-x:auto;">
            <button class="btn-secondary active filter-btn" data-filter="ALL">Todo</button>
            <button class="btn-secondary filter-btn" data-filter="TICKET">Soporte</button>
            <button class="btn-secondary filter-btn" data-filter="TASK">Proyectos</button>
        </div>

        <!-- LISTA UNIFICADA -->
        <div id="activitiesList" style="display:flex; flex-direction:column; gap:10px;">
            <div class="spinner"></div>
        </div>
    `;

    I18n.traducirPagina(container);
    
    // Pasamos el ID del usuario del State
    await loadMyActivities(user.id);
}

async function loadMyActivities(userId) {
    // 1. TRAER TODO LO ASIGNADO A MI QUE NO ESTÉ CERRADO
    const { data: items, error } = await supabase
        .from('pr_tickets')
        .select(`
            *,
            pr_proyectos ( nombre, codigo_proyecto ),
            pr_organizaciones ( nombre_comercial )
        `)
        .eq('id_asignado', userId)
        .neq('estado', 'CERRADO')
        .order('prioridad', { ascending: false })
        .order('fecha_limite', { ascending: true });

    const listContainer = document.getElementById('activitiesList');
    listContainer.innerHTML = '';

    if (error) {
        listContainer.innerHTML = `<div class="error-card">${error.message}</div>`;
        return;
    }

    if (!items || items.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:40px; color:#94a3b8;">
                <span class="material-symbols-outlined" style="font-size:48px;">check_circle</span>
                <p>¡No tienes actividades pendientes!</p>
            </div>`;
        updateKPIs(0, 0, 0);
        return;
    }

    // 2. CLASIFICACIÓN Y RENDERIZADO
    let countUrgent = 0;
    let countTasks = 0;
    let countTickets = 0;

    items.forEach(item => {
        const isProjectTask = !!item.id_proyecto;
        const type = isProjectTask ? 'TASK' : 'TICKET';

        if (item.prioridad === 'ALTA') countUrgent++;
        if (isProjectTask) countTasks++; else countTickets++;

        const icon = isProjectTask ? 'assignment' : 'confirmation_number';
        const typeLabel = isProjectTask ? 'Tarea' : 'Ticket';
        // Protección contra nulos en caso de que proyecto u org vengan vacíos
        const projectName = item.pr_proyectos?.nombre || 'General';
        const orgName = item.pr_organizaciones?.nombre_comercial || 'Sin Cliente';

        const context = isProjectTask 
            ? `<span style="color:#2563eb;">${projectName}</span>` 
            : `<span style="color:#10b981;">Soporte</span>`;

        const card = document.createElement('div');
        card.className = `card activity-item ${type}`; 
        card.style.cursor = 'pointer';
        card.style.borderLeft = item.prioridad === 'ALTA' ? '4px solid #ef4444' : '4px solid #cbd5e1';
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="display:flex; gap:10px;">
                    <div style="background:#f1f5f9; padding:8px; border-radius:8px; display:flex; align-items:center;">
                        <span class="material-symbols-outlined" style="color:#64748b;">${icon}</span>
                    </div>
                    <div>
                        <div style="font-size:0.75rem; color:#64748b; margin-bottom:2px;">
                            ${item.codigo_visual || 'ID-' + item.id_ticket} • ${typeLabel}
                        </div>
                        <h3 style="margin:0; font-size:1rem; color:#1e293b;">${item.titulo}</h3>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:4px;">
                            ${orgName} • ${context}
                        </div>
                    </div>
                </div>
                <div style="text-align:right;">
                    <span class="badge ${item.estado}">${item.estado}</span>
                    <div style="font-size:0.75rem; color:#ef4444; margin-top:5px; font-weight:bold;">
                        ${item.fecha_limite ? 'Vence: ' + Utils.formatDate(item.fecha_limite) : ''}
                    </div>
                </div>
            </div>
        `;

        card.onclick = () => Router.navigate('PAN_TICKET_DETALLE', item.id_ticket);
        
        listContainer.appendChild(card);
    });

    updateKPIs(countUrgent, countTasks, countTickets);
    setupFilters();
}

function updateKPIs(urgent, tasks, tickets) {
    const kpiU = document.getElementById('kpiUrgent');
    const kpiP = document.getElementById('kpiTasks');
    const kpiT = document.getElementById('kpiTickets');
    if(kpiU) kpiU.innerText = urgent;
    if(kpiP) kpiP.innerText = tasks;
    if(kpiT) kpiT.innerText = tickets;
}

function setupFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.activity-item');

    btns.forEach(btn => {
        btn.onclick = () => {
            btns.forEach(b => b.classList.remove('active', 'btn-primary'));
            btns.forEach(b => b.classList.add('btn-secondary'));
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary', 'active');

            const filter = btn.dataset.filter;

            items.forEach(item => {
                if (filter === 'ALL') {
                    item.style.display = 'block';
                } else {
                    if (item.classList.contains(filter)) item.style.display = 'block';
                    else item.style.display = 'none';
                }
            });
        };
    });
}