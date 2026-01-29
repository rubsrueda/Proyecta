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
        const emailMatch = fromHeader.match(/<(.+)>/);
        const email = emailMatch ? emailMatch[1] : fromHeader;

        return {
            id: m.id,
            subject,
            from: fromHeader,
            emailLimpio: email.toLowerCase(),
            snippet: m.snippet
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