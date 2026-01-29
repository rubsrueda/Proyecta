# Actualización: Gestión de Menús y Fix de Asignación

## 📋 Cambios Realizados

### 1. **Arreglo en `securityMatrix.js` - Asignación de Menús**

**Problema:**
- Los menús NO se guardaban al asignarlos a un perfil
- El flujo obligaba a elegir una pantalla inmediatamente para que se guardara el menú
- Error de UX: No permitía menús "vacíos" temporalmente

**Solución:**
✅ **Asignación automática de pantalla por defecto**
- Al asignar un menú a un perfil, el sistema ahora automáticamente:
  1. Obtiene la primera pantalla disponible (clave_nombre ordenado alfabéticamente)
  2. Crea la relación `pr_sis_permisos_arbol` con esa pantalla por defecto
  3. **Guarda el menú** en la BD inmediatamente
  4. Selecciona automáticamente el menú para que veas sus pantallas

**Ventaja:**
- Los menús ahora se guardan al seleccionarlos
- El usuario puede luego cambiar la pantalla por defecto si quiere
- Si no hay pantallas disponibles, muestra un mensaje claro indicando que cree pantallas primero

---

### 2. **Nueva Pantalla: Mantenimiento de Menús (`menuCatalog.js`)**

**Propósito:**
Permitir a los administradores crear, editar y eliminar menús del catálogo central, sin afectar su asignación a perfiles.

**Características:**

#### ✅ Crear Menú
- Ingresa el código del menú (ej: "FINANZAS", "OPERACION")
- Se crea con icono por defecto "settings"
- Se puede editar inmediatamente después

#### ✅ Editar Menú
Campos editables:
- **Código**: Identificador único (ej: FINANZAS)
- **Descripción**: Texto breve (ej: "Gestión de Contratos y Tarifas")
- **Orden**: Número para controlar el orden de aparición (1, 2, 3...)
- **Icono**: Selector visual con 20+ iconos de Material Symbols

#### ✅ Eliminar Menú
- Eliminación en cascada:
  1. Elimina todos los permisos (`pr_sis_permisos_arbol`) asociados al menú
  2. Elimina el menú del catálogo
- Requiere confirmación del usuario

#### ✅ Selector de Icono Interactivo
- Grid visual con 20 iconos comunes:
  - dashboard, settings, person, group, description
  - attach_money, trending_up, support_agent, build, assignment
  - calendar_month, schedule, people, assessment, notifications
  - task, shopping_cart, library_books, info, favorite

**Flujo de Trabajo:**

```
1. Ve a "Mantenimiento de Menús"
2. Haz clic en "+ Crear Menú"
3. Ingresa código (ej: "FINANZAS")
4. Se abre el editor automáticamente
5. Edita: Descripción, Orden, Icono
6. Haz clic en "Guardar Cambios"
7. El menú se actualiza inmediatamente
8. Vuelve a "Arquitectura de Perfiles" y asigna menús a perfiles
```

**Interfaz:**
- Columna izquierda: Listado de menús con iconos
- Columna derecha: Editor con formulario y selector de icono
- Botones: "+ Crear Menú" (abajo), "Guardar", "Cancelar"
- Feedback: Mensajes de éxito/error en tiempo real

---

## 🔄 Flujo Integrado: De Menús a Perfiles

### Paso 1: Crear Menús (menuCatalog.js)
```
Mentenimiento de Menús
  ├─ Crear "FINANZAS" (icono: attach_money)
  ├─ Crear "OPERACION" (icono: settings)
  └─ Crear "SOPORTE" (icono: support_agent)
```

### Paso 2: Crear Perfiles (securityMatrix.js - Columna 1)
```
Arquitectura de Perfiles
  ├─ Crear perfil "Admin"
  ├─ Crear perfil "Usuario"
  └─ Crear perfil "Consultor"
```

### Paso 3: Asignar Menús a Perfiles (securityMatrix.js - Columna 2)
```
Para perfil "Admin":
  + Asignar Menú
    → Seleccionar "FINANZAS"
    → ✅ SE GUARDA AUTOMÁTICAMENTE
    → Se asigna con pantalla por defecto

Para perfil "Usuario":
  + Asignar Menú
    → Seleccionar "SOPORTE"
    → ✅ SE GUARDA AUTOMÁTICAMENTE
```

### Paso 4: Gestionar Pantallas (securityMatrix.js - Columna 3)
```
Para "Admin" → "FINANZAS":
  + Asignar Pantalla
    → Agregar "Alta de Contratos"
    → Cambiar nivel: "Ver" → "Edit"
    → Agregar "Tarifas"
    → Cambiar nivel a "Full"
    → Eliminar si es necesario (✕)
```

---

## 🐛 Problemas Resueltos

