# 🔧 Refactorización: ticketValidation.js - De Perfiles Hardcodeados a Matriz de Seguridad

## ❌ El Problema Anterior

La pantalla `ticketValidation.js` tenía esta lógica terrible:

```javascript
if (userProfile === 5) {
    // Perfil Cliente
    query = query.eq('id_solicitante', userId);
} else if (userProfile === 3) {
    // Perfil Gerente
    // Sin filtro, ve todos
} else {
    // Acceso denegado
    return;
}
```

**Problemas:**

1. **IDs hardcodeados**: Si mañana creas perfil 100 (SuperGerente), nadie lo va a permitir sin editar el código
2. **No usa la matriz de seguridad**: Ya tienes `pr_sis_permisos_arbol` que define permisos, pero la pantalla la ignora
3. **Duplicación de validación**: El router ya verifica si tienes acceso, pero la pantalla vuelve a hacer otra validación diferente
4. **No es escalable**: Cada pantalla haría lo mismo, sería un caos

---

## ✅ La Solución: Usar Niveles de Acceso de la Matriz

Ahora la pantalla funciona así:

```javascript
// 1. VERIFICAR ACCESO DESDE LA MATRIZ DE SEGURIDAD
const accessLevel = Security.getLevel('PAN_VALIDACION_SOP');

if (!Security.canAccess(screenCode)) {
    // Acceso denegado
    return;
}

// 2. APLICAR LÓGICA DE NEGOCIO SEGÚN NIVEL
// Nivel 1 (Ver): Tus propios tickets
// Nivel 2 (Edit): Tus tickets + equipo
// Nivel 3 (Full): TODOS los tickets

if (accessLevel === 1) {
    query = query.eq('id_solicitante', userId);
} else if (accessLevel === 2) {
    // Lógica para tu equipo
} else if (accessLevel === 3) {
    // Sin filtro, todos
}
```

---

## 🎯 Ventajas

### 1. **Dinámico, No Hardcodeado**

**Antes:**
```sql
-- Perfil 3 (Gerente) accede a validación
-- Perfil 5 (Cliente) accede a validación
-- Perfil 100 (SuperGerente) → ¿Editar código?
```

**Ahora:**
```sql
-- Asigna PAN_VALIDACION_SOP a cualquier perfil (3, 5, 100, lo que sea)
-- Asigna nivel 1, 2 o 3 según quieras
-- La pantalla se adapta automáticamente
```

### 2. **Usa la Matriz Existente**

Ya tienes una arquitectura perfecta:
- `pr_sis_permisos_arbol` define **quién** puede acceder
- Los `nivel_acceso` (1, 2, 3) definen **qué puede hacer**

Antes: Ignoraba esta estructura
Ahora: La usa al 100%

### 3. **Consistente en Toda la App**

Todas las pantallas pueden seguir este patrón:
```javascript
const level = Security.getLevel(screenCode);
if (!Security.canAccess(screenCode)) { denegar(); }
// Aplicar lógica según nivel
```

---

## 📋 Cambios Realizados

### En la función `render()`

**Antes:**
```javascript
let userData = null;
// ... 3 queries para encontrar el usuario
if (!userData) error;
console.log('[VALIDACION] Usuario encontrado:', userData);
```

**Ahora:**
```javascript
const screenCode = 'PAN_VALIDACION_SOP';
const accessLevel = Security.getLevel(screenCode);

if (!Security.canAccess(screenCode)) {
    // Error consistent con el router
    return;
}
console.log(`[VALIDACION] Acceso permitido. Nivel: ${accessLevel}`);
```

✅ Más simple, más consistente

---

### En la función `loadToValidate()`

**Antes:**
```javascript
const userProfile = parseInt(userData.id_perfil_defecto);

if (userProfile === 5) {
    query = query.eq('id_solicitante', userId);
} else if (userProfile === 3) {
    // Sin filtro
} else {
    // Acceso denegado
}
```

**Ahora:**
```javascript
// Nivel 1: Solo tus tickets
// Nivel 2: Tú + equipo
// Nivel 3: Todos

if (accessLevel === 1) {
    query = query.eq('id_solicitante', userId);
} else if (accessLevel === 2) {
    // Lógica de equipo
} else if (accessLevel === 3) {
    // Sin filtro
}
```

✅ Basado en niveles de acceso, no en IDs

---

## 🚀 Cómo Funciona Ahora

### Paso 1: Usuario Intenta Entrar a PAN_VALIDACION_SOP

El router verifica:
```javascript
if (!Security.canAccess('PAN_VALIDACION_SOP')) {
    // Mostrar error
}
```

### Paso 2: Si Tiene Acceso, Carga la Pantalla

`ticketValidation.js` se ejecuta:
```javascript
const accessLevel = Security.getLevel('PAN_VALIDACION_SOP');
// Acceso ya verificado por el router
```

### Paso 3: Filtra Tickets Según el Nivel

```
Nivel 1: Solo tickets que TÚ solicitaste
Nivel 2: Tickets de tu equipo/área
Nivel 3: TODOS los tickets
```

---

## 🔄 Ejemplo: Crear Perfil 100 (SuperGerente)

**Antes:**
1. Crear perfil 100 en BD
2. Editar `ticketValidation.js` → `else if (userProfile === 100)`
3. Redeploy
4. ❌ Terrible

**Ahora:**
1. Crear perfil 100 en BD
2. Asignar permiso `PAN_VALIDACION_SOP` con `nivel_acceso = 3` (Full)
3. ¡Listo! Automáticamente accede como admin
4. ✅ Perfecto

---

## 🛡️ Seguridad

**Antes:** Dos validaciones contradictorias
- Router: "¿Está en screenMap?"
- Pantalla: "¿Es perfil 3 o 5?"

**Ahora:** Una única fuente de verdad
- Router: Verifica acceso
- Pantalla: Aplica lógica de negocio según nivel

---

## 📝 Cambios en el Código

### `render()`
```diff
- Elimina búsqueda de usuario (ya está en State.profile)
+ Usa Security.getLevel() para obtener nivel
+ Llama a loadToValidate(State.profile, accessLevel)
```

### `loadToValidate(userProfile, accessLevel)`
```diff
- Parámetro: userData con id_perfil_defecto
+ Parámetro: accessLevel (1, 2 o 3)

- if (userProfile === 5)
+ if (accessLevel === 1)

- if (userProfile === 3)
+ if (accessLevel === 3)
```

### `setupEvents()`
```diff
- await loadToValidate(userData)
+ const accessLevel = Security.getLevel('PAN_VALIDACION_SOP');
+ await loadToValidate(State.profile, accessLevel);
```

---

## ✨ Resultado

- ✅ **Dinámico**: Funciona con cualquier perfil
- ✅ **Escalable**: Otros perfiles/pantallas pueden usar el mismo patrón
- ✅ **Seguro**: Una única validación desde la matriz de seguridad
- ✅ **Mantenible**: No hay IDs mágicos esparcidos en el código
- ✅ **Consistente**: Todos los niveles 1, 2, 3 funcionan igual en todas las pantallas

