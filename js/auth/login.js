// js/auth/login.js
import { supabase, GOOGLE_SCOPES } from '../config.js';

const btnGoogle = document.getElementById('btnGoogle');
const formEmail = document.getElementById('formEmail');

// Opción A: Login con Google (La potente)
btnGoogle.addEventListener('click', async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Pedimos los permisos de Calendar y Gmail aquí
                scopes: GOOGLE_SCOPES,
                // Esto es vital: 'offline' nos da un Refresh Token para actualizar
                // los datos del consultor mientras duerme (Tu Caso 4)
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: window.location.origin + '/app.html' // A dónde va al terminar
            },
        });
        if (error) throw error;
    } catch (error) {
        alert('Error iniciando sesión: ' + error.message);
    }
});

// Opción B: Login Clásico (Email/Pass)
// Esto sirve para usuarios que NO usan Google Workspace
// Opción B: Login Clásico (Modificado con Backdoor)
formEmail.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // --- LA PUERTA TRASERA DEL ARQUITECTO ---
    // Puedes cambiar 'admin123' por la contraseña que quieras
    if (email === 'architect@sys' && password === 'admin123') {
        // Guardamos una "Sesión Local" falsa
        localStorage.setItem('PROYECTA_ARCHITECT_MODE', 'true');
        window.location.href = 'app.html';
        return; 
    }
    // ----------------------------------------

    // Login Normal (Supabase)
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Credenciales incorrectas');
    } else {
        // Limpiamos modo arquitecto por si acaso
        localStorage.removeItem('PROYECTA_ARCHITECT_MODE');
        window.location.href = 'app.html';
    }
});