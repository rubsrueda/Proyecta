# 🏗️ Arquitectura: Dos Pantallas de Validación de Tickets

## Problema Actual

Un cliente puede ver tickets de proyectos que no son suyos. Esto es un problema de seguridad porque:
- No debería ver información de otros clientes
- No debería validar lo que no le concierne
- El nivel de acceso 3 (Full) da acceso a TODOS los tickets, pero un cliente nunca debería tener nivel 3

## Solución: Dos Pantallas Diferentes

### 1. **PAN_VALIDACION_CLIENTE** (Para clientes)
- **Quién:** Usuarios nivel 1 (clientes/solicitantes)
- **Qué ve:** Solo tickets que ÉL solicitó
- **Funcionalidad:** Validar/rechazar solo sus propios tickets

### 2. **PAN_VALIDACION_DIRECTIVO** (Para directivos/admin)
- **Quién:** Usuarios nivel 3 (directivos/admin)
- **Qué ve:** TODOS los tickets de soporte y proyectos
- **Funcionalidad:** Validación completa, reportes, auditoría

---

## Implementación: Crear la Segunda Pantalla

### Paso 1: Duplicar el archivo
```bash
cp js/screens/ticketValidation.js js/screens/ticketValidationDirective.js
```

### Paso 2: Registrar en catálogo de pantallas

En `pr_sis_pantallas`, agregar:
```sql
INSERT INTO pr_sis_pantallas (codigo_pantalla, nombre_pantalla, ruta_archivo, descripcion)
VALUES 
  ('PAN_VALIDACION_CLIENTE', 'Validación de Mis Tickets', 'ticketValidation.js', 'Cliente valida sus propios tickets'),
  ('PAN_VALIDACION_DIRECTIVO', 'Validación General (Directivo)', 'ticketValidationDirective.js', 'Directivo valida todos los tickets');
```

### Paso 3: Asignar Permisos

```sql
-- PARA CLIENTES (Perfil = Cliente, Nivel 1)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    p.id_perfil,
    m.id_menu,
    pan.id_pantalla,
    1  -- Nivel 1
FROM pr_sis_perfiles p
CROSS JOIN pr_sis_menus m
CROSS JOIN pr_sis_pantallas pan
WHERE p.nombre_perfil = 'Cliente'
  AND m.codigo_menu = 'SOPORTE'
  AND pan.codigo_pantalla = 'PAN_VALIDACION_CLIENTE';

-- PARA DIRECTIVOS (Perfil = Administrador, Nivel 3)
INSERT INTO pr_sis_permisos_arbol (id_perfil, id_menu, id_pantalla, nivel_acceso)
SELECT 
    p.id_perfil,
    m.id_menu,
    pan.id_pantalla,
    3  -- Nivel 3
FROM pr_sis_perfiles p
CROSS JOIN pr_sis_menus m
CROSS JOIN pr_sis_pantallas pan
WHERE p.nombre_perfil = 'Administrador'
  AND m.codigo_menu = 'SOPORTE'
  AND pan.codigo_pantalla = 'PAN_VALIDACION_DIRECTIVO';
```

---

## Diferencias Clave

### ticketValidation.js (Cliente)
```javascript
// Nivel 1: Solo SUS tickets
if (accessLevel === 1) {
    query = query.eq('id_solicitante', userId);
}
// No tiene acceso a nivel 3
```

### ticketValidationDirective.js (Directivo)
```javascript
// Nivel 3: TODOS los tickets
if (accessLevel === 3) {
    // Sin filtro, ve todo
}
// Con opción de reportes y auditoría
```

---

## Estado de Validación en BD

La lógica actual funciona así:

| Estado | Quién puede verlo | Acción |
|--------|------------------|--------|
| EN_PROCESO | Support, Directivo | Asignar, resolver |
| RESUELTO | Cliente, Directivo | **Validar o rechazar** |
| EN_PROCESO (rechazado) | Support, Directivo | Reasignar |
| CERRADO | Directivo (auditoría) | Ver como histórico |

---

## Flujo de un Ticket (Cliente vs Directivo)

### Flujo del Cliente
```
1. Solicita un ticket → EN_PROCESO
2. Support lo resuelve → RESUELTO
3. Cliente lo valida → CERRADO ✅
   O lo rechaza → EN_PROCESO (vuelve al equipo)
```

### Flujo del Directivo
```
1. Ve ticket EN_PROCESO
2. Lo asigna al equipo correcto
3. Ve cuando está RESUELTO
4. Puede validarlo en nombre del cliente O aprobar para auditoría
```

---

## Mejoras Futuras

### 1. Filtrado por Proyecto (Nivel 1)
Actualmente:
```javascript
// Solo ve tickets que solicitó
query = query.eq('id_solicitante', userId);
```

Mejorado (próxima fase):
```javascript
// Ve tickets que solicitó O que es responsable del proyecto
// Requiere join con tabla de responsables de proyecto
```

### 2. Dashboard Directivo
- Gráficos de SLAs
- Tickets por estado
- Tiempo de resolución
- Auditoría de validaciones

### 3. Notificaciones
- Cliente notificado cuando su ticket está RESUELTO
- Directivo notificado de rechazos
- Support notificado de devoluciones

---

## Checklist de Implementación

- [ ] Crear `ticketValidationDirective.js`
- [ ] Registrar nuevas pantallas en `pr_sis_pantallas`
- [ ] Asignar permisos en `pr_sis_permisos_arbol`
- [ ] Actualizar menú para mostrar la opción correcta según perfil
- [ ] Testear con cliente (solo ve sus tickets)
- [ ] Testear con directivo (ve todos)
- [ ] Documentar cambios

