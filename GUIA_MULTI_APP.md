# 🔐 Guía: Separar Proyecta e Iberion con el Mismo Supabase

## Problema
Tienes **2 aplicaciones** que comparten **la misma instancia de Supabase Auth**:
- **Proyecta**: Tiene sus propias tablas (`pr_usuarios`, `pr_usuarios_acceso`, etc.)
- **Iberion**: Usa directamente los usuarios de Supabase Auth

**Síntoma:** Al hacer login con Google en Proyecta, se abre Iberion (o viceversa).

---

## Solución Implementada

Sistema de **validación automática por base de datos**:

1. Usuario hace login con Google
2. Se redirige a Proyecta
3. Proyecta valida: ¿existe en `pr_usuarios`?
   - ✅ SÍ → acceso a Proyecta
   - ❌ NO → redirige a Iberion

---

## 🎯 Cómo Funciona

### **Flujo: Usuario intenta abrir Proyecta**

```
1. Usuario: juan@empresa.com hace login con Google
   ↓
2. Google redirige a: https://proyecta.com/?code=abc123
   ↓
3. Proyecta carga y busca en BD:
   SELECT id_usuario FROM pr_usuarios WHERE email = 'juan@empresa.com'
   ↓
4. Resultado:
   ✅ Si EXISTE → Carga Proyecta normalmente
   ❌ Si NO EXISTE → Alert + Redirige a Iberion
```

---

## 📁 Configuración

### **Proyecta: [js/appConfig.js](js/appConfig.js)**

```javascript
export const APP_CONFIG = {
    APP_ID: 'PROYECTA',
    VALIDATION_MODE: 'database',      // Valida en pr_usuarios
    USER_TABLE: 'pr_usuarios',         // Tabla a buscar
    ERROR_MESSAGE: 'Tu cuenta no está registrada en Proyecta.',
    REDIRECT_PATH: '/app.html',
    FALLBACK_URL: 'https://iberion.com'  // 👈 Cambiar por URL real
};
```

---

### **Iberion: js/appConfig.js (versión Iberion)**

```javascript
export const APP_CONFIG = {
    APP_ID: 'IBERION',
    VALIDATION_MODE: 'none',           // Sin validación (usa Supabase Auth)
    ERROR_MESSAGE: 'Error al cargar aplicación.',
    REDIRECT_PATH: '/app.html'
};
```

**Nota:** Iberion NO necesita validación porque usa directamente Supabase Auth.

---

## 🔧 Parámetros de Configuración

| Parámetro | Qué Hace | Ejemplo |
|-----------|----------|---------|
| `APP_ID` | Identificador único | `'PROYECTA'`, `'IBERION'` |
| `VALIDATION_MODE` | Tipo de validación | `'database'` (Proyecta), `'none'` (Iberion) |
| `USER_TABLE` | Tabla a buscar el usuario | `'pr_usuarios'` |
| `FALLBACK_URL` | URL si no existe usuario | `'https://iberion.com'` |

---

## 📊 Validación en Proyecta

```javascript
// En appConfig.js - función validateUserAccess()

if (APP_CONFIG.VALIDATION_MODE === 'database') {
    // Buscar en pr_usuarios
    const { data, error } = await supabaseClient
        .from('pr_usuarios')
        .select('id_usuario')
        .eq('email', userProfile.email)
        .single();
    
    if (data) {
        console.log('✅ Usuario pertenece a Proyecta');
        return true;
    } else {
        console.log('❌ Usuario pertenece a Iberion');
        return false;  // Redirige a Iberion
    }
}
```

---

## 🧪 Cómo Probar

### **Test 1: Usuario de Proyecta**

1. Usuario: `juan@empresa.com` (registrado en `pr_usuarios`)
2. Abre: `https://proyecta.com`
3. Login con Google
4. **Esperado:** ✅ Acceso a Proyecta, menú cargado

**Consola:**
```
[APP] Validando acceso para juan@empresa.com
[APP] ✅ Usuario validado en Proyecta: juan@empresa.com
[APP] Usuario validado para PROYECTA
```

---

### **Test 2: Usuario de Iberion**

1. Usuario: `maria@empresa.com` (NO está en `pr_usuarios`)
2. Abre: `https://proyecta.com`
3. Login con Google
4. **Esperado:** ❌ Mensaje "Tu cuenta no está registrada en Proyecta"
5. **Esperado:** 🔄 Redirige a `https://iberion.com`

