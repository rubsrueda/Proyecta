import { supabase } from '../config.js';
import { State } from '../core/state.js';
import * as DetailScreen from './ticketDetail.js';
import * as I18n from '../services/i18nService.js';
import * as GmailService from '../services/gmailService.js';

let containerRef = null;
let dynamicFieldsConfig = [];
let gmailAttachmentsData = null; // Para guardar datos de adjuntos de Gmail

export async function render(container, datosPrellenados = null) {
    containerRef = container;
    gmailAttachmentsData = datosPrellenados; // Guardar para usar al crear ticket
    
    container.innerHTML = `
        <div class="screen-header">
            <h2 data-i18n="tkt_title">Gestión de Tickets</h2>
            <button id="btnNewTicket" class="btn-primary" data-i18n="tkt_btn_new">+ Nuevo Ticket</button>
        </div>
        
        <div class="filters-bar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <input type="text" id="searchTicket" data-i18n="tkt_search" placeholder="Buscar..." class="search-input" style="max-width:200px;">
            
            <!-- NUEVO FILTRO: Checkbox para ver cerrados -->
            <label style="display:flex; align-items:center; gap:5px; font-size:0.9rem; cursor:pointer; background:white; padding:5px 10px; border:1px solid #e2e8f0; border-radius:4px;">
                 <input type="checkbox" id="chkShowClosed"> Mostrar Resueltos/Cerrados
            </label>
        </div>

        <div class="table-container">
            <table class="data-table" id="ticketsTable">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Asunto</th>
                        <th>Estado</th>
                        <th>Prioridad</th>
                        <th>Fecha</th>
                        <th>Adjunto</th>
                    </tr>
                </thead> 
                <tbody><tr><td colspan="6" style="text-align:center" data-i18n="lbl_loading">Cargando...</td></tr></tbody>
            </table>
        </div>

        <!-- MODAL CREACIÓN (Lógica completa conservada) -->
        <div id="modalCreate" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 data-i18n="modal_tkt_titulo">Nuevo Ticket</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <form id="formCreateTicket">
                    <!-- 1. Campos Compactos -->
                    <div class="form-inline-group">
                        <label data-i18n="lbl_codigo_manual">Código</label>
                        <input type="text" id="ticketCustomCode" placeholder="Auto">
                    </div>
                    
                    <div class="form-group" style="margin-bottom:10px;">
                        <label style="display:block; margin-bottom:2px; font-weight:600;">Asunto</label>
                        <input type="text" id="ticketTitle" class="form-control" required style="width:100%;">
                    </div>

                    <!-- 2. Prioridad -->
                    <div class="form-inline-group">
                        <label data-i18n="col_priority">Prioridad</label>
                        <select id="ticketPriority">
                            <option value="BAJA">Baja</option>
                            <option value="MEDIA" selected>Media</option>
                            <option value="ALTA">Alta</option>
                        </select>
                    </div>

                    <!-- 3. CAMPOS DINÁMICOS -->
                    <div id="dynamicFieldsContainer"></div>

                    <!-- 4. Resultado Esperado -->
                    <div class="form-group">
                        <label>Resultado Esperado</label>
                        <textarea id="ticketExpectedResult" class="form-control" rows="2" placeholder="Qué se debe lograr..."></textarea>
                    </div>

                    <!-- 5. Descripción -->
                    <div class="form-group">
                        <label data-i18n="lbl_descripcion">Descripción</label>
                        <textarea id="ticketDesc" class="form-control" required rows="3"></textarea>
                    </div>

                    <!-- 6. Archivo Adjunto -->
                    <div class="form-group">
                        <label data-i18n="lbl_attachment">Archivo Adjunto (Opcional)</label>
                        <input type="file" id="ticketAttachment" class="form-control" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt">
                        <small style="color:#64748b; font-size:0.75rem;">Máx. 5MB - Imágenes, PDF, documentos</small>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal-btn" data-i18n="btn_cancelar">Cancelar</button>
                        <button type="submit" class="btn-primary" data-i18n="btn_crear">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    I18n.traducirPagina(container);
    setupEvents();
    await cargarTickets();

    // LÓGICA DE APERTURA AUTOMÁTICA (Para cuando viene de Gmail)
    if (datosPrellenados) {
        document.getElementById('ticketTitle').value = datosPrellenados.asunto || '';
        document.getElementById('ticketDesc').value = datosPrellenados.cuerpo || '';
        
        // Mostrar información de adjuntos de Gmail si existen
        if (datosPrellenados.attachments && datosPrellenados.attachments.length > 0) {
            const fileInput = document.getElementById('ticketAttachment');
            const parent = fileInput.parentElement;
            
            // Agregar mensaje informativo sobre adjuntos de Gmail
            const gmailAttachInfo = document.createElement('div');
            gmailAttachInfo.id = 'gmailAttachmentsInfo';
            gmailAttachInfo.style.cssText = 'margin-top:8px; padding:8px; background:#dbeafe; border-radius:4px; font-size:0.8rem;';
            gmailAttachInfo.innerHTML = `
                <div style="font-weight:600; margin-bottom:4px; color:#1e40af;">📧 Adjuntos del correo (${datosPrellenados.attachments.length}):</div>
                ${datosPrellenados.attachments.map(att => `<div>• ${att.filename}</div>`).join('')}
                <div style="margin-top:4px; color:#475569; font-size:0.75rem;">
                    ℹ️ Se guardarán automáticamente al crear el ticket
                </div>
            `;
            parent.appendChild(gmailAttachInfo);
            
            // Ocultar el input de archivo local cuando hay adjuntos de Gmail
            fileInput.style.display = 'none';
            fileInput.previousElementSibling.style.display = 'none'; // Ocultar el <small>
        }
        
        await loadDynamicFields(); 
        document.getElementById('modalCreate').style.display = 'flex';
    }
}

async function loadDynamicFields() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: userData } = await supabase
        .from('pr_usuarios')
        .select('id_organizacion_principal')
        .eq('id_usuario', user.id)
        .single();
        
    if (!userData) return;

    const { data: fields } = await supabase
        .from('pr_campos_dinamicos')
        .select('*')
        .eq('id_organizacion', userData.id_organizacion_principal)
        .order('id_campo', { ascending: true });

    dynamicFieldsConfig = fields || [];
    const container = document.getElementById('dynamicFieldsContainer');
    container.innerHTML = ''; 

    dynamicFieldsConfig.forEach(field => {
        const isList = field.tipo_dato === 'LISTA';
        const div = document.createElement('div');
        div.className = isList ? 'form-inline-group' : 'form-group';
        
        const label = document.createElement('label');
        label.innerText = field.etiqueta;
        div.appendChild(label);

        let input;
        if (isList) {
            input = document.createElement('select');
            field.opciones.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.innerText = opt;
                if (opt === field.valor_defecto) option.selected = true;
                input.appendChild(option);
            });
        } else {
            input = document.createElement('input');
            input.type = 'text';
            if (field.valor_defecto) input.value = field.valor_defecto;
            if (!isList) input.className = 'form-control'; 
        }

        input.classList.add('dynamic-input');
        input.dataset.key = field.nombre_campo;
        div.appendChild(input);
        container.appendChild(div);
    });
}

async function guardarTicket() {
    try {
        // 1. Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Error: Usuario no autenticado');
            return;
        }

        console.log('[CREAR TICKET] Usuario autenticado:', user.email, 'ID:', user.id);

        // 2. Obtener id_usuario de pr_usuarios (intentar múltiples estrategias)
        let userData = null;
        let userError = null;
        
        // Estrategia 1: por email
        const r1 = await supabase
            .from('pr_usuarios')
            .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
            .eq('email', user.email)
            .maybeSingle();
        
        if (!r1.error && r1.data) {
            userData = r1.data;
        } else {
            // Estrategia 2: por auth_user_id
            const r2 = await supabase
                .from('pr_usuarios')
                .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            
            if (!r2.error && r2.data) {
                userData = r2.data;
            } else {
                // Estrategia 3: id_usuario directo
                const r3 = await supabase
                    .from('pr_usuarios')
                    .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
                    .eq('id_usuario', user.id)
                    .maybeSingle();
                
                if (!r3.error && r3.data) {
                    userData = r3.data;
                } else {
                    userError = r3.error || r2.error || r1.error;
                }
            }
        }

        if (userError || !userData) {
            console.error('[CREAR TICKET] Error buscando usuario:', userError);
            alert('Error: Tu usuario no está registrado en el sistema');
            return;
        }

        console.log('[CREAR TICKET] Usuario encontrado:', userData.id_usuario);

        // 3. Recopilar datos del formulario
        const customCode = document.getElementById('ticketCustomCode').value.trim();
        const valoresExtra = {};
        document.querySelectorAll('.dynamic-input').forEach(input => {
            valoresExtra[input.dataset.key] = input.value;
        });

        // 4. Generar código si no se proporcionó uno
        let finalCode = customCode;
        if (!finalCode) {
            const year = new Date().getFullYear();
            const randomCode = Math.floor(Math.random() * 900000) + 100000;
            finalCode = `TK:${year}-A${randomCode}`;
        }

        // 5. Crear objeto del ticket con el id_usuario correcto
        const nuevoTicket = {
            codigo_visual: finalCode,
            titulo: document.getElementById('ticketTitle').value,
            descripcion: document.getElementById('ticketDesc').value,
            resultado_esperado: document.getElementById('ticketExpectedResult').value,
            prioridad: document.getElementById('ticketPriority').value,
            estado: 'EN_PROCESO',  // Cambiar de 'ABIERTO' a 'EN_PROCESO'
            id_solicitante: userData.id_usuario,  // Usar id_usuario de BD, no OAuth ID
            id_organizacion: userData.id_organizacion_principal,
            valores_dinamicos: valoresExtra
        };

        console.log('[CREAR TICKET] Insertando:', nuevoTicket);

        // 6. Insertar en BD
        const { data: ticketData, error } = await supabase
            .from('pr_tickets')
            .insert(nuevoTicket)
            .select()
            .single();

        if (error) {
            console.error('[CREAR TICKET] Error insertando:', error);
            if (error.code === '23505') {
                alert('Error: Código duplicado. Por favor, usa otro código.');
            } else {
                alert('Error al crear ticket: ' + error.message);
            }
        } else {
            console.log('[CREAR TICKET] Ticket creado exitosamente');
            
            // 7. Subir archivo adjunto si existe
            const fileInput = document.getElementById('ticketAttachment');
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                
                // Validar tamaño (5MB máximo)
                if (file.size > 5 * 1024 * 1024) {
                    alert('✅ Ticket creado, pero el archivo es demasiado grande (máx. 5MB)');
                } else {
                    try {
                        const ticketId = ticketData.id_ticket;
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${finalCode}_${Date.now()}.${fileExt}`;
                        const filePath = `tickets/${ticketId}/${fileName}`;

                        console.log('[CREAR TICKET] Subiendo archivo:', fileName);

                        // Subir a Supabase Storage
                        const { error: uploadError } = await supabase.storage
                            .from('attachments')
                            .upload(filePath, file);

                        if (uploadError) {
                            console.error('[CREAR TICKET] Error subiendo archivo:', uploadError);
                            alert('✅ Ticket creado, pero hubo un error al subir el archivo: ' + uploadError.message);
                        } else {
                            // Actualizar el ticket con la ruta del archivo
                            await supabase
                                .from('pr_tickets')
                                .update({ archivo_adjunto: filePath })
                                .eq('id_ticket', ticketId);
                            
                            console.log('[CREAR TICKET] Archivo subido correctamente');
                            alert('✅ Ticket creado exitosamente con archivo adjunto');
                        }
                    } catch (uploadErr) {
                        console.error('[CREAR TICKET] Excepción al subir archivo:', uploadErr);
                        alert('✅ Ticket creado, pero error al procesar archivo');
                    }
                }
            } else {
                alert('✅ Ticket creado exitosamente');
            }
            
            document.getElementById('modalCreate').style.display = 'none';
            document.getElementById('formCreateTicket').reset();
            await cargarTickets();  // Recargar lista
        }
    } catch(e) {
        console.error('[CREAR TICKET] Error inesperado:', e);
        alert('Error inesperado: ' + e.message);
    }
}

