# 🚀 Guía Rápida: Alta de Pantalla menuCatalog.js

## Opción 1: SQL Directo en Supabase (Recomendado)

### Paso 1: Abrir SQL Editor en Supabase
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: `wwafeitljxnlvmjtwsjz`
3. En el menú lateral, haz clic en **"SQL Editor"**
4. Crea una nueva query

### Paso 2: Ejecutar el INSERT
Copia y pega este SQL:

```sql
INSERT INTO pr_sis_pantallas (
    codigo_pantalla,
    clave_nombre,
    ruta_archivo
) VALUES (
    'PAN_MENU_CATALOG',
    'Mantenimiento de Menús',
    'menuCatalog.js'
);
```

### Paso 3: Verificar
```sql
SELECT * FROM pr_sis_pantallas 
WHERE codigo_pantalla = 'PAN_MENU_CATALOG';
```

**Resultado esperado:**
```
id_pantalla | codigo_pantalla    | clave_nombre              | ruta_archivo
------------+--------------------+---------------------------+---------------
XX          | PAN_MENU_CATALOG   | Mantenimiento de Menús    | menuCatalog.js
```

---

## Opción 2: Desde la Aplicación Web (Visual)

### Prerequisito: Necesitas un menú de "Configuración"

Si no existe, créalo primero:

```sql
INSERT INTO pr_sis_menus (
    codigo_menu,
    descripcion,
    icono,
    orden
) VALUES (
    'CONFIGURACION',
    'Configuración del Sistema',
    'settings',
    100
);
```

### Pasos en la App:

1. **Ejecuta SOLO el Paso 2 del SQL anterior** (INSERT de la pantalla)

2. **Abre la aplicación:**
   ```
   http://localhost:8000/app.html
   ```

3. **Ve a "Arquitectura de Perfiles"**
   - (Si no aparece en el menú, es porque el perfil actual no tiene acceso)

4. **Asigna la pantalla:**
   - Selecciona tu perfil (ej: "Administrador")
   - Haz clic en "+ Asignar Menú"
   - Selecciona "CONFIGURACION"
   - Se abre automáticamente el selector de pantallas
   - Busca "Mantenimiento de Menús"
   - ¡Listo! Ahora aparecerá en tu menú

---

## Opción 3: Script Completo (Todo Automatizado)

Si quieres hacerlo todo de una vez:

```sql
-- 1. Crear menú de configuración (si no existe)
INSERT INTO pr_sis_menus (
    codigo_menu,
    descripcion,
    icono,
    orden
) VALUES (
    'CONFIGURACION',
    'Configuración del Sistema',
    'settings',
    100
)
ON CONFLICT (codigo_menu) DO NOTHING;

-- 2. Insertar la pantalla
INSERT INTO pr_sis_pantallas (
    codigo_pantalla,
    clave_nombre,
    ruta_archivo
) VALUES (
    'PAN_MENU_CATALOG',
    'Mantenimiento de Menús',
    'menuCatalog.js'
)
ON CONFLICT (codigo_pantalla) DO NOTHING;

-- 3. Asignar a perfil administrador
-- IMPORTANTE: Reemplaza 'Administrador' con el nombre exacto de tu perfil
INSERT INTO pr_sis_permisos_arbol (
    id_perfil,
    id_menu,
    id_pantalla,
    nivel_acceso,
    orden_menu,
    orden_pantalla
)
SELECT 
    p.id_perfil,
    m.id_menu,
    pan.id_pantalla,
    3,  -- Nivel 3 = Full access
    100,
    10
FROM pr_sis_perfiles p
CROSS JOIN pr_sis_menus m
CROSS JOIN pr_sis_pantallas pan
WHERE p.nombre_perfil = 'Administrador'  -- ⚠️ AJUSTA ESTE NOMBRE
  AND m.codigo_menu = 'CONFIGURACION'
  AND pan.codigo_pantalla = 'PAN_MENU_CATALOG'
ON CONFLICT DO NOTHING;
```

### Verificación Final:
```sql
SELECT 
    prof.nombre_perfil,
    m.codigo_menu AS menu,
    pan.clave_nombre AS pantalla,
    CASE perm.nivel_acceso
        WHEN 1 THEN 'Ver'
        WHEN 2 THEN 'Editar'
        WHEN 3 THEN 'Full'
    END AS acceso
FROM pr_sis_permisos_arbol perm
JOIN pr_sis_perfiles prof ON perm.id_perfil = prof.id_perfil
JOIN pr_sis_menus m ON perm.id_menu = m.id_menu
JOIN pr_sis_pantallas pan ON perm.id_pantalla = pan.id_pantalla
WHERE pan.codigo_pantalla = 'PAN_MENU_CATALOG';
```

**Resultado esperado:**
```
nombre_perfil  | menu           | pantalla                  | acceso
---------------+----------------+---------------------------+-------
Administrador  | CONFIGURACION  | Mantenimiento de Menús    | Full
```

---

## ⚠️ Troubleshooting

### Error: "duplicate key value violates unique constraint"
- La pantalla ya existe
- Ejecuta solo: `SELECT * FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MENU_CATALOG';`

### Error: "column X does not exist"
- Tu tabla tiene nombres diferentes
- Ejecuta: `SELECT * FROM pr_sis_pantallas LIMIT 1;`
- Ajusta los nombres de columna en el script

### La pantalla no aparece en el menú
1. Verifica que se insertó: `SELECT * FROM pr_sis_pantallas WHERE codigo_pantalla = 'PAN_MENU_CATALOG';`
2. Verifica que está asignada: Ejecuta la query de verificación final
3. **Recarga la página** (Ctrl+Shift+R o Cmd+Shift+R)
4. Si aún no aparece, cierra sesión y vuelve a entrar

### No tengo perfil "Administrador"
1. Ve a "Arquitectura de Perfiles"
2. Crea un perfil llamado "Administrador"
3. Asígnale el menú y la pantalla manualmente

---

## 📝 Nombres de Perfiles Comunes

Si no sabes el nombre exacto de tu perfil, ejecuta:

```sql
SELECT id_perfil, nombre_perfil FROM pr_sis_perfiles ORDER BY nombre_perfil;
```

Nombres comunes:
- `Administrador`
- `Admin`
- `Superadmin`
- `Sistema`
- `Root`

Reemplaza en el script donde dice `'Administrador'` con el valor correcto.

---

## ✅ Checklist

- [ ] Ejecuté el INSERT de la pantalla
- [ ] Verifiqué que existe con SELECT
- [ ] Creé/verifiqué que existe menú "CONFIGURACION"
- [ ] Asigné la pantalla al perfil (SQL o desde app)
- [ ] Recargué la página
- [ ] La pantalla aparece en mi menú lateral

Si completaste todos los pasos, deberías ver **"Mantenimiento de Menús"** en tu menú de configuración. 🎉
