import { supabase } from '../config.js';

export async function sincronizarEventosGoogle(ticketCode, ticketId) {
    console.group("--- INICIO SINCRONIZACIÓN DIAGNÓSTICO ---");
    console.log("1. El sistema está buscando ESTE CÓDIGO EXACTO:", ticketCode);

    // 1. Obtener sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.provider_token) throw new Error("Sesión caducada.");

    const token = session.provider_token;
    
    // 2. Rango de fechas (Muy amplio para evitar problemas de año)
    const timeMin = new Date(); timeMin.setFullYear(timeMin.getFullYear() - 1);
    const timeMax = new Date(); timeMax.setFullYear(timeMax.getFullYear() + 2);

    // 3. Consultar a Google (Traemos TODO para filtrar nosotros)
    console.log("2. Consultando a Google Calendar (Primary)...");
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` + new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 500 // Traemos muchos
    });

    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    
    if (!response.ok) {
        console.error("Error API Google:", response);
        throw new Error("Error conectando con Google: " + response.statusText);
    }

    const data = await response.json();
    const eventos = data.items || [];
    console.log(`3. Google devolvió ${eventos.length} eventos en total.`);

    // 4. Filtrado con LOGS
    let encontrados = 0;
    let importados = 0;

    console.log("4. Comparando eventos uno a uno...");
    
    for (const evento of eventos) {
        const tituloEvento = evento.summary || "(Sin título)";
        
        // Limpiamos espacios y pasamos a minúsculas para comparar mejor
        const codigoBuscado = ticketCode.trim().toLowerCase();
        const tituloLimpio = tituloEvento.toLowerCase();

        // LOGICA DE COMPARACIÓN
        const coincide = tituloLimpio.includes(codigoBuscado);

        if (coincide) {
            console.log(`%c [MATCH] Encontrado: "${tituloEvento}"`, 'color: green; font-weight: bold;');
            encontrados++;
            
            // Guardar en BD
            const start = new Date(evento.start.dateTime || evento.start.date);
            const end = new Date(evento.end.dateTime || evento.end.date);
            const duracionMin = Math.round((end - start) / (1000 * 60));

            const nuevaActividad = {
                id_ticket: ticketId,
                id_usuario: session.user.id,
                google_event_id: evento.id,
                tipo_actividad: 'DESARROLLO',
                resumen: evento.summary,
                fecha_inicio: start.toISOString(),
                fecha_fin: end.toISOString(),
                duracion_minutos: duracionMin,
                estado: 'COMPLETADO'
            };

            const { error } = await supabase.from('pr_actividades').upsert(nuevaActividad, { onConflict: 'google_event_id' });
            if (!error) importados++;
            else console.error("Error SQL:", error);

        } else {
            // Descomenta esta línea si quieres ver los que NO coinciden (llenará mucho la consola)
            // console.log(`[NO] "${tituloEvento}" no contiene "${ticketCode}"`);
        }
    }

    console.log(`5. Resumen: Encontrados en Calendar: ${encontrados} | Guardados en BD: ${importados}`);
    console.groupEnd();
    
    return importados;
}

export async function obtenerActividadesLocales(ticketId) {
    const { data, error } = await supabase
        .from('pr_actividades')
        .select('*')
        .eq('id_ticket', ticketId)
        .order('fecha_inicio', { ascending: false });
    if (error) throw error;
    return data;
}