async function cargarTickets() {
    try {
        // 1. Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[TICKETS] Usuario no autenticado');
            return;
        }

        console.log('[TICKETS] Usuario autenticado:', user.email, 'ID:', user.id);

        // 2. Obtener id_usuario de la tabla pr_usuarios
        // Intentamos múltiples estrategias según la estructura de la BD
        
        // Estrategia 1: Buscar por email (si existe la columna)
        let userData = null;
        let userError = null;
        
        const result1 = await supabase
            .from('pr_usuarios')
            .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
            .eq('email', user.email)
            .maybeSingle();
        
        if (!result1.error && result1.data) {
            userData = result1.data;
            console.log('[TICKETS] Usuario encontrado por email:', userData);
        } else {
            console.log('[TICKETS] No se encontró por email, intentando por auth_user_id...');
            
            // Estrategia 2: Buscar por auth_user_id (relación directa con OAuth)
            const result2 = await supabase
                .from('pr_usuarios')
                .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            
            if (!result2.error && result2.data) {
                userData = result2.data;
                console.log('[TICKETS] Usuario encontrado por auth_user_id:', userData);
            } else {
                console.log('[TICKETS] No se encontró por auth_user_id, intentando por id_usuario directo...');
                
                // Estrategia 3: Asumir que id_usuario == user.id de OAuth
                const result3 = await supabase
                    .from('pr_usuarios')
                    .select('id_usuario, id_organizacion_principal, id_perfil_defecto')
                    .eq('id_usuario', user.id)
                    .maybeSingle();
                
                if (!result3.error && result3.data) {
                    userData = result3.data;
                    console.log('[TICKETS] Usuario encontrado por id_usuario directo:', userData);
                } else {
                    userError = result3.error || result2.error || result1.error;
                    console.error('[TICKETS] No se pudo encontrar usuario con ninguna estrategia');
                    console.error('[TICKETS] Errores:', {
                        por_email: result1.error,
                        por_auth_user_id: result2.error,
                        por_id_usuario: result3.error
                    });
                }
            }
        }

        if (userError || !userData) {
            console.error('[TICKETS] Error buscando usuario:', userError);
            document.querySelector('#ticketsTable tbody').innerHTML = `
                <tr><td colspan="5" style="color:red; text-align:center;">
                    Error: Usuario no encontrado en BD (${user.email})
                </td></tr>`;
            return;
        }

        if (!userData) {
            console.error('[TICKETS] Usuario no encontrado en BD');
            document.querySelector('#ticketsTable tbody').innerHTML = `
                <tr><td colspan="5" style="color:red; text-align:center;">
                    Error: Tu usuario no está registrado en el sistema
                </td></tr>`;
            return;
        }

        console.log('[TICKETS] Usuario encontrado:', {
            id_usuario: userData.id_usuario,
            id_perfil_defecto: userData.id_perfil_defecto,
            tipo_perfil: typeof userData.id_perfil_defecto
        });

        // 3. Leer Filtros
        const showClosed = document.getElementById('chkShowClosed').checked;
        const searchText = document.getElementById('searchTicket').value;

        // 4. Construir query dinámicamente según perfil
        let query = supabase
            .from('pr_tickets')
            .select('*')
            .order('fecha_creacion', { ascending: false });

        // Convertir id_perfil_defecto a número por si viene como string
        const userIdPerfil = parseInt(userData.id_perfil_defecto);

        // Si es cliente (perfil 5) o consultor (perfil 4), mostrar solo sus tickets
        if (userIdPerfil === 5) {
            console.log('[TICKETS] Filtrando como CLIENTE - solicitante:', userData.id_usuario);
            query = query.eq('id_solicitante', userData.id_usuario);
        } else if (userIdPerfil === 4) {
            console.log('[TICKETS] Filtrando como CONSULTOR - asignado:', userData.id_usuario);
            query = query.eq('id_asignado', userData.id_usuario);
        } else {
            console.log('[TICKETS] Mostrando TODOS los tickets (perfil ' + userIdPerfil + ')');
        }

        // 5. Aplicar lógica de filtro
        if (!showClosed) {
              // Excluir tanto RESUELTOS como CERRADOS
              query = query.not('estado', 'in', '(RESUELTO,CERRADO)');
        }

        if (searchText) {
            query = query.ilike('titulo', `%${searchText}%`);
        }

        const { data: tickets, error } = await query;

        const tbody = document.querySelector('#ticketsTable tbody');
        tbody.innerHTML = '';

        if (error) {
            console.error('[TICKETS] Error cargando:', error);
            tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">${error.message}</td></tr>`;
            return;
        }

        console.log('[TICKETS] Tickets obtenidos:', tickets?.length || 0);

        if (!tickets || tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No se encontraron tickets.</td></tr>`;
            return;
    }

    tickets.forEach(t => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        
        // Estilo atenuado si está cerrado
        const style = t.estado === 'CERRADO' ? 'opacity:0.6; background:#f9fafb;' : '';

        // Usamos data-label para el responsive móvil
        row.innerHTML = `
            <td data-label="Código" style="${style}"><span class="ticket-code">${t.codigo_visual}</span></td>
            <td data-label="Asunto" style="${style} font-weight:600;">${t.titulo}</td>
            <td data-label="Estado" style="${style}"><span class="badge ${t.estado}">${t.estado}</span></td>
            <td data-label="Prioridad" style="${style}">${t.prioridad}</td>
            <td data-label="Fecha" style="${style}">${new Date(t.fecha_creacion).toLocaleDateString()}</td>
            <td data-label="Adjunto" style="${style} text-align:center;">
                ${t.archivo_adjunto ? 
                    `<button class="btn-download-attachment" data-file-path="${t.archivo_adjunto}" title="Descargar archivo" style="padding:4px 8px; font-size:0.75rem; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">📎</button>` 
                    : '<span style="color:#94a3b8;">-</span>'}
            </td>
        `;
        
        // Agregar evento de clic al botón de descarga si existe
        row.onclick = (e) => {
            // Si se hace clic en el botón de descarga, no abrir el detalle
            if (e.target.classList.contains('btn-download-attachment')) {
                e.stopPropagation();
                downloadAttachment(e.target.dataset.filePath);
            } else {
                if(containerRef) DetailScreen.render(containerRef, t.id_ticket);
            }
        };
        
        tbody.appendChild(row);
    });
    } catch(e) {
        console.error('[TICKETS] Error inesperado:', e);
        const tbody = document.querySelector('#ticketsTable tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error: ${e.message}</td></tr>`;
        }
    }
}

