# 🚀 Instrucciones para Solucionar el Problema de Tickets

## Contexto
Las pantallas de **Tickets** y **Validación** no muestran datos. Hemos hecho cambios para mejorar el debugging.

## 📋 Checklist Paso a Paso

### Paso 1: Verifica que los cambios estén en el código ✅
**Archivo**: [js/screens/ticketValidation.js](js/screens/ticketValidation.js)

**Verifica que tenga**:
```javascript
const { data: userData, error: userError } = await supabase
    .from('pr_usuarios')
    .select('id_perfil')
    .eq('id_usuario', userId)
    .single();

const userProfile = parseInt(userData.id_perfil);

if (userProfile === 5) {
    // Cliente
    query = query.eq('id_solicitante', userId);
} else if (userProfile === 4) {
    // Consultante
    query = query.eq('id_asignado', userId);
}
```

Si NO lo tiene → Los cambios no se sincronizaron, recarga la página o borra cache.

---

### Paso 2: Abre la herramienta de Debugging 🔍

**Local** (si estás desarrollando):
```
http://localhost:5000/debug.html
```

**Producción** (GitHub Pages):
```
https://rubsrueda.github.io/Proyecta/debug.html
```

---

### Paso 3: Inicia sesión 🔐
1. Haz clic en el botón de "Login" o abre debug.html directamente
2. Selecciona tu cuenta de Google
3. El archivo debug.html automáticamente usará esas credenciales

---

### Paso 4: Ejecuta las pruebas en orden ✅

Haz clic en cada botón **EN ESTE ORDEN**:

#### Test 1: Probar Conexión Supabase
```
Resultado esperado:
✅ Conexión exitosa a Supabase
```

**Si falla**: Error de conectividad
- Verifica tu internet
- Verifica que config.js tenga URLs correctas

---

#### Test 2: Verificar Usuario Autenticado
```
Resultado esperado:
✅ Usuario autenticado: tu@email.com
ID: xxxxx-xxxxx-xxxxx-xxxxx
```

**Si falla**: "No hay usuario autenticado"
- Recarga la página
- Intenta login de nuevo

---

#### Test 3: Verificar Usuario en PR_USUARIOS ⚠️ **CRÍTICO**
```
Resultado esperado:
✅ Usuario encontrado en pr_usuarios:
{
  id_usuario: 123,
  email: "tu@email.com",
  id_perfil: 5,
  id_organizacion_principal: 1
}
```

**Si falla**: "Error buscando usuario tu@email.com"
- Tu usuario NO está registrado en la BD
- **SOLUCIÓN**: Ve a Supabase SQL Editor y ejecuta:

```sql
-- Opción A: Si es cliente (perfil 5)
INSERT INTO pr_usuarios (email, id_perfil, id_organizacion_principal) 
VALUES ('tu@email.com', 5, 1);

-- Opción B: Si es consultante (perfil 4)
INSERT INTO pr_usuarios (email, id_perfil, id_organizacion_principal) 
VALUES ('tu@email.com', 4, 1);

-- Opción C: Si no sabes qué perfil tienes
-- Primero verifica qué perfiles existen:
SELECT id_perfil, nombre_perfil FROM pr_sis_perfiles;
```

**Luego**: Recarga debug.html y vuelve a hacer Test 3

---

#### Test 4: Contar Tickets 📊
```
Resultado esperado:
✅ Total de tickets en BD: 5
```

**Si falla**: "Total de tickets en BD: 0"
- No hay datos en la tabla pr_tickets
- **SOLUCIÓN**: Necesitas crear tickets de prueba

---

#### Test 5: Listar Todos los Tickets 📋
```
Resultado esperado (ejemplo):
✅ Primeros 5 tickets:
[
  {
    "id_ticket": 1,
    "codigo_visual": "TKT-001",
    "titulo": "Bug en login",
    "id_solicitante": 123,
    "id_asignado": 456,
    "estado": "EN_PROCESO"
  },
  ...
]
```