| Problema | Antes | Ahora |
|----------|-------|-------|
| Menús no se guardaban | ❌ Obligaba elegir pantalla primero | ✅ Se guardan al asignarlos |
| No había forma de crear menús | ❌ Solo lectura | ✅ `menuCatalog.js` permite CRUD |
| Cambiar detalles de menú | ❌ No era posible | ✅ Editor con campos y selector icono |
| Eliminar menús | ❌ No era posible | ✅ Con cascada a permisos |
| Icono fijo en menús | ❌ Siempre "settings" | ✅ Selector visual con 20+ opciones |
| Ordenamiento de menús | ❌ Por defecto | ✅ Campo "orden" editable |

---

## 📝 Datos Requeridos en BD

Tablas que el sistema ahora maneja:

### `pr_sis_menus`
```sql
id_menu          (PK)
codigo_menu      (Unique) -- "FINANZAS", "SOPORTE", etc.
descripcion      -- Texto opcional
orden            -- Entero para ordenar (1, 2, 3...)
icono            -- String con nombre de icono Material Symbols
```

### `pr_sis_permisos_arbol`
```sql
id_permiso       (PK)
id_perfil        (FK → pr_sis_perfiles)
id_menu          (FK → pr_sis_menus)
id_pantalla      (FK → pr_sis_pantallas)
nivel_acceso     (1=Ver, 2=Edit, 3=Full)
orden_pantalla   -- Opcional
```

### `pr_sis_perfiles`
```sql
id_perfil        (PK)
nombre_perfil    -- "Admin", "Usuario", "Consultor"
```

### `pr_sis_pantallas`
```sql
id_pantalla      (PK)
clave_nombre     -- "PAN_TICKET_ALTA", etc.
ruta_archivo     -- "ticketCreate.js"
```

---

## 🧪 Cómo Probar

### Test 1: Crear Menús
- [ ] Ve a "Mantenimiento de Menús"
- [ ] Crea menú "TEST_MENU_1"
- [ ] Edita: Descripción = "Menú de Prueba", Orden = 1, Icono = "dashboard"
- [ ] Haz clic "Guardar Cambios"
- [ ] Verifica que aparece actualizado en la lista

### Test 2: Asignar Menú a Perfil
- [ ] Ve a "Arquitectura de Perfiles"
- [ ] Crea perfil "ADMIN_TEST"
- [ ] Selecciona el perfil
- [ ] "+ Asignar Menú" → Selecciona "TEST_MENU_1"
- [ ] ✅ Debería aparecer automáticamente en Columna 2
- [ ] Columna 3 muestra la pantalla por defecto

### Test 3: Cambiar Pantalla
- [ ] Con el menú seleccionado, "+ Asignar Pantalla"
- [ ] Agrega una pantalla diferente
- [ ] Cambia nivel de acceso (Ver → Edit)
- [ ] Verifica que se guarda

### Test 4: Eliminar en Cascada
- [ ] Elimina el menú desde "Mantenimiento de Menús"
- [ ] Verifica que las asignaciones se eliminan desde "Arquitectura"
- [ ] Recarga la página - no debe haber datos huérfanos

---

## 🎨 Interfaz y UX

### menuCatalog.js
```
┌─ Mentenimiento de Menús ─────────────────────────────────┐
│ Gestiona el catálogo de menús disponibles...             │
├─────────────────────────┬─────────────────────────────────┤
│ Menús Disponibles       │ Editor de Menú                  │
├─────────────────────────┼─────────────────────────────────┤
│                         │                                 │
│ 📊 FINANZAS             │ Código: [FINANZAS         ]     │
│ 📋 OPERACION            │ Desc: [Gestión Financiera ]     │
│ 🎯 SOPORTE              │ Orden: [1            ]          │
│                         │                                 │
│ + Crear Menú            │ Icono:                          │
│                         │ ┌─┬─┬─┬─┬─┬─┐                   │
│                         │ │📊│⚙️│👤│👥│📄│...│              │
│                         │ └─┴─┴─┴─┴─┴─┘                   │
│                         │                                 │
│                         │ [Guardar Cambios] [Cancelar]    │
└─────────────────────────┴─────────────────────────────────┘
```

---

## 📌 Próximos Pasos Recomendados

- [ ] Crear pantalla de mantenimiento de **Pantallas** (similar a menuCatalog.js)
- [ ] Ordenamiento drag-and-drop en menuCatalog.js
- [ ] Búsqueda/filtro en listados de menús
- [ ] Validación de códigos únicos en menús
- [ ] Exportar/importar configuración de menús

---

## 🚀 Resumen Rápido

**securityMatrix.js (Arreglado):**
- ✅ Los menús ahora se guardan automáticamente
- ✅ Se asignan con una pantalla por defecto
- ✅ Mejor feedback de errores

**menuCatalog.js (Nuevo):**
- ✅ CRUD completo de menús
- ✅ Editor con selector de icono visual
- ✅ Eliminación en cascada
- ✅ Interfaz clara y responsive
