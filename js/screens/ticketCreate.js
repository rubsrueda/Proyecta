//js/screens/ticketCreate.js
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { State } from '../core/state.js';
import * as I18n from '../services/i18nService.js';

console.log('[TICKET CREATE v1.0001] Módulo cargado');

export async function render(container) {
    console.log('[TICKET CREATE] Renderizando pantalla de alta de tickets');
    const user = State.user;
    const profile = State.profile;
    
    // Obtenemos configuración de la organización del usuario
    const orgConfig = profile.pr_organizaciones || {};
    const allowDirect = orgConfig.permite_asignacion_directa;

    container.innerHTML = `
        <div class="screen-header">
            <h2>Nueva Solicitud de Soporte</h2>
        </div>

        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <p style="color:#64748b; margin-bottom:20px;">
                Describe tu problema detalladamente. Un consultor atenderá tu solicitud.
            </p>

            <form id="formStandaloneTicket">
                
                <!-- TÍTULO -->
                <div class="form-group">
                    <label>Asunto / Título</label>
                    <input type="text" id="tktTitle" class="form-control" placeholder="Ej: Error al generar factura" required>
                </div>

                <!-- PRIORIDAD -->
                <div class="form-inline-group">
                    <label>Prioridad</label>
                    <select id="tktPriority" class="form-control">
                        <option value="BAJA">Baja (Consulta)</option>
                        <option value="MEDIA" selected>Media (Normal)</option>
                        <option value="ALTA">Alta (Bloqueante)</option>
                    </select>
                </div>

                <!-- ASIGNACIÓN DIRECTA (Condicional) -->
                <div id="assignContainer" class="form-inline-group" style="display:none; background:#f0f9ff; padding:10px; border-radius:6px;">
                    <label style="color:#0369a1;">Asignar a Consultor (Opcional)</label>
                    <select id="tktAssignee" class="form-control">
                        <option value="">-- Enviar a Mesa de Ayuda --</option>
                    </select>
                </div>

                <!-- DESCRIPCIÓN -->
                <div class="form-group">
                    <label>Descripción Detallada</label>
                    <textarea id="tktDesc" class="form-control" rows="5" required placeholder="Pasos para reproducir el error..."></textarea>
                </div>

                <!-- ARCHIVOS ADJUNTOS -->
                <div class="form-group">
                    <label>Archivo Adjunto (Opcional)</label>
                    <input type="file" id="tktAttachment" class="form-control" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt">
                    <small style="color:#64748b; font-size:0.75rem;">Máx. 5MB - Imágenes, PDF, documentos</small>
                </div>

                <div class="modal-footer" style="margin-top:20px;">
                    <button type="button" class="btn-secondary" id="btnCancel">Cancelar</button>
                    <button type="submit" class="btn-primary" style="padding:10px 20px;">Enviar Solicitud</button>
                </div>
            </form>
        </div>
    `;

    I18n.traducirPagina(container);

    console.log('[TICKET CREATE] HTML renderizado');
    console.log('[TICKET CREATE] allowDirect:', allowDirect);

    // Verificar que el input file se haya creado correctamente
    const fileInput = document.getElementById('tktAttachment');
    console.log('[TICKET CREATE] Input file encontrado:', fileInput !== null);
    if (fileInput) {
        console.log('[TICKET CREATE] Input file tipo:', fileInput.type);
        console.log('[TICKET CREATE] Input file accept:', fileInput.accept);
        
        // Agregar listener para debug
        fileInput.addEventListener('change', (e) => {
            console.log('[TICKET CREATE] Archivo seleccionado:', e.target.files[0]?.name);
            console.log('[TICKET CREATE] Tamaño:', e.target.files[0]?.size, 'bytes');
        });
    }

    // Lógica de Asignación Directa
    if (allowDirect) {
        document.getElementById('assignContainer').style.display = 'flex';
        await loadConsultants();
    }

    setupEvents(profile);
}

async function loadConsultants() {
    const select = document.getElementById('tktAssignee');
    // Traer solo perfiles asignables (Consultores)
    const { data: users } = await supabase
        .from('pr_usuarios')
        .select('id_usuario, nombre_completo, pr_sis_perfiles!inner(es_asignable)')
        .eq('activo', true)
        .eq('pr_sis_perfiles.es_asignable', true);

    if (users) {
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id_usuario;
            opt.innerText = u.nombre_completo;
            select.appendChild(opt);
        });
    }
}