**Consola:**
```
[APP] Validando acceso para maria@empresa.com
[APP] Usuario NO encontrado en pr_usuarios: maria@empresa.com
[APP] → El usuario pertenece a otra aplicación (Iberion)
[APP] Usuario sin acceso a esta aplicación
```

---

### **Test 3: Usuario Compartido (En ambas apps)**

Si quieres que un usuario acceda a **Proyecta** e **Iberion**:

1. Registra en `pr_usuarios`:
```sql
INSERT INTO pr_usuarios (email, ...) VALUES ('juan@empresa.com', ...);
```

2. El usuario ya existe en Supabase Auth (porque hizo login)

3. Resultado:
   - Puede acceder a Proyecta ✅
   - Puede acceder a Iberion ✅

---

## 🚀 Pasos de Implementación

### **Paso 1: Copiar appConfig.js a Proyecta**

Ya está listo en [js/appConfig.js](js/appConfig.js)

### **Paso 2: Crear appConfig.js para Iberion**

En el repo de Iberion, crear `js/appConfig.js`:

```javascript
// Iberion NO valida nada (usa Supabase Auth directamente)
export const APP_CONFIG = {
    APP_ID: 'IBERION',
    VALIDATION_MODE: 'none',
    ERROR_MESSAGE: 'Error al cargar aplicación.',
    REDIRECT_PATH: '/app.html'
};

export async function validateUserAccess(userProfile) {
    return true;  // Todos los usuarios de Supabase Auth pueden entrar
}

export function getRedirectUrl() {
    return `${window.location.origin}${APP_CONFIG.REDIRECT_PATH}?app=${APP_CONFIG.APP_ID}`;
}
```

### **Paso 3: Actualizar app.js de Iberion**

Agregar la validación (aunque siempre pase):

```javascript
import { validateUserAccess } from './appConfig.js';

// En initApp()
const hasAccess = await validateUserAccess(State.profile);
if (!hasAccess) {
    alert('No tienes acceso');
    window.location.href = 'index.html';
    return;
}
```

### **Paso 4: Configurar URL de fallback en Proyecta**

En [js/appConfig.js](js/appConfig.js), actualizar:

```javascript
FALLBACK_URL: 'https://tu-dominio-iberion.com'
```

---

## ⚡ Validación Actual

**Estado:** ✅ Activa para Proyecta

```javascript
VALIDATION_MODE: 'database'  // Busca en pr_usuarios
```

Si necesitas **desactivar temporalmente** para testing:

```javascript
VALIDATION_MODE: 'none'  // Permitir todos
```

---

## 🔍 Debugging

### Ver logs en consola (F12):

**Usuario de Proyecta:**
```
[APP] ✅ Usuario validado en Proyecta: juan@empresa.com
[APP] Usuario validado para PROYECTA
```

**Usuario de Iberion:**
```
[APP] Usuario NO encontrado en pr_usuarios: maria@empresa.com
[APP] → El usuario pertenece a otra aplicación (Iberion)
```

### Ver configuración actual:
```javascript
import { APP_CONFIG } from './appConfig.js';
console.log(APP_CONFIG);
```

---

## 📋 Checklist de Implementación

- [ ] Proyecta: [js/appConfig.js](js/appConfig.js) configurado con `VALIDATION_MODE: 'database'`
- [ ] Proyecta: `FALLBACK_URL` actualizado con URL de Iberion
- [ ] Iberion: Crear `js/appConfig.js` con `VALIDATION_MODE: 'none'`
- [ ] Iberion: Actualizar `app.js` con validación (aunque siempre pase)
- [ ] Probar login de usuario en Proyecta → debe funcionar
- [ ] Probar login de usuario en Iberion → debe funcionar
- [ ] Probar usuario de Iberion en Proyecta → debe redirigir a Iberion
- [ ] Revisar consola para ver logs de validación

---

## 🎯 Resumen Técnico

| App | Validación | Tabla | Usuarios |
|-----|-----------|-------|----------|
| **Proyecta** | Busca en `pr_usuarios` | `pr_usuarios` | Los que crees en tu app |
| **Iberion** | Sin validación | Supabase Auth | Todos los de Google OAuth |

---

## 🚨 Importante

- **Proyecta** necesita tener al usuario en `pr_usuarios` para que pueda entrar
- **Iberion** solo necesita que exista en Supabase Auth (automático con Google OAuth)
- Si un usuario tiene cuenta en ambas apps, debe estar registrado en `pr_usuarios`

---

**¿Alguna duda sobre la configuración?**

