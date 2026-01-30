import { supabase } from '../config.js';
import { State } from '../core/state.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    container.innerHTML = `
        <div class="screen-header">
            <h2>Reporte de Trabajo del Consultor</h2>
            <div style="font-size:0.85rem; color:#64748b;">Unifica Google Calendar con la actividad registrada en Proyecta.</div>
        </div>

        <div class="card" style="margin-bottom:20px; padding:15px;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:end;">
                <div class="form-group" style="margin:0; min-width:220px;">
                    <label>Consultor</label>
                    <select id="repConsultant" class="form-control"></select>
                </div>
                <div class="form-group" style="margin:0;">
                    <label>Desde</label>
                    <input type="date" id="repStart" class="form-control" value="${firstDay}">
                </div>
                <div class="form-group" style="margin:0;">
                    <label>Hasta</label>
                    <input type="date" id="repEnd" class="form-control" value="${lastDay}">
                </div>
                <label style="display:flex; align-items:center; gap:6px; font-size:0.9rem; background:#f8fafc; border:1px solid #e2e8f0; padding:6px 10px; border-radius:6px;">
                    <input type="checkbox" id="repIncludeGoogle" checked>
                    Unificar Google Calendar
                </label>
                <button id="btnRunReport" class="btn-primary" style="height:38px;">Ejecutar</button>
            </div>
        </div>

        <div class="card" style="margin-bottom:10px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.85rem; color:#64748b;">Total horas</div>
            <div id="repTotalHours" style="font-weight:bold; font-size:1rem;">0.0</div>
        </div>

        <div class="table-container">
            <table class="data-table" id="consultantReportTable">
                <thead>
                    <tr>
                        <th>Año</th>
                        <th>Mes</th>
                        <th>Día</th>
                        <th>Hora desde</th>
                        <th>Hora hasta</th>
                        <th>Horas</th>
                        <th>Solicitó</th>
                        <th>Cliente</th>
                        <th>Responsable</th>
                        <th>Tipo</th>
                        <th>Causa raíz</th>
                        <th>Actividad</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody id="consultantReportBody">
                    <tr><td colspan="13" style="text-align:center">Define filtros y ejecuta.</td></tr>
                </tbody>
            </table>
        </div>
    `;

    I18n.traducirPagina(container);

    await loadConsultants();

    document.getElementById('btnRunReport').onclick = () => runReport();
}

async function loadConsultants() {
    const select = document.getElementById('repConsultant');
    select.innerHTML = '<option value="">Cargando...</option>';

    const { data: users, error } = await supabase
        .from('pr_usuarios')
        .select('id_usuario, nombre_completo, pr_sis_perfiles!inner(es_asignable)')
        .eq('activo', true)
        .eq('pr_sis_perfiles.es_asignable', true)
        .order('nombre_completo');

    if (error) {
        select.innerHTML = '<option value="">Error cargando consultores</option>';
        console.error(error);
        return;
    }

    select.innerHTML = '';

    const currentUserId = State.user?.id;
    const currentUser = users?.find(u => u.id_usuario === currentUserId);
    if (currentUser) {
        const opt = document.createElement('option');
        opt.value = currentUser.id_usuario;
        opt.innerText = `${currentUser.nombre_completo} (Yo)`;
        select.appendChild(opt);
    }

    (users || []).forEach(u => {
        if (u.id_usuario === currentUserId) return;
        const opt = document.createElement('option');
        opt.value = u.id_usuario;
        opt.innerText = u.nombre_completo;
        select.appendChild(opt);
    });

    if (!select.value && currentUserId) {
        select.value = currentUserId;
    }
}

async function runReport() {
    const start = document.getElementById('repStart').value;
    const end = document.getElementById('repEnd').value;
    const userId = document.getElementById('repConsultant').value;
    const includeGoogle = document.getElementById('repIncludeGoogle').checked;
    const tbody = document.getElementById('consultantReportBody');
    const currentUserId = State.user?.id;

    if (!userId) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; color:#ef4444;">Selecciona un consultor.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center">Calculando...</td></tr>';

    const allowGoogle = includeGoogle && currentUserId && userId === currentUserId;

    const [localActivities, googleEvents] = await Promise.all([
        fetchLocalActivities(userId, start, end),
        allowGoogle ? fetchGoogleEvents(start, end) : Promise.resolve([])
    ]);

    const merged = mergeActivities(localActivities, googleEvents);

    if (!merged.length) {
        tbody.innerHTML = '<tr><td colspan="13" style="text-align:center">No hay actividad en el periodo.</td></tr>';
        document.getElementById('repTotalHours').innerText = '0.0';
        return;
    }

    tbody.innerHTML = '';
    let totalHours = 0;

    merged.forEach(item => {
        totalHours += item.hours;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Año">${item.year}</td>
            <td data-label="Mes">${item.month}</td>
            <td data-label="Día">${item.day}</td>
            <td data-label="Hora desde">${item.startTime}</td>
            <td data-label="Hora hasta">${item.endTime}</td>
            <td data-label="Horas" style="font-weight:bold;">${item.hours.toFixed(2)}</td>
            <td data-label="Solicitó">${item.requester}</td>
            <td data-label="Cliente">${item.client}</td>
            <td data-label="Responsable">${item.owner}</td>
            <td data-label="Tipo">${item.tipo}</td>
            <td data-label="Causa raíz">${item.causa}</td>
            <td data-label="Actividad">${item.activity}</td>
            <td data-label="Detalles">${item.details}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('repTotalHours').innerText = totalHours.toFixed(2);
}

async function fetchLocalActivities(userId, start, end) {
    const { data, error } = await supabase
        .from('pr_actividades')
        .select(`
            id_actividad,
            fecha_inicio,
            fecha_fin,
            duracion_minutos,
            resumen,
            tipo_actividad,
            google_event_id,
            pr_tickets (
                titulo,
                descripcion,
                valores_dinamicos,
                solicitante:pr_usuarios!id_solicitante (nombre_completo),
                responsable:pr_usuarios!id_asignado (nombre_completo),
                pr_organizaciones (nombre_comercial)
            )
        `)
        .eq('id_usuario', userId)
        .gte('fecha_inicio', start)
        .lte('fecha_inicio', end + 'T23:59:59')
        .order('fecha_inicio', { ascending: true });

    if (error) {
        console.error(error);
        return [];
    }

    return (data || []).map(act => {
        const startDate = new Date(act.fecha_inicio);
        const endDate = new Date(act.fecha_fin || act.fecha_inicio);
        const hours = act.duracion_minutos ? (act.duracion_minutos / 60) : (endDate - startDate) / 3600000;

        const ticket = act.pr_tickets || {};
        const requester = ticket.solicitante?.nombre_completo || '-';
        const owner = ticket.responsable?.nombre_completo || '-';
        const client = ticket.pr_organizaciones?.nombre_comercial || '-';
        const { tipo, causa } = extractClasificaciones(ticket.valores_dinamicos || {});

        return {
            source: 'local',
            googleEventId: act.google_event_id,
            start: startDate,
            end: endDate,
            year: startDate.getFullYear(),
            month: pad2(startDate.getMonth() + 1),
            day: pad2(startDate.getDate()),
            startTime: formatTime(startDate),
            endTime: formatTime(endDate),
            hours,
            requester,
            client,
            owner: String(owner || '-'),
            tipo,
            causa,
            activity: act.resumen || ticket.titulo || act.tipo_actividad || '-'.toString(),
            details: ticket.descripcion || act.resumen || '-'.toString(),
            summaryKey: normalizeSummary(act.resumen || ticket.titulo || act.tipo_actividad || '')
        };
    });
}

async function fetchGoogleEvents(start, end) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.provider_token) {
        console.warn('[REPORT] Sesión sin token de Google.');
        return [];
    }

    const timeMin = new Date(`${start}T00:00:00`);
    const timeMax = new Date(`${end}T23:59:59`);

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` + new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 500
    });

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.provider_token}` }
    });

    if (!response.ok) {
        console.error('[REPORT] Error Google Calendar:', response);
        return [];
    }

    const json = await response.json();
    const items = json.items || [];

    return items
        .filter(ev => ev.start?.dateTime && ev.end?.dateTime)
        .map(ev => {
            const startDate = new Date(ev.start.dateTime);
            const endDate = new Date(ev.end.dateTime);
            const hours = (endDate - startDate) / 3600000;
            return {
                source: 'google',
                googleEventId: ev.id,
                start: startDate,
                end: endDate,
                year: startDate.getFullYear(),
                month: pad2(startDate.getMonth() + 1),
                day: pad2(startDate.getDate()),
                startTime: formatTime(startDate),
                endTime: formatTime(endDate),
                hours,
                requester: '-'.toString(),
                client: '-'.toString(),
                owner: '-'.toString(),
                tipo: '-'.toString(),
                causa: '-'.toString(),
                activity: ev.summary || '(Sin título)',
                details: ev.description || ev.location || '-',
                summaryKey: normalizeSummary(ev.summary || '')
            };
        });
}

function mergeActivities(localActivities, googleEvents) {
    const localByGoogleId = new Set(localActivities.filter(a => a.googleEventId).map(a => a.googleEventId));
    const localKeys = new Set(localActivities.map(a => buildDedupKey(a)));

    const merged = [...localActivities];

    googleEvents.forEach(ev => {
        if (ev.googleEventId && localByGoogleId.has(ev.googleEventId)) return;
        const key = buildDedupKey(ev);
        if (localKeys.has(key)) return;
        merged.push(ev);
    });

    return merged.sort((a, b) => a.start - b.start);
}

function buildDedupKey(item) {
    return `${roundTo5(item.start).toISOString()}|${roundTo5(item.end).toISOString()}|${item.summaryKey}`;
}

function roundTo5(date) {
    const ms = 1000 * 60 * 5;
    return new Date(Math.round(date.getTime() / ms) * ms);
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function pad2(num) {
    return String(num).padStart(2, '0');
}

function normalizeSummary(text) {
    return (text || '').trim().toLowerCase();
}

function extractClasificaciones(valores) {
    let tipo = '-';
    let causa = '-';

    Object.keys(valores || {}).forEach(key => {
        const normalizedKey = key.toString().toLowerCase().replace(/\s+/g, ' ').trim();
        const value = valores[key];
        if (normalizedKey.includes('tipo') && tipo === '-') {
            tipo = value || '-';
        }
        if ((normalizedKey.includes('causa') && (normalizedKey.includes('raiz') || normalizedKey.includes('raíz'))) && causa === '-') {
            causa = value || '-';
        }
    });

    return { tipo: String(tipo || '-'), causa: String(causa || '-') };
}
