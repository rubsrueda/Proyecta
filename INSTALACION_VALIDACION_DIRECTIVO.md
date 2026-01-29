# 📋 Pasos para Instalar: Pantalla de Validación para Directivos

## 1️⃣ Registrar la Pantalla en el Catálogo

Ejecuta este SQL en Supabase:

```sql
-- Insertar la nueva pantalla en el catálogo
INSERT INTO pr_sis_pantallas (codigo_pantalla, nombre_pantalla, ruta_archivo, descripcion)
VALUES (
    'PAN_VALIDACION_DIRECTIVO',
    'Validación General - Directivo',
    'ticketValidationDirective.js',
    'Pantalla para directivos/administradores. Ver y validar todos los tickets resueltos.'
)
ON CONFLICT (codigo_pantalla) DO NOTHING;
```

---

## 2️⃣ Asignar Permisos por Perfil

### Para Clientes (Mantener acceso a su pantalla)

```sql
-- Clientes ven SOLO su pantalla de validación
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    p.id_perfil,
    m.id_menu,
    pan.id_pantalla,
    1  -- Nivel 1: Ver
FROM pr_sis_perfiles p
CROSS JOIN pr_sis_menus m
CROSS JOIN pr_sis_pantallas pan
WHERE p.nombre_perfil = 'Cliente'
  AND m.codigo_menu = 'SOPORTE'
  AND pan.codigo_pantalla = 'PAN_VALIDACION_SOP'
ON CONFLICT DO NOTHING;
```

### Para Directivos/Administradores (Nueva pantalla)

```sql
-- Directivos ven la pantalla de validación general
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    p.id_perfil,
    m.id_menu,
    pan.id_pantalla,
    3  -- Nivel 3: Full (acceso a todo)
FROM pr_sis_perfiles p
CROSS JOIN pr_sis_menus m
CROSS JOIN pr_sis_pantallas pan
WHERE p.nombre_perfil = 'Administrador'
  AND m.codigo_menu = 'SOPORTE'
  AND pan.codigo_pantalla = 'PAN_VALIDACION_DIRECTIVO'
ON CONFLICT DO NOTHING;
```

---

## 3️⃣ Verificar que Funciona

### Paso A: Acceder como Cliente
1. Inicia sesión con un usuario cliente
2. En el menú SOPORTE, deberías ver **"Validación de Cierres"** (PAN_VALIDACION_SOP)
3. Solo verás **tus propios tickets**

### Paso B: Acceder como Directivo
1. Inicia sesión con un usuario administrador
2. En el menú SOPORTE, deberías ver **"Validación General - Directivo"** (PAN_VALIDACION_DIRECTIVO)
3. Verás **TODOS los tickets** del sistema
4. Verás **estadísticas** (total de tickets, clientes, equipos)
5. Podrás **filtrar** y **ordenar** tickets

---

## 🎯 Diferencias Entre Pantallas

| Característica | Cliente | Directivo |
|---|---|---|
| **Código Pantalla** | PAN_VALIDACION_SOP | PAN_VALIDACION_DIRECTIVO |
| **Nivel Acceso** | 1 (Ver) | 3 (Full) |
| **Ve tickets de:** | Solo propios | TODOS |
| **Filtrado por:** | id_solicitante | Sin filtro |
| **Estadísticas** | No | Sí |
| **Notas auditoría** | No | Sí |
| **Validación** | Simple (estrellas) | Avanzada (auditoría) |

---

## 📱 Pantalla Cliente (PAN_VALIDACION_SOP)

```javascript
// Filtro: Solo tickets que ÉL solicitó
query = query.eq('id_solicitante', userId);

// Aprobación: Califica con estrellas (1-5)
// Modal simple sin auditoría
```

---

## 📊 Pantalla Directivo (PAN_VALIDACION_DIRECTIVO)

```javascript
// Filtro: Sin filtro, VE TODOS
// query = query  (sin .eq() adicional)

// Estadísticas:
// - Total pendientes
// - Clientes únicos
// - Equipos responsables

// Aprobación: Con campos de auditoría
// Modal avanzado para notas
```

---

## ✅ Checklist de Implementación

- [x] Crear `ticketValidationDirective.js`
- [ ] Ejecutar SQL para registrar pantalla en catálogo
- [ ] Ejecutar SQL para asignar permisos a cliente (PAN_VALIDACION_SOP, nivel 1)
- [ ] Ejecutar SQL para asignar permisos a directivo (PAN_VALIDACION_DIRECTIVO, nivel 3)
- [ ] Testear como cliente → ver solo sus tickets
- [ ] Testear como directivo → ver todos los tickets + estadísticas
- [ ] Validar en móvil (responsive)

---

## 🚀 Cómo Probar en Local

### 1. Con usuario cliente
```bash
# Login como cliente
# Ir a SOPORTE → Validación de Cierres
# Deberías ver solo tus tickets
```

### 2. Con usuario directivo
```bash
# Login como admin/directivo
# Ir a SOPORTE → Validación General - Directivo
# Deberías ver TODOS los tickets + estadísticas
```

---

## 🔍 Si Algo No Funciona

### Pantalla no aparece en el menú
```sql
-- Verificar que el permiso está creado
SELECT * FROM pr_sis_permisos_arbol pa
WHERE pa.id_pantalla = (
    SELECT id_pantalla FROM pr_sis_pantallas 
    WHERE codigo_pantalla = 'PAN_VALIDACION_DIRECTIVO'
)
AND pa.id_perfil = (
    SELECT id_perfil FROM pr_sis_perfiles 
    WHERE nombre_perfil = 'Administrador'
);
```

### Usuario no tiene acceso
```sql
-- Verificar que la pantalla existe en el catálogo
SELECT * FROM pr_sis_pantallas 
WHERE codigo_pantalla = 'PAN_VALIDACION_DIRECTIVO';

-- Verificar que está en permisos_arbol
SELECT COUNT(*) FROM pr_sis_permisos_arbol 
WHERE id_pantalla = (
    SELECT id_pantalla FROM pr_sis_pantallas 
    WHERE codigo_pantalla = 'PAN_VALIDACION_DIRECTIVO'
);
```

### Los tickets no aparecen
```javascript
// Abre la consola (F12) y verifica logs:
// [VALIDACION DIRECTIVO] Cargando tickets con acceso total
// [VALIDACION DIRECTIVO] Tickets obtenidos: X Error: null
```

---

## 📝 Notas Importantes

1. **Seguridad:** La pantalla de directivo solo aparece para nivel 3
2. **Base de datos:** Se usa la misma tabla `pr_tickets`, solo cambia el filtro
3. **Responsive:** Ambas pantallas funcionan en móvil
4. **Sin rotura:** El cliente sigue con su pantalla, el directivo tiene una nueva

