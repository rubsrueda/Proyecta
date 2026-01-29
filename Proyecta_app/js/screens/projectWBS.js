//js/screens/projectWBS.js

import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { Utils } from '../core/utils.js';
import * as I18n from '../services/i18nService.js';

let currentProjectId = null;

export async function render(container, params) {
    // Validar que recibimos un ID
    if (!params || !params.projectId) {
        container.innerHTML = '<div class="error-card">Error: No se especificó el proyecto.</div>';
        return;
    }

    currentProjectId = params.projectId;
    container.innerHTML = '<div class="spinner"></div>';

    // 1. Cargar Datos del Proyecto
    const { data: project, error } = await supabase
        .from('pr_proyectos')
        .select(`*, pr_organizaciones(nombre_comercial)`)
        .eq('id_proyecto', currentProjectId)
        .single();

    if (error) {
        container.innerHTML = `<div class="error-card">${error.message}</div>`;
        return;
    }

    // 2. Renderizar Cabecera y Cuerpo
    container.innerHTML = `
        <!-- CABECERA DE PROYECTO (Breadcrumb) -->
        <div class="screen-header" style="flex-direction:column; align-items:flex-start; gap:5px;">
            <div style="font-size:0.85rem; color:#64748b;">
                <span style="cursor:pointer; text-decoration:underline;" id="btnBackList">Portafolio</span> 
                > ${project.codigo_proyecto}
            </div>
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <h2 style="margin:0;">${project.nombre}</h2>
                <div style="display:flex; gap:10px;">
                    <button id="btnGantt" class="btn-secondary">Ver Gantt</button>
                    <button id="btnNewTask" class="btn-primary">+ Nueva Tarea</button>
                </div>
            </div>
        </div>

        <!-- KPI RESUMEN -->
        <div class="card" style="margin-bottom:20px; background:#f8fafc; border:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-around; text-align:center;">
                <div>
                    <div style="font-size:0.8rem; color:#64748b;">Cliente</div>
                    <div style="font-weight:bold;">${project.pr_organizaciones?.nombre_comercial}</div>
                </div>
                <div>
                    <div style="font-size:0.8rem; color:#64748b;">Metodología</div>
                    <div style="font-weight:bold;">${project.metodologia || 'Estándar'}</div>
                </div>
                <div>
                    <div style="font-size:0.8rem; color:#64748b;">Fecha Fin</div>
                    <div style="font-weight:bold;">${Utils.formatDate(project.fecha_fin)}</div>
                </div>
            </div>
        </div>

        <!-- LISTA DE TAREAS (WBS) -->
        <div class="card">
            <h3 style="margin-top:0;">Plan de Trabajo (WBS)</h3>
            <div class="table-container">
                <table class="data-table" id="wbsTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tarea / Entregable</th>
                            <th>Responsable</th>
                            <th>Estado</th>
                            <th>Horas Est.</th>
                            <th>Fin</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="6" style="text-align:center">Cargando tareas...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- MODAL NUEVA TAREA -->
        <div id="modalTask" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Nueva Tarea de Proyecto</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formTask">
                    <div class="form-group">
                        <label>Nombre de la Tarea</label>
                        <input type="text" id="taskTitle" class="form-control" required>
                    </div>
                    
                    <div class="form-inline-group">
                        <label>Asignar a (Consultor)</label>
                        <select id="taskAssignee" class="form-control">
                            <option value="">-- Sin asignar --</option>
                        </select>
                    </div>

                    <div class="form-inline-group">
                        <label>Fecha Límite</label>
                        <input type="date" id="taskDueDate" required>
                    </div>

                    <div class="form-inline-group">
                        <label>Horas Estimadas</label>
                        <input type="number" id="taskHours" value="0" step="0.5">
                    </div>

                    <div class="form-group">
                        <label>Descripción / Criterios de Aceptación</label>
                        <textarea id="taskDesc" class="form-control" rows="3"></textarea>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn">Cancelar</button>
                        <button type="submit" class="btn-primary">Guardar Tarea</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    setupEvents(project);
    await loadTasks();
}

async function loadTasks() {
    // Usamos la tabla TICKETS para guardar tareas, filtrando por id_proyecto
    // Esto unifica la gestión en "Mis Actividades" luego.
    const { data: tasks, error } = await supabase
        .from('pr_tickets')
        .select(`
            *,
            asignado:id_asignado ( nombre_completo )
        `)
        .eq('id_proyecto', currentProjectId)
        .order('fecha_limite', { ascending: true });

    const tbody = document.querySelector('#wbsTable tbody');
    tbody.innerHTML = '';

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red">${error.message}</td></tr>`;
        return;
    }

    if (tasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999;">No hay tareas definidas. Comienza planificando.</td></tr>`;
        return;
    }

    tasks.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="ticket-code">${t.codigo_visual}</span></td>
            <td>${t.titulo}</td>
            <td>${t.asignado?.nombre_completo || '<span style="color:#cbd5e1">--</span>'}</td>
            <td><span class="badge ${t.estado}">${t.estado}</span></td>
            <td>${t.tiempo_estimado_horas || 0}h</td>
            <td>${Utils.formatDate(t.fecha_limite)}</td>
        `;
        // Al hacer clic, vamos al detalle de la tarea (que es la misma pantalla de detalle de ticket)
        tr.style.cursor = 'pointer';
        tr.onclick = () => Router.navigate('PAN_TICKET_DETALLE', t.id_ticket);
        
        tbody.appendChild(tr);
    });
}

function setupEvents(project) {
    // Volver
    document.getElementById('btnBackList').onclick = () => Router.navigate('PAN_PROY_LIST');
    
    // Gantt (Placeholder)
    document.getElementById('btnGantt').onclick = () => alert("Gantt próximamente");

    // Modal Tarea
    const modal = document.getElementById('modalTask');
    const form = document.getElementById('formTask');
    
    document.getElementById('btnNewTask').onclick = async () => {
        await cargarConsultores(project.id_organizacion);
        modal.style.display = 'flex';
    };

    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(b => 
        b.onclick = () => modal.style.display = 'none'
    );

    // Guardar Tarea
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const newTask = {
            titulo: document.getElementById('taskTitle').value,
            descripcion: document.getElementById('taskDesc').value,
            id_proyecto: currentProjectId,
            id_organizacion: project.id_organizacion, // Hereda la Org del Proyecto
            id_solicitante: (await supabase.auth.getUser()).data.user.id,
            id_asignado: document.getElementById('taskAssignee').value || null,
            fecha_limite: document.getElementById('taskDueDate').value,
            tiempo_estimado_horas: document.getElementById('taskHours').value,
            estado: 'ABIERTO', // Estado inicial
            prioridad: 'MEDIA',
            codigo_visual: 'TASK-' + Math.floor(Math.random() * 10000) // Generador simple temp
        };

        const { error } = await supabase.from('pr_tickets').insert(newTask);
        
        if(error) alert("Error: " + error.message);
        else {
            modal.style.display = 'none';
            form.reset();
            loadTasks();
        }
    };
}

async function cargarConsultores(orgId) {
    const select = document.getElementById('taskAssignee');
    select.innerHTML = '<option>Cargando...</option>';
    
    // Aquí deberíamos cargar usuarios con acceso a esta organización
    // Por simplicidad, cargamos todos los activos
    const { data: users } = await supabase
        .from('pr_usuarios')
        .select('id_usuario, nombre_completo')
        .eq('activo', true);

    select.innerHTML = '<option value="">-- Sin Asignar (Pool) --</option>';
    if(users) {
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id_usuario;
            opt.innerText = u.nombre_completo;
            select.appendChild(opt);
        });
    }
}