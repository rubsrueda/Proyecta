import * as GmailService from '../services/gmailService.js';
import * as TicketsScreen from './tickets.js'; 

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
        
        // Usamos un diseño grid para separar acciones
        row.innerHTML = `
            <td style="font-weight:bold; font-size:0.8rem; width:25%; vertical-align:top;">
                ${mail.from.split('<')[0]}
                <div style="font-weight:normal; color:#999; font-size:0.7rem;">${new Date(mail.date).toLocaleDateString()}</div>
            </td>
            <td style="vertical-align:top;">
                <div style="font-weight:600; font-size:0.9rem; margin-bottom:4px;">${mail.subject}</div>
                <div style="color:#666; font-size:0.75rem; line-height:1.2;">${mail.snippet}</div>
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
                    cuerpo: `Remitente: ${mail.from}\nFecha: ${mail.date}\n\n${mail.snippet}...` // O el cuerpo completo si lo tuviéramos
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