function setupEvents(profile) {
    console.log('[TICKET CREATE] Configurando eventos');
    
    document.getElementById('btnCancel').onclick = () => {
        console.log('[TICKET CREATE] Botón cancelar clickeado');
        Router.navigate('PAN_DASHBOARD');
    };

    document.getElementById('formStandaloneTicket').onsubmit = async (e) => {
        e.preventDefault();
        console.log('[TICKET CREATE] ========== INICIO SUBMIT ==========');
        
        // Generar Código con formato TK:AAAAA-AXXXXXX
        const year = new Date().getFullYear();
        const randomCode = Math.floor(Math.random() * 900000) + 100000;
        const code = `TK:${year}-A${randomCode}`;
        console.log('[TICKET CREATE] Código generado:', code);

        const newTicket = {
            codigo_visual: code,
            titulo: document.getElementById('tktTitle').value,
            descripcion: document.getElementById('tktDesc').value,
            prioridad: document.getElementById('tktPriority').value,
            id_asignado: document.getElementById('tktAssignee')?.value || null,
            id_solicitante: profile.id_usuario,
            id_organizacion: profile.id_organizacion_principal,
            estado: document.getElementById('tktAssignee')?.value ? 'EN_PROCESO' : 'ABIERTO'
        };

        console.log('[TICKET CREATE] Datos del ticket:', newTicket);
        console.log('[TICKET CREATE] Insertando en base de datos...');

        const { data: ticketData, error } = await supabase
            .from('pr_tickets')
            .insert(newTicket)
            .select()
            .single();

        if (error) {
            console.error('[TICKET CREATE] ❌ Error al insertar:', error);
            alert("Error: " + error.message);
            return;
        }

        console.log('[TICKET CREATE] ✅ Ticket creado con ID:', ticketData.id_ticket);

        // Verificar archivo adjunto
        const fileInput = document.getElementById('tktAttachment');
        console.log('[TICKET CREATE] Verificando archivo adjunto...');
        console.log('[TICKET CREATE] Input encontrado:', fileInput !== null);
        console.log('[TICKET CREATE] Files:', fileInput?.files);
        console.log('[TICKET CREATE] Tiene archivo:', fileInput?.files?.length > 0);
        
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            console.log('[TICKET CREATE] 📎 Archivo detectado:', file.name);
            console.log('[TICKET CREATE] Tamaño:', file.size, 'bytes (', (file.size / 1024 / 1024).toFixed(2), 'MB)');
            
            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                console.warn('[TICKET CREATE] ⚠️ Archivo demasiado grande');
                alert(`✅ Ticket creado (${code}), pero el archivo es demasiado grande (máx. 5MB)`);
            } else {
                try {
                    const ticketId = ticketData.id_ticket;
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${code}_${Date.now()}.${fileExt}`;
                    const filePath = `tickets/${ticketId}/${fileName}`;

                    console.log('[TICKET CREATE] Subiendo archivo a Storage...');
                    console.log('[TICKET CREATE] Ruta:', filePath);

                    // Subir a Supabase Storage
                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('[TICKET CREATE] ❌ Error subiendo archivo:', uploadError);
                        alert(`✅ Ticket creado (${code}), pero hubo un error al subir el archivo: ` + uploadError.message);
                    } else {
                        console.log('[TICKET CREATE] ✅ Archivo subido exitosamente');
                        console.log('[TICKET CREATE] Actualizando registro del ticket...');
                        
                        // Actualizar el ticket con la ruta del archivo
                        const { error: updateError } = await supabase
                            .from('pr_tickets')
                            .update({ archivo_adjunto: filePath })
                            .eq('id_ticket', ticketId);
                        
                        if (updateError) {
                            console.error('[TICKET CREATE] ❌ Error actualizando registro:', updateError);
                        } else {
                            console.log('[TICKET CREATE] ✅ Registro actualizado con ruta del archivo');
                        }
                        
                        alert(`✅ Ticket creado con éxito (${code}) con archivo adjunto`);
                    }
                } catch (uploadErr) {
                    console.error('[TICKET CREATE] ❌ Excepción al subir archivo:', uploadErr);
                    alert(`✅ Ticket creado (${code}), pero error al procesar archivo`);
                }
            }
        } else {
            console.log('[TICKET CREATE] Sin archivo adjunto');
            alert(`✅ Ticket creado con éxito (${code}).`);
        }
        
        console.log('[TICKET CREATE] ========== FIN SUBMIT ==========');
        console.log('[TICKET CREATE] Navegando a lista de tickets...');
        
        // Redirigir a "Mis Tickets" (Lista)
        Router.navigate('PAN_TICKET_LIST');
    };
}