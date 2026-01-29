# 🔍 Guía de Debug - Diagnóstico de Tickets

## Problema Actual
Las pantallas de **Tickets** y **Validación** no muestran datos, aunque el código de filtrado parece estar correcto.

## Causas Potenciales
1. **BD vacía**: No hay datos en tabla `pr_tickets`
2. **Usuarios no registrados**: El usuario autenticado no existe en `pr_usuarios`
3. **Columnas incorrectas**: Las columnas esperadas no existen o tienen nombres distintos
4. **RLS activo**: Supabase RLS (Row Level Security) está bloqueando acceso a datos
5. **Perfil no configurado**: El usuario existe pero no tiene `id_perfil` asignado

## Cómo Debuggear

### Opción 1: Usar archivo debug.html (Recomendado)
```bash
# Abre en el navegador:
# http://localhost:5000/debug.html  (o tu URL local)
# o
# https://rubsrueda.github.io/Proyecta/debug.html (en producción)
```

1. **Abre el navegador** y ve a `debug.html`
2. **Inicia sesión** con tu usuario (Google OAuth)
3. **Ejecuta las pruebas** en orden:
   - ✅ Probar Conexión Supabase
   - ✅ Verificar Usuario Autenticado
   - ✅ Verificar Usuario en PR_USUARIOS
   - ✅ Contar Tickets
   - ✅ Listar Todos los Tickets
   - ✅ Listar Usuarios Registrados
   - ✅ Verificar Estructura de Tablas

### Opción 2: Consola del Navegador
1. Abre DevTools (F12)
2. Ve a la pantalla de Tickets o Validación
3. Busca los logs con prefijo `[TICKETS]` o `[VALIDACION]`
4. Verifica qué paso está fallando

### Opción 3: Consultas Directas en Supabase
```sql
-- 1. Verificar si hay tickets
SELECT COUNT(*) as total_tickets FROM pr_tickets;

-- 2. Ver todos los tickets
SELECT id_ticket, codigo_visual, titulo, id_solicitante, id_asignado, estado 
FROM pr_tickets LIMIT 10;

-- 3. Verificar usuarios
SELECT id_usuario, email, id_perfil, id_organizacion_principal 
FROM pr_usuarios;

-- 4. Ver si el usuario actual está registrado (reemplaza 'tu@email.com')
SELECT * FROM pr_usuarios WHERE email = 'tu@email.com';

-- 5. Ver tickets para un usuario específico (reemplaza 123)
SELECT * FROM pr_tickets WHERE id_solicitante = 123 OR id_asignado = 123;
```

## Qué Buscar en los Logs

### ✅ Caso Exitoso
```
[TICKETS] Usuario autenticado: usuario@ejemplo.com
[TICKETS] Usuario encontrado: { id_usuario: 123, id_perfil: 5 }
[TICKETS] Filtrando como CLIENTE - solicitante: 123
[TICKETS] Tickets cargados: 3
```

### ❌ Caso Fallido - Usuario No Encontrado
```
[TICKETS] Usuario autenticado: usuario@ejemplo.com
[TICKETS] Error buscando usuario: ...
```
**Solución**: El usuario existe en OAuth pero no en `pr_usuarios`. Ejecuta en Supabase:
```sql
INSERT INTO pr_usuarios (email, id_perfil, id_organizacion_principal)
VALUES ('usuario@ejemplo.com', 5, 1)
RETURNING *;
```

### ❌ Caso Fallido - Perfil No Configurado
```
[TICKETS] Usuario encontrado: { id_usuario: 123, id_perfil: null }
```
**Solución**: Actualiza el perfil del usuario:
```sql
UPDATE pr_usuarios SET id_perfil = 5 WHERE id_usuario = 123;
```

### ❌ Caso Fallido - Sin Tickets
```
[TICKETS] Filtrando como CLIENTE - solicitante: 123
[TICKETS] Tickets cargados: 0
```
**Posible Solución**: 
- No hay tickets creados para ese usuario
- O el usuario está como consultante (perfil 4) pero busca como cliente
- O la BD está vacía

## Estructura de Datos Esperada

### pr_usuarios
| id_usuario | email | id_perfil | id_organizacion_principal |
|---|---|---|---|
| 1 | jefe@empresa.com | 1 | 1 |
| 2 | consultor@empresa.com | 4 | 1 |
| 3 | cliente@empresa.com | 5 | 1 |

### pr_tickets
| id_ticket | codigo_visual | titulo | id_solicitante | id_asignado | estado |
|---|---|---|---|---|---|
| 1 | TKT-001 | Bug login | 3 | 2 | EN_PROCESO |
| 2 | TKT-002 | Mejora UI | 3 | 2 | RESUELTO |

**Para Clientes (perfil 5)**: Ven tickets donde `id_solicitante = su_id_usuario`
**Para Consultantes (perfil 4)**: Ven tickets donde `id_asignado = su_id_usuario`

## Cambios Realizados en Esta Sesión

### ticketValidation.js
✅ Agregado diagnóstico de perfil
✅ Filtrado dinámico según perfil (cliente vs consultante)
✅ Logs detallados para debugging

### debug.html (NUEVO)
✅ Herramienta visual para diagnosticar problemas
✅ Pruebas progresivas desde conexión hasta datos
✅ Muestra estructura de tablas

## Próximos Pasos

1. **Abre `/debug.html`** en tu navegador
2. **Ejecuta todas las pruebas** y anota los resultados
3. **Identifica dónde falla** la cadena (conexión → autenticación → BD → datos)
4. **Reporta los logs** al desarrollador si falla algún paso

## Preguntas para Ayudarte

Cuando reportes un problema, incluye:
1. ¿Qué test falló primero?
2. ¿Cuál es el mensaje de error exacto?
3. ¿Con qué usuario (email) estás probando?
4. ¿El usuario fue creado en Google OAuth?
5. ¿Se ejecutó el SQL `sql_setup_perfiles_completo.sql`?
