import { supabase } from '../config.js';

export async function obtenerCorreosRecientes() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    if (!token) throw new Error("Sesión caducada.");

    const { reglas, usuariosPermitidos } = await obtenerConfiguracionGmail(session.user.id);

    // 1. CONSTRUIR CONSULTA (AHORA SOLO NO LEÍDOS)
    let queryParts = ['is:unread']; // <--- ESTO ES NUEVO Y CRÍTICO

    // Filtros de etiqueta/palabras (opcionales)
    let filtrosOpcionales = [];
    if (reglas.gmail_filter_label) filtrosOpcionales.push(`label:${reglas.gmail_filter_label}`);
    if (reglas.gmail_filter_keywords && reglas.gmail_filter_keywords.length > 0) {
        reglas.gmail_filter_keywords.forEach(kw => filtrosOpcionales.push(`subject:${kw}`));
    }

    // Lógica: is:unread AND (label:X OR subject:Y)
    if (filtrosOpcionales.length > 0) {
        queryParts.push(`(${filtrosOpcionales.join(' OR ')})`);
    }

    const qString = queryParts.join(' ');
    console.log("Consulta Gmail:", qString);

    // 2. CONSULTAR API
    const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=${encodeURIComponent(qString)}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!listResponse.ok) throw new Error("Error leyendo Gmail.");
    const listData = await listResponse.json();
    if (!listData.messages) return [];

    // ... (El resto de la función de obtener detalles y filtrar usuarios sigue IGUAL) ...
    // ... (Copia la parte de 'const promesas = ...' hasta el return filtrados del código anterior) ...
    
    // Aquí repito el bloque de obtención y filtrado para que tengas el archivo completo funcional
    const promesas = listData.messages.map(msg => 
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    );
    const mensajesRaw = await Promise.all(promesas);

    const correosProcesados = mensajesRaw.map(m => {
        const headers = m.payload.headers;
        const subject = headers.find(h => h.name === 'Subject')?.value || '(Sin asunto)';
        const fromHeader = headers.find(h => h.name === 'From')?.value || '';
        const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
        const emailMatch = fromHeader.match(/<(.+)>/);
        const email = emailMatch ? emailMatch[1] : fromHeader;

        // Obtener archivos adjuntos
        const attachments = obtenerAdjuntos(m.payload);

        return {
            id: m.id,
            subject,
            from: fromHeader,
            date: dateHeader,
            emailLimpio: email.toLowerCase(),
            snippet: m.snippet,
            attachments: attachments // Array de adjuntos
        };
    });

    if (reglas.gmail_require_registered_user) {
        return correosProcesados.filter(c => usuariosPermitidos.includes(c.emailLimpio));
    }
    return correosProcesados;
}

// --- NUEVA FUNCIÓN: MARCAR COMO LEÍDO ---
// --- FUNCIÓN CORREGIDA ---
export async function marcarComoLeido(messageId) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;

    // Cambiamos 'batchModify' por 'modify' que es más estándar para uno solo
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            removeLabelIds: ['UNREAD']
        })
    });

    if (!response.ok) {
        const err = await response.json();
        console.error("Error Gmail:", err);
        throw new Error("Google rechazó la modificación (CORS o Permisos). Revisa la consola.");
    }
}

// --- FUNCIÓN PARA EXTRAER ADJUNTOS ---
function obtenerAdjuntos(payload, adjuntos = []) {
    // Recorrer partes del mensaje recursivamente
    if (payload.parts) {
        payload.parts.forEach(part => {
            // Si tiene filename y attachmentId, es un adjunto
            if (part.filename && part.filename.length > 0 && part.body.attachmentId) {
                adjuntos.push({
                    filename: part.filename,
                    mimeType: part.mimeType,
                    attachmentId: part.body.attachmentId,
                    size: part.body.size || 0
                });
            }
            
            // Recursivamente buscar en subpartes
            if (part.parts) {
                obtenerAdjuntos(part, adjuntos);
            }
        });
    }
    
    return adjuntos;
}

// --- FUNCIÓN PARA DESCARGAR UN ADJUNTO ---
export async function descargarAdjunto(messageId, attachmentId, filename) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    if (!token) throw new Error("Sesión caducada.");

    console.log('[GMAIL] Descargando adjunto:', filename, 'messageId:', messageId, 'attachmentId:', attachmentId);

    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) {
        const err = await response.json();
        console.error('[GMAIL] Error descargando adjunto:', err);
        throw new Error('Error al descargar el archivo adjunto');
    }

    const data = await response.json();
    
    // Los datos vienen en base64url, necesitamos convertirlos
    const base64Data = data.data.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Crear un blob y descargarlo
    const blob = new Blob([bytes]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log('[GMAIL] Adjunto descargado exitosamente');
}

// --- FUNCIÓN PARA SUBIR ADJUNTO A SUPABASE STORAGE ---
export async function guardarAdjuntoEnSupabase(messageId, attachmentId, filename, ticketId) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    if (!token) throw new Error("Sesión caducada.");

    console.log('[GMAIL] Guardando adjunto en Supabase:', filename);

    // Obtener los datos del adjunto desde Gmail
    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) {
        throw new Error('Error al obtener el archivo adjunto de Gmail');
    }

    const data = await response.json();
    
    // Convertir de base64url a blob
    const base64Data = data.data.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes]);
    
    // Subir a Supabase Storage
    const fileExt = filename.split('.').pop();
    const filePath = `tickets/${ticketId}/gmail_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, blob);

    if (uploadError) {
        console.error('[GMAIL] Error subiendo a Supabase:', uploadError);
        throw uploadError;
    }

    console.log('[GMAIL] Adjunto guardado en Supabase:', filePath);
    return filePath;
}

// ... (Función obtenerConfiguracionGmail sigue igual) ...
async function obtenerConfiguracionGmail(userId) {
    const { data: user } = await supabase.from('pr_usuarios').select('id_organizacion_principal').eq('id_usuario', userId).single();
    const { data: org } = await supabase.from('pr_organizaciones').select('configuracion_json').eq('id_organizacion', user.id_organizacion_principal).single();
    const { data: users } = await supabase.from('pr_usuarios').select('email');
    
    return {
        reglas: org.configuracion_json || {},
        usuariosPermitidos: users.map(u => u.email.toLowerCase())
    };
}