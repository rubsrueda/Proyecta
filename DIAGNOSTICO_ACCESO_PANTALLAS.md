# 🔍 Diagnóstico: Por Qué No Tienes Acceso a una Pantalla

## El Problema
Ves una pantalla en el menú lateral **pero cuando intentas entrar te dice "Acceso Denegado"**.

---

## Las Validaciones de Acceso (En Este Orden)

### 1️⃣ **VALIDACIÓN EN ROUTER** - `Security.canAccess(screenCode)`
**Archivo:** [js/core/router.js](js/core/router.js#L39)

```javascript
if (Security && !Security.canAccess(screenCode)) {
    // BLOQUEA: "No tienes permisos para ver: PAN_TICKET_LIST"
}
```

**¿Qué valida?**
- Busca en `State.screenMap[screenCode]`
- Si no existe → **ACCESO DENEGADO**

---

### 2️⃣ **¿DE DÓNDE VIENE `State.screenMap`?**
**Archivo:** [js/app.js](js/app.js#L102-L120)

```javascript
// Se llena en loadFullContext() → línea 102
const { data: permisos, error: errPerm } = await supabase
    .from('pr_sis_permisos_arbol')
    .select(`
        nivel_acceso,
        pr_sis_pantallas ( codigo_pantalla, ruta_archivo )
    `)
    .eq('id_perfil', usuario.id_perfil_defecto);

permisos.forEach(p => {
    if (p.pr_sis_pantallas) {
        State.screenMap[p.pr_sis_pantallas.codigo_pantalla] = {
            level: p.nivel_acceso,
            file: p.pr_sis_pantallas.ruta_archivo
        };
    }
});
```

---

## 🔧 Checklist: ¿Por Qué No Tengo Acceso?

### ❌ **Caso 1: La Pantalla Aparece en el Menú PERO No Puedo Entrar**

**Esto significa:**
✅ Existe un registro en `pr_sis_permisos_arbol` (por eso aparece en menú)  
❌ PERO **falta uno de los datos**:

#### Posibilidades:

| Problema | Ubicación BD | Solución |
|----------|-------------|----------|
| La pantalla NO existe en `pr_sis_pantallas` | `pr_sis_permisos_arbol` → `id_pantalla` → apunta a nada | Asegúrate que la pantalla esté en `pr_sis_pantallas` |
| El registro en permisos está DAÑADO | La fila en `pr_sis_permisos_arbol` tiene `id_pantalla = NULL` | DELETE esa fila y vuelve a crear el permiso |
| Tu perfil tiene otro perfil por defecto | `pr_usuarios.id_perfil_defecto` apunta a otro | Cambia tu `id_perfil_defecto` al correcto |
| La relación con `pr_sis_pantallas` es NULL | Foreign key NO está configurada | Verifica que `id_pantalla` sea válido en la tabla |

---

## 🛠️ SQL para Diagnosticar

### **1. Verifica tu perfil por defecto**
```sql
SELECT id_usuario, email, id_perfil_defecto, nombre_completo
FROM pr_usuarios
WHERE email = 'tu@email.com';
```
📌 **Nota el `id_perfil_defecto`**

---

### **2. Verifica qué pantallas tienes asignadas**
```sql
SELECT 
    pa.id_permiso,
    pa.id_perfil,
    pa.id_pantalla,
    pa.nivel_acceso,
    ps.codigo_pantalla,
    ps.ruta_archivo
FROM pr_sis_permisos_arbol pa
LEFT JOIN pr_sis_pantallas ps ON pa.id_pantalla = ps.id_pantalla
WHERE pa.id_perfil = 'TU_ID_PERFIL_AQUI'
ORDER BY ps.codigo_pantalla;
```

**Resultado esperado:**
- Ves todas las pantallas a las que DEBERÍAS tener acceso
- Para cada una, `ps.codigo_pantalla` y `ps.ruta_archivo` **NO deben ser NULL**

---

### **3. Si una pantalla falla, verifica que exista en el catálogo**
```sql
SELECT id_pantalla, codigo_pantalla, ruta_archivo, nombre_pantalla
FROM pr_sis_pantallas
WHERE codigo_pantalla = 'PAN_TICKET_LIST';  -- Cambia por tu pantalla
```

**Si no existe:**
```sql
INSERT INTO pr_sis_pantallas (codigo_pantalla, nombre_pantalla, ruta_archivo)
VALUES ('PAN_TICKET_LIST', 'Listado de Tickets', 'ticketList.js');
```

---

### **4. Si la relación está rota, repara el permiso**

**Primero, identifica el problema:**
```sql
SELECT pa.id_permiso, pa.id_perfil, pa.id_pantalla, ps.codigo_pantalla
FROM pr_sis_permisos_arbol pa
LEFT JOIN pr_sis_pantallas ps ON pa.id_pantalla = ps.id_pantalla
WHERE pa.id_perfil = 'TU_ID_PERFIL'
AND ps.codigo_pantalla IS NULL;  -- ⚠️ Datos huérfanos
```

**Borra y recrea:**
```sql
-- Borra los permisos rotos
DELETE FROM pr_sis_permisos_arbol
WHERE id_pantalla NOT IN (SELECT id_pantalla FROM pr_sis_pantallas);

-- Luego asigna correctamente
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    'TU_ID_PERFIL',
    m.id_menu,
    p.id_pantalla,
    1  -- Nivel Ver
FROM pr_sis_pantallas p
CROSS JOIN pr_sis_menus m
WHERE p.codigo_pantalla = 'PAN_TICKET_LIST'
AND m.codigo_menu = 'SOPORTE';
```

---

## 🔄 Flujo de Validación en Resumen

```
1. Login → Usuario en Supabase Auth ✅
2. Cargar perfil → pr_usuarios ✅
3. Cargar permisos → pr_sis_permisos_arbol ✅
4. Construir screenMap → (relación LEFT JOIN a pr_sis_pantallas)
   ├─ Si id_pantalla existe → ✅ Se añade a screenMap
   └─ Si id_pantalla es NULL → ❌ No se añade (ACCESO DENEGADO)
5. Renderizar menú → MenuService filtra screenMap ✅
6. Navegar a pantalla → Router verifica screenMap
   ├─ Si existe → ✅ Carga la pantalla
   └─ Si no existe → ❌ "Acceso Denegado"
```

---

## 📱 Cómo Ver Qué Está en screenMap (DEBUG)

En la consola del navegador (F12):
```javascript
console.log(State.screenMap);
```

Resultado:
```javascript
{
  "PAN_TICKET_LIST": { level: 1, file: "ticketList.js" },
  "PAN_DASHBOARD": { level: 1, file: "dashboard.js" },
  // ... si ves tu pantalla aquí, el problema es OTRO
}
```

**Si tu pantalla NO está aquí:**
- ❌ El problema está en `pr_sis_permisos_arbol` o `pr_sis_pantallas`
- ✅ La validación está correcta

---

## 🎯 Pasos Rápidos

### **Si ves la pantalla en el menú pero no puedes entrar:**

1. **Abre la Consola** (F12)
2. **Ejecuta:** `console.log(State.screenMap)`
3. **¿Está tu pantalla?**
   - ✅ SÍ → Scroll al final de este documento
   - ❌ NO → Ejecuta los SQL del diagnóstico

4. **Si no está en screenMap:**
   ```sql
   -- Busca por código de pantalla
   SELECT * FROM pr_sis_permisos_arbol
   WHERE id_perfil = 'TU_PERFIL'
   AND id_pantalla = (
       SELECT id_pantalla FROM pr_sis_pantallas 
       WHERE codigo_pantalla = 'PAN_TICKET_LIST'
   );
   ```

5. **Si el resultado está vacío:**
   - Falta el permiso → Crea un nuevo registro en `pr_sis_permisos_arbol`

6. **Si existe el permiso pero `id_pantalla` es NULL:**
   - Pantalla no existe en catálogo → Créala en `pr_sis_pantallas`

---

## ⚠️ Otros Problemas Posibles

### **El screenMap Tiene la Pantalla PERO Sigue Bloqueado**

Esto es MUY raro, pero podría ser:

1. **El Security.js no carga correctamente:**
   ```javascript
   // En app.js, línea 80
   import { Security } from './core/security.js'; // ¿Existe este import?
   ```

2. **El router tiene un bug:**
   ```javascript
   if (Security && !Security.canAccess(screenCode)) {
       // ¿Qué valor retorna canAccess()?
       console.log('DEBUG:', screenCode, State.screenMap[screenCode]);
   }
   ```

### **Solución:**
Abre [js/core/router.js](js/core/router.js#L39) y agrega logs:
```javascript
console.log('[SECURITY CHECK]', {
    screenCode,
    inMap: !!State.screenMap[screenCode],
    level: State.screenMap[screenCode]?.level
});
```

---

## 📞 Resumen Rápido

**Si tienes acceso en el menú pero no puedes entrar:**

```
Menu Lateral: ✅ Aparece
Estado screenMap: ¿?

→ Abre Consola (F12)
→ console.log(State.screenMap)
→ ¿Ves tu pantalla?
  - NO → Problema en BD (permisos o catálogo)
  - SÍ → Problema en el código (Security.js o Router)
```

**Para la BD, ejecuta:**
```sql
SELECT pa.id_pantalla, ps.codigo_pantalla, ps.ruta_archivo, pa.nivel_acceso
FROM pr_sis_permisos_arbol pa
LEFT JOIN pr_sis_pantallas ps ON pa.id_pantalla = ps.id_pantalla
WHERE pa.id_perfil = 'TU_PERFIL_ID'
AND (ps.codigo_pantalla IS NULL OR ps.ruta_archivo IS NULL);
```

Si salen resultados → **Los datos en BD están rotos, repáralo con los SQL arriba.**

