// js/config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO SUPABASE
const SUPABASE_URL = 'https://wwafeitljxnlvmjtwsjz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3YWZlaXRsanhubHZtanR3c2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NDA0OTEsImV4cCI6MjA4MzExNjQ5MX0.kmXNqJX5MuOAajgdNLeQYhxl0_jSp7i8VD6d2AFaCWs'; // La clave larga que empieza por eyJ...

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Definimos los permisos que vamos a pedir a Google (Separados por espacio)
// profile email: Para saber quién es
// calendar: Para leer/escribir eventos
// gmail.readonly: Para leer correos (y buscar tickets)
export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify';