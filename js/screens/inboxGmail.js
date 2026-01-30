import * as GmailService from '../services/gmailService.js';
import * as TicketsScreen from './ticketList.js'; 

export async function render(container) {
    container.innerHTML = `
        <div class="screen-header">
            <h2>Buzón de Entrada (Pendientes)</h2>
            <button id="btnRefresh" class="btn-secondary">🔄</button>
        </div>
        <div class="table-container">
            <table class="data-table" id="mailTable">
                <tbody><tr><td style="text-align:center">Buscando correos...</td></tr></tbody>
            </table>
        </div>
    `;

    try {
        const correos = await GmailService.obtenerCorreosRecientes();
        renderizarLista(correos, container);
    } catch (e) {
        document.querySelector('#mailTable tbody').innerHTML = `<tr><td style="color:red">${e.message}</td></tr>`;
    }

    document.getElementById('btnRefresh').onclick = () => render(container);
}

function renderizarLista(correos, container) {
    const tbody = document.querySelector('#mailTable tbody');
    tbody.innerHTML = '';

    if (correos.length === 0) {
        tbody.innerHTML = '<tr><td style="text-align:center; padding:20px;">No hay correos pendientes.</td></tr>';
        return;
    }

    correos.forEach(mail => {
        const row = document.createElement('tr');
        
        // Indicador de adjuntos
        const attachmentIndicator = mail.attachments && mail.attachments.length > 0 
            ? `<span title="${mail.attachments.length} adjunto(s)" style="color:#2563eb;">📎 ${mail.attachments.length}</span>` 
            : '';
        
        // Usamos un diseño grid para separar acciones
        row.innerHTML = `
            <td style="font-weight:bold; font-size:0.8rem; width:25%; vertical-align:top;">
                ${mail.from.split('<')[0]} ${attachmentIndicator}
                <div style="font-weight:normal; color:#999; font-size:0.7rem;">${new Date(mail.date).toLocaleDateString()}</div>
            </td>
            <td style="vertical-align:top;">
                <div style="font-weight:600; font-size:0.9rem; margin-bottom:4px;">${mail.subject}</div>
                <div style="color:#666; font-size:0.75rem; line-height:1.2;">${mail.snippet}</div>
                ${mail.attachments && mail.attachments.length > 0 ? `
                    <div style="margin-top:8px; padding:8px; background:#f8fafc; border-radius:4px;">
                        <div style="font-size:0.75rem; font-weight:600; margin-bottom:4px; color:#475569;">Adjuntos:</div>
                        ${mail.attachments.map(att => `
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                <button class="btn-download-gmail-attachment" 
                                    data-message-id="${mail.id}"
                                    data-attachment-id="${att.attachmentId}"
                                    data-filename="${att.filename}"
                                    style="padding:2px 8px; font-size:0.7rem; background:#2563eb; color:white; border:none; border-radius:3px; cursor:pointer;">
                                    ⬇️ ${att.filename}
                                </button>
                                <span style="font-size:0.7rem; color:#94a3b8;">${formatFileSize(att.size)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </td>
            <td style="text-align:right; width:140px; vertical-align:top;">
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <!-- OPCIÓN 2: SOLO LEER (Descartar) -->
                    <button class="btn-secondary btn-dismiss" style="padding:6px; font-size:0.75rem;">
                        Marcar Leído
                    </button>
                    
                    <!-- OPCIÓN 3: CONVERTIR A TICKET -->
                    <button class="btn-primary btn-convert" style="padding:6px; font-size:0.75rem;">
                        + Ticket
                    </button>
                </div>
            </td>
        `;
        
        // --- LÓGICA DE BOTONES ---

        // Botones de descarga de adjuntos
        row.querySelectorAll('.btn-download-gmail-attachment').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const messageId = btn.dataset.messageId;
                const attachmentId = btn.dataset.attachmentId;
                const filename = btn.dataset.filename;
                
                btn.innerText = '⏳...';
                try {
                    await GmailService.descargarAdjunto(messageId, attachmentId, filename);
                    btn.innerText = '✅';
                    setTimeout(() => btn.innerText = `⬇️ ${filename}`, 2000);
                } catch (error) {
                    console.error('Error descargando adjunto:', error);
                    alert('Error al descargar: ' + error.message);
                    btn.innerText = `⬇️ ${filename}`;
                }
            };
        });

        // A) Botón "Marcar Leído" (Solo quitar de la lista)
        const btnDismiss = row.querySelector('.btn-dismiss');
        btnDismiss.onclick = async () => {
            btnDismiss.innerText = "...";
            try {
                await GmailService.marcarComoLeido(mail.id);
                efectoDesaparecer(row);
            } catch (error) {
                alert("Error: " + error.message);
            }
        };

        // B) Botón "+ Ticket" (Marcar leído Y abrir formulario)
        const btnConvert = row.querySelector('.btn-convert');
        btnConvert.onclick = async () => {
            btnConvert.innerText = "...";
            try {
                // 1. Marcar como procesado en Gmail
                await GmailService.marcarComoLeido(mail.id);
                
                // 2. Ir a pantalla de Tickets con datos
                const datosParaTicket = {
                    asunto: mail.subject,
                    cuerpo: `Remitente: ${mail.from}\nFecha: ${mail.date}\n\n${mail.snippet}...`, // O el cuerpo completo si lo tuviéramos
                    mailId: mail.id, // Guardar ID del correo para adjuntos
                    attachments: mail.attachments || [] // Pasar adjuntos
                };
                
                await TicketsScreen.render(container, datosParaTicket);

            } catch (error) {
                alert("Error: " + error.message);
            }
        };

        tbody.appendChild(row);
    });
}

function efectoDesaparecer(row) {
    row.style.transition = "all 0.5s";
    row.style.opacity = "0";
    row.style.transform = "translateX(100%)"; // Deslizar a la derecha
    setTimeout(() => row.remove(), 500);
}

// Función auxiliar para formatear tamaño de archivo
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}