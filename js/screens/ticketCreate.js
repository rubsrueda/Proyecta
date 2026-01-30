//js/screens/ticketCreate.js
import { supabase } from '../config.js';
import { Router } from '../core/router.js';
import { State } from '../core/state.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
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
    document.getElementById('btnCancel').onclick = () => Router.navigate('PAN_DASHBOARD');

    document.getElementById('formStandaloneTicket').onsubmit = async (e) => {
        e.preventDefault();
        
        // Generar Código Simple
        const code = 'TK-' + Math.floor(Math.random() * 100000);

        const newTicket = {
            codigo_visual: code,
            titulo: document.getElementById('tktTitle').value,
            descripcion: document.getElementById('tktDesc').value,
            prioridad: document.getElementById('tktPriority').value,
            id_asignado: document.getElementById('tktAssignee')?.value || null, // Si es vacío, es NULL (Pool)
            id_solicitante: profile.id_usuario,
            id_organizacion: profile.id_organizacion_principal,
            estado: document.getElementById('tktAssignee')?.value ? 'EN_PROCESO' : 'ABIERTO' // Si asigné directo, ya está en proceso
        };

        const { data: ticketData, error } = await supabase
            .from('pr_tickets')
            .insert(newTicket)
            .select()
            .single();

        if (error) {
            alert("Error: " + error.message);
            return;
        }

        // Subir archivo adjunto si existe
        const fileInput = document.getElementById('tktAttachment');
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            
            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                alert(`✅ Ticket creado (${code}), pero el archivo es demasiado grande (máx. 5MB)`);
            } else {
                try {
                    const ticketId = ticketData.id_ticket;
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${code}_${Date.now()}.${fileExt}`;
                    const filePath = `tickets/${ticketId}/${fileName}`;

                    console.log('[CREAR TICKET] Subiendo archivo:', fileName);

                    // Subir a Supabase Storage
                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('[CREAR TICKET] Error subiendo archivo:', uploadError);
                        alert(`✅ Ticket creado (${code}), pero hubo un error al subir el archivo: ` + uploadError.message);
                    } else {
                        // Actualizar el ticket con la ruta del archivo
                        await supabase
                            .from('pr_tickets')
                            .update({ archivo_adjunto: filePath })
                            .eq('id_ticket', ticketId);
                        
                        console.log('[CREAR TICKET] Archivo subido correctamente');
                        alert(`✅ Ticket creado con éxito (${code}) con archivo adjunto`);
                    }
                } catch (uploadErr) {
                    console.error('[CREAR TICKET] Excepción al subir archivo:', uploadErr);
                    alert(`✅ Ticket creado (${code}), pero error al procesar archivo`);
                }
            }
        } else {
            alert(`✅ Ticket creado con éxito (${code}).`);
        }
        
        // Redirigir a "Mis Tickets" (Lista)
        Router.navigate('PAN_TICKET_LIST');
    };
}