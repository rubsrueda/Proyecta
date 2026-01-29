# 📋 Resumen de Cambios - Debugging Tickets y Validaciones

## 🎯 Problema
- Pantalla de **Tickets**: No muestran datos para clientes ni consultantes
- Pantalla de **Validación**: No muestran tickets resueltos

## 🔧 Cambios Realizados

### 1. **ticketValidation.js** - Lógica de Filtrado Mejorada
**Archivo**: [js/screens/ticketValidation.js](js/screens/ticketValidation.js)

#### Cambios:
✅ **Agregado diagnóstico de perfil**
- La función ahora obtiene el `id_perfil` del usuario desde `pr_usuarios`
- Convierte a número con `parseInt()` para evitar problemas de tipo

✅ **Filtrado dinámico según perfil**
- **Cliente (perfil 5)**: Ve tickets donde `id_solicitante = su_id_usuario`
- **Consultante (perfil 4)**: Ve tickets donde `id_asignado = su_id_usuario`

✅ **Logs detallados para debugging**
```javascript
[VALIDACION] Iniciando loadToValidate para usuario: 123
[VALIDACION] BD usuario: { id_perfil: 4 }, null
[VALIDACION] Perfil convertido a número: 4
[VALIDACION] Perfil CONSULTANTE - filtrando por id_asignado
[VALIDACION] Tickets obtenidos: 2, Error: null
```

#### Antes:
```javascript
const { data: tickets, error } = await supabase
    .from('pr_tickets')
    .select(`*, asignado:id_asignado(nombre_completo)`)
    .eq('id_solicitante', userId)  // ❌ Solo buscaba solicitante
    .eq('estado', 'RESUELTO');
```

#### Ahora:
```javascript
const { data: userData, error: userError } = await supabase
    .from('pr_usuarios')
    .select('id_perfil')
    .eq('id_usuario', userId)
    .single();

const userProfile = parseInt(userData.id_perfil);

let query = supabase
    .from('pr_tickets')
    .select(`*, asignado:id_asignado(nombre_completo), solicitante:id_solicitante(nombre_completo)`)
    .eq('estado', 'RESUELTO');

if (userProfile === 5) {
    query = query.eq('id_solicitante', userId);  // Cliente ve sus solicitudes
} else if (userProfile === 4) {
    query = query.eq('id_asignado', userId);     // Consultante ve lo que resolvió
}
```

---

### 2. **debug.html** - Herramienta de Diagnóstico (NUEVO)
**Archivo**: [debug.html](debug.html)

#### Propósito:
Herramienta visual e interactiva para diagnosticar problemas en la BD

#### Pruebas Incluidas:
1. ✅ **Probar Conexión Supabase** - ¿Se puede conectar a la BD?
2. ✅ **Verificar Usuario Autenticado** - ¿Estoy logueado en OAuth?
3. ✅ **Verificar Usuario en PR_USUARIOS** - ¿Mi usuario existe en la BD?
4. ✅ **Contar Tickets** - ¿Hay datos en la tabla pr_tickets?
5. ✅ **Listar Todos los Tickets** - ¿Qué tickets existen?
6. ✅ **Listar Usuarios Registrados** - ¿Qué usuarios hay en el sistema?
7. ✅ **Verificar Estructura de Tablas** - ¿Cuáles son los nombres exactos de columnas?

#### Cómo Usar:
```
1. Abre en navegador: https://rubsrueda.github.io/Proyecta/debug.html
2. Inicia sesión con tu usuario
3. Haz clic en cada botón en orden
4. Verifica los resultados en el panel de resultados
```

---

### 3. **DEBUG_GUIDE.md** - Documentación de Debugging (NUEVO)
**Archivo**: [DEBUG_GUIDE.md](DEBUG_GUIDE.md)

#### Contenido:
- Causas potenciales del problema
- 3 opciones para debuggear (debug.html, consola, SQL directo)
- Qué logs buscar para diagnosticar
- Estructura de datos esperada
- Próximos pasos recomendados

---

## 🚀 Cómo Proceder

### Opción 1: Debugging Visual (Recomendado)
```bash
1. Ve a https://rubsrueda.github.io/Proyecta/debug.html
2. Inicia sesión con tu usuario
3. Ejecuta cada prueba
4. Comparte los resultados
```

