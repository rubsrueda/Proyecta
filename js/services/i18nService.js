import { supabase } from '../config.js';

let diccionarioCache = {}; 
let idiomaActual = 'es';

/**
 * 1. Carga todas las palabras del idioma seleccionado desde la BD
 */
export async function cargarDiccionario(codigoIdioma) {
    idiomaActual = codigoIdioma;
    console.log(`[i18n] Cargando idioma: ${codigoIdioma}...`);
    
    const { data, error } = await supabase
        .from('pr_sis_diccionario')
        .select('clave_diccionario, texto')
        .eq('codigo_idioma', codigoIdioma);

    if (error) {
        console.error("Error cargando idioma:", error);
        return; // Fallback visual (se verán las claves)
    }

    // Convertimos a objeto simple para acceso rápido
    diccionarioCache = {};
    data.forEach(item => {
        diccionarioCache[item.clave_diccionario] = item.texto;
    });
    
    console.log(`[i18n] ${data.length} términos cargados.`);
}

/**
 * 2. Traduce una clave individual (útil para alertas o código JS)
 */
export function t(clave) {
    return diccionarioCache[clave] || `[${clave}]`;
}

/**
 * 3. Busca en todo el HTML etiquetas data-i18n y las traduce
 */
export function traducirPagina(contenedor = document) {
    const elementos = contenedor.querySelectorAll('[data-i18n]');
    
    elementos.forEach(el => {
        const clave = el.getAttribute('data-i18n');
        if (diccionarioCache[clave]) {
            // Si es un input con placeholder
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.placeholder = diccionarioCache[clave];
            } else {
                // Texto normal
                el.innerText = diccionarioCache[clave];
            }
        }
    });
}