**Si falla**: "No hay tickets en la base de datos"
- Usa el Script SQL de prueba para crear datos

---

#### Test 6: Listar Usuarios Registrados 👥
```
Resultado esperado:
✅ Total de usuarios: 2
[
  { id_usuario: 123, email: "tu@email.com", id_perfil: 5 },
  { id_usuario: 456, email: "otro@email.com", id_perfil: 4 }
]
```

**Si falla**: Lista vacía o no muestra tu usuario
- Tu usuario no está registrado (ver Test 3)

---

#### Test 7: Verificar Estructura de Tablas
```
Resultado esperado:
✅ Columnas de pr_tickets:
id_ticket, codigo_visual, titulo, id_solicitante, id_asignado, estado, ...

✅ Columnas de pr_usuarios:
id_usuario, email, id_perfil, id_organizacion_principal, ...
```

**Si falla**: Error mostrando columnas
- Hay un problema en el esquema de BD

---

### Paso 5: Si TODO Pasó ✅

¡Excelente! Ahora verifica que funcione en la aplicación real:

1. Ve a la pantalla de **Tickets**
2. Deberías ver tus tickets listados
3. Ve a **Validación**
4. Deberías ver tickets resueltos

**Si SIGUE sin funcionar**:
- Abre DevTools (F12)
- Ve a "Console"
- Busca los logs `[TICKETS]` o `[VALIDACION]`
- Comparte qué dice el último log

---

## 🐛 Crear Datos de Prueba

Si el Test 4 o 5 falla (no hay tickets), ejecuta este SQL en Supabase:

**Opción 1: Script automático (Recomendado)**
```
Archivo: sql_test_tickets.sql
- Ve a Supabase SQL Editor
- Copia y pega el contenido de sql_test_tickets.sql
- Haz clic en "Run"
```

**Opción 2: Manual**
```sql
-- Primero, obtener IDs de usuarios
SELECT id_usuario, email, id_perfil FROM pr_usuarios;

-- Luego, crear un ticket (reemplaza 123 y 456 por los IDs reales)
INSERT INTO pr_tickets (
    codigo_visual, titulo, id_solicitante, id_asignado, estado, prioridad
) VALUES (
    'TEST-001', 
    'Este es un ticket de prueba', 
    123,  -- ID del cliente (quien lo solicita)
    456,  -- ID del consultante (quien lo resuelve)
    'EN_PROCESO',
    'MEDIA'
);

-- Verificar
SELECT * FROM pr_tickets WHERE codigo_visual = 'TEST-001';
```

---

## 🔄 Flujo Completo Resumido

```
1. Abre debug.html
2. Haz Tests 1-3 (debe pasar todo)
3. Si Test 3 falla → Ejecuta INSERT en Supabase
4. Recarga debug.html
5. Si Tests 4-5 fallan → Ejecuta sql_test_tickets.sql
6. Prueba en app (Tickets y Validación)
7. Abre DevTools y busca logs [TICKETS] y [VALIDACION]
```

---

## 📞 Preguntas de Soporte

Cuando reportes un problema, incluye:

```
❓ ¿Qué test falló y qué error mostró?
❓ ¿Cuál es tu email (usuario)?
❓ ¿Qué resultado muestra "Verificar Usuario en PR_USUARIOS"?
❓ ¿Qué muestra "Contar Tickets"?
❓ ¿Hay errores rojos en la consola (F12)?
```

---

## ✅ Validación Final

Cuando TODO funcione, verifica:

- [ ] Test 3 muestra mi usuario con id_perfil correcto
- [ ] Veo tickets en la pantalla "Tickets"
- [ ] Veo validaciones en la pantalla "Validación"
- [ ] No hay errores rojos en Console (F12)
- [ ] Los logs [TICKETS] muestran éxito

---

**¿Listo?** 🚀 Abre [debug.html](debug.html) ahora y empieza con **Test 1**.