### Opción 2: Revisar Consola del Navegador
```bash
1. Abre DevTools (F12)
2. Ve a Tickets o Validación
3. Busca logs con [TICKETS] o [VALIDACION]
4. Identifica en qué paso falla
```

### Opción 3: Consulta Directa en Supabase
```sql
-- Ver si tu usuario está registrado
SELECT * FROM pr_usuarios WHERE email = 'tu@email.com';

-- Ver tickets para ese usuario
SELECT id_ticket, titulo, id_solicitante, id_asignado, estado 
FROM pr_tickets 
WHERE id_solicitante = <tu_id> OR id_asignado = <tu_id>;
```

---

## 🔍 Diagnóstico Rápido

Si **NO ves tickets**, verifica en orden:

### ❌ Paso 1: Conexión a BD
```
Si falla: "Error conectando a Supabase"
→ Problema de internet o credenciales incorrectas
→ Verificar que config.js tenga URLs correctas
```

### ❌ Paso 2: Usuario Autenticado
```
Si falla: "No hay usuario autenticado"
→ Debes estar logueado en Google OAuth
→ Haz clic en "Login" y usa tu cuenta de Google
```

### ❌ Paso 3: Usuario en BD
```
Si falla: "Usuario no encontrado en pr_usuarios"
→ El usuario existe en Google pero no está registrado en el sistema
→ SOLUCIÓN: Ejecuta en Supabase SQL Editor:
   INSERT INTO pr_usuarios (email, id_perfil) 
   VALUES ('tu@email.com', 5);  -- 5 para cliente, 4 para consultante
```

### ❌ Paso 4: Tickets en BD
```
Si falla: "No hay tickets"
→ La tabla pr_tickets está vacía
→ Debes crear tickets primero desde la aplicación
```

### ❌ Paso 5: Estructura de Tablas
```
Si falla: Error mostrando columnas
→ Hay un problema en el esquema de la BD
→ Contacta al administrador para revisar DDL
```

---

## 📊 Matriz de Roles - Quién Ve Qué

| Perfil | ID | Ve Tickets Como | Condición |
|--------|----|----|---|
| Cliente | 5 | Solicitante | `id_solicitante = su_id` |
| Consultante | 4 | Asignado | `id_asignado = su_id` |

### Ejemplo:
- **Usuario**: Juan (id_usuario=10, id_perfil=5)
- **Ticket 1**: TKT-001, id_solicitante=10, id_asignado=5
  - ✅ Juan lo VE (es quien lo solicitó)
- **Ticket 2**: TKT-002, id_solicitante=99, id_asignado=10
  - ❌ Juan NO lo ve (no lo solicitó, aunque está asignado)

---

## ✅ Checklist de Validación

Cuando reportes que funciona, verifica:

- [ ] Veo mis tickets creados en "Tickets"
- [ ] Veo validaciones en "Validación" 
- [ ] Los logs muestran [TICKETS] y [VALIDACION]
- [ ] La consola no tiene errores rojos
- [ ] Mi usuario aparece en `pr_usuarios` con id_perfil correcto
- [ ] Hay al menos 1 ticket en `pr_tickets`

---

## 🐛 Errores Comunes

### "Usuario no encontrado en BD"
**Causa**: Google OAuth no está sincronizado con pr_usuarios
**Solución**: Ejecutar INSERT en Supabase

### "No tienes validaciones pendientes"
**Causa**: No hay tickets con estado='RESUELTO' asignados a ti
**Solución**: Crear tickets de prueba y cambiar su estado a RESUELTO

### "Error en la consulta: RLS policy"
**Causa**: Row Level Security está activo y bloqueando acceso
**Solución**: Desactivar RLS o configurar políticas correctas

---

## 📞 Información para Reportar

Si necesitas ayuda, incluye:
```
Usuario: tu@email.com
Perfil: (5=Cliente, 4=Consultante)
Resultado Test 3: [copiar de debug.html]
Resultado Test 4: [copiar de debug.html]
Error exacto: [copiar de la consola]
Timestamp: [fecha y hora]
```

---

**Actualizado**: 2024
**Versión**: 1.0 - Debugging mejorado
