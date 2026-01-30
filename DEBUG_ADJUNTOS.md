# 🔍 Guía de Debug - Archivos Adjuntos v1.0001

## ✅ Sistema de Versionamiento Implementado

**Versión actual**: `v1.0001`  
**Fecha**: 2026-01-30  
**Descripción**: Implementación de archivos adjuntos en tickets

### Cómo verificar la versión:

1. **Marca de agua visible**: En la esquina inferior derecha de la aplicación verás `v1.0001`
2. **Consola del navegador**: Al cargar la aplicación, aparecerá:
   ```
   🚀 Proyecta v1.0001
   📅 2026-01-30 - Implementación de archivos adjuntos en tickets
   ```

---

## 🐛 Debug de Archivos Adjuntos en PAN_TICKET_ALTA

### Logs implementados:

Cuando abras la pantalla de "Nueva Solicitud de Soporte" (PAN_TICKET_ALTA), verás estos logs en la consola:

```
[TICKET CREATE v1.0001] Módulo cargado
[TICKET CREATE] Renderizando pantalla de alta de tickets
[TICKET CREATE] HTML renderizado
[TICKET CREATE] allowDirect: true/false
[TICKET CREATE] Input file encontrado: true
[TICKET CREATE] Input file tipo: file
[TICKET CREATE] Input file accept: image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt
```

### Al seleccionar un archivo:

```
[TICKET CREATE] Archivo seleccionado: nombre_archivo.pdf
[TICKET CREATE] Tamaño: 123456 bytes
```

### Al enviar el formulario:

```
[TICKET CREATE] ========== INICIO SUBMIT ==========
[TICKET CREATE] Código generado: TK-12345
[TICKET CREATE] Datos del ticket: {...}
[TICKET CREATE] Insertando en base de datos...
[TICKET CREATE] ✅ Ticket creado con ID: 123
[TICKET CREATE] Verificando archivo adjunto...
[TICKET CREATE] Input encontrado: true
[TICKET CREATE] Files: FileList {...}
[TICKET CREATE] Tiene archivo: true
[TICKET CREATE] 📎 Archivo detectado: nombre_archivo.pdf
[TICKET CREATE] Tamaño: 123456 bytes ( 0.12 MB)
[TICKET CREATE] Subiendo archivo a Storage...
[TICKET CREATE] Ruta: tickets/123/TK-12345_1738261234567.pdf
[TICKET CREATE] ✅ Archivo subido exitosamente
[TICKET CREATE] Actualizando registro del ticket...
[TICKET CREATE] ✅ Registro actualizado con ruta del archivo
[TICKET CREATE] ========== FIN SUBMIT ==========
[TICKET CREATE] Navegando a lista de tickets...
```

---

## 🔧 Pasos para Verificar

### 1. Abrir la aplicación
- Ve a `app.html`
- Verifica que en la esquina inferior derecha aparece `v1.0001`

### 2. Abrir la Consola del Navegador (F12)
- Pestaña "Console"
- Busca los mensajes con `[TICKET CREATE]`

### 3. Navegar a Nueva Solicitud
- En el menú, busca "Nueva Solicitud de Soporte"
- Código de pantalla: `PAN_TICKET_ALTA`

### 4. Verificar el campo de archivo
- Debe aparecer un campo de input tipo file
- **Label**: "Archivo Adjunto (Opcional)"
- **Texto ayuda**: "Máx. 5MB - Imágenes, PDF, documentos"
- **Botón**: "Elegir archivo" o "Choose File"

### 5. Seleccionar un archivo
- Haz clic en el botón de elegir archivo
- Selecciona cualquier imagen, PDF o documento
- Verifica en la consola que aparece: `[TICKET CREATE] Archivo seleccionado: ...`

### 6. Completar el formulario
- Asunto: Cualquier texto
- Descripción: Cualquier texto
- Haz clic en "Enviar Solicitud"

### 7. Verificar logs en consola
- Debe aparecer toda la secuencia de logs desde INICIO SUBMIT hasta FIN SUBMIT
- Busca el símbolo ✅ para ver si fue exitoso
- Busca el símbolo ❌ si hubo algún error

---

## ⚠️ Problemas Comunes

### Problema 1: No aparece el campo de archivo

**Síntomas**: Solo se ve un recuadro vacío o placeholder

**Verificar en consola**:
```
[TICKET CREATE] Input file encontrado: false
```

**Solución**: El HTML no se renderizó correctamente. Refresca la página (Ctrl+R o Cmd+R)

---

### Problema 2: El campo aparece pero no se puede seleccionar archivo

**Síntomas**: Al hacer clic no pasa nada

**Verificar en consola**:
- Si al hacer clic no aparece ningún log, el evento no está configurado
- Revisa si hay errores en rojo en la consola

**Solución**: Verifica que el archivo `ticketCreate.js` se cargó correctamente

---

### Problema 3: El archivo se selecciona pero no se sube

**Verificar en consola**:
```
[TICKET CREATE] Tiene archivo: true
[TICKET CREATE] 📎 Archivo detectado: ...
[TICKET CREATE] ❌ Error subiendo archivo: ...
```

**Posibles causas**:
1. **Bucket no existe**: El bucket `attachments` no está creado en Supabase Storage
2. **Políticas RLS**: Las políticas de acceso no están configuradas
3. **Columna no existe**: La columna `archivo_adjunto` no existe en `pr_tickets`

**Solución**: Ejecuta el script [sql_setup_storage.sql](sql_setup_storage.sql) en Supabase

---

### Problema 4: No aparece ningún log en consola

**Síntomas**: La consola está vacía o no muestra logs de [TICKET CREATE]

**Posibles causas**:
1. La consola está filtrada
2. El módulo no se cargó correctamente
3. Estás en otra pantalla

**Solución**:
1. En la consola, limpia los filtros
2. Recarga la página completa (Ctrl+Shift+R o Cmd+Shift+R)
3. Verifica que estás en la pantalla correcta (debe decir "Nueva Solicitud de Soporte" en el título)

---

## 📊 Checklist de Verificación

Marca lo que funciona:

- [ ] La versión `v1.0001` aparece en la esquina inferior derecha
- [ ] Al cargar la app aparece el log `🚀 Proyecta v1.0001`
- [ ] Al abrir PAN_TICKET_ALTA aparece `[TICKET CREATE] Renderizando pantalla`
- [ ] Aparece el campo "Archivo Adjunto (Opcional)"
- [ ] El campo tiene un botón funcional para seleccionar archivos
- [ ] Al seleccionar un archivo aparece el log con el nombre
- [ ] Al enviar el formulario aparece la secuencia completa de logs
- [ ] El archivo se sube exitosamente (✅)
- [ ] El ticket se crea correctamente
- [ ] Se puede ver el archivo adjunto en la lista de tickets

---

## 📝 Reportar Problema

Si algo no funciona, copia estos datos:

1. **Versión**: (la que aparece en la marca de agua)
2. **Pantalla**: PAN_TICKET_ALTA
3. **Síntoma**: Describe qué no funciona
4. **Logs de consola**: Copia todos los logs que empiecen con `[TICKET CREATE]`
5. **Errores**: Copia cualquier mensaje en rojo de la consola

---

**Última actualización**: v1.0001 - 30 enero 2026