function setupEvents() {
    const modal = document.getElementById('modalCreate');
    const btnOpen = document.getElementById('btnNewTicket');
    const btnsClose = document.querySelectorAll('.close-modal, .close-modal-btn');
    const form = document.getElementById('formCreateTicket');

    // Eventos Filtros
    document.getElementById('chkShowClosed').onchange = cargarTickets;
    document.getElementById('searchTicket').onkeyup = cargarTickets;

    // Eventos Modal
    btnOpen.onclick = async () => {
        await loadDynamicFields();
        modal.style.display = 'flex';
    };
    
    btnsClose.forEach(btn => btn.onclick = () => modal.style.display = 'none');
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        await guardarTicket();
    };
}

// Función para descargar archivo adjunto
async function downloadAttachment(filePath) {
    try {
        if (!filePath) {
            alert('No hay archivo adjunto');
            return;
        }

        console.log('[TICKETS] Descargando archivo:', filePath);

        // Obtener URL pública temporal (válida por 60 segundos)
        const { data, error } = await supabase.storage
            .from('attachments')
            .createSignedUrl(filePath, 60);

        if (error) {
            console.error('[TICKETS] Error obteniendo URL:', error);
            alert('Error al obtener el archivo: ' + error.message);
            return;
        }

        // Abrir en nueva pestaña o descargar
        window.open(data.signedUrl, '_blank');
    } catch (err) {
        console.error('[TICKETS] Error descargando archivo:', err);
        alert('Error al descargar: ' + err.message);
    }
}