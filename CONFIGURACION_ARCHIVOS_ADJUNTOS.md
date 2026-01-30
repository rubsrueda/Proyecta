# 📎 Configuración de Archivos Adjuntos en Tickets

## ✅ Funcionalidad Implementada

La pantalla de **Nueva Solicitud de Ticket** ahora permite adjuntar archivos (imágenes, PDFs, documentos, etc.) al crear un ticket.

### Características:
- ✅ Campo de archivo adjunto en el formulario
- ✅ Validación de tamaño (máximo 5MB)
- ✅ Tipos de archivo soportados: imágenes, PDF, Word, Excel, TXT
- ✅ Subida automática a Supabase Storage
- ✅ Vínculo del archivo al registro del ticket

---

## 🔧 Configuración Requerida en Supabase

Para que la funcionalidad funcione completamente, necesitas configurar el almacenamiento en Supabase:

### Paso 1: Crear el Bucket de Almacenamiento

1. Ve al Dashboard de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket con estos valores:
   - **Nombre**: `attachments`
   - **Público**: ❌ No (mantener privado)
   - **Tamaño máximo de archivo**: `5 MB`

### Paso 2: Configurar Políticas de Acceso (RLS)

Una vez creado el bucket, ve a la sección de **Policies** y ejecuta el script [sql_setup_storage.sql](sql_setup_storage.sql):

```sql
-- Permitir que usuarios autenticados suban archivos
CREATE POLICY "Los usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Permitir que usuarios autenticados lean sus archivos
CREATE POLICY "Los usuarios pueden ver sus archivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');
```

### Paso 3: Agregar Columna a la Tabla

Ejecuta este SQL para agregar la columna `archivo_adjunto` a la tabla `pr_tickets` (si no existe):

```sql
ALTER TABLE pr_tickets 
ADD COLUMN IF NOT EXISTS archivo_adjunto TEXT;
```

O ejecuta directamente: [sql_setup_storage.sql](sql_setup_storage.sql)

---

## 📋 Cómo Usar

### Para el Usuario:

1. Abre la pantalla de **"Gestión de Tickets"**
2. Haz clic en **"+ Nuevo Ticket"**
3. Completa los campos requeridos (Asunto, Descripción, etc.)
4. En el campo **"Archivo Adjunto (Opcional)"**, haz clic en **"Elegir archivo"**
5. Selecciona el archivo (máximo 5MB)
6. Haz clic en **"Crear"**

El sistema:
- ✅ Creará el ticket
- ✅ Subirá el archivo a Supabase Storage
- ✅ Vinculará el archivo al ticket
- ✅ Mostrará un mensaje de confirmación

### Validaciones Automáticas:

- ❌ Si el archivo es mayor a 5MB → "Ticket creado, pero el archivo es demasiado grande"
- ✅ Si todo es correcto → "Ticket creado exitosamente con archivo adjunto"
- ⚠️ Si hay error en la subida → "Ticket creado, pero hubo un error al subir el archivo"

---

## 🔍 Estructura de Almacenamiento

Los archivos se organizan de la siguiente manera:

```
attachments/
├── tickets/
│   ├── [id_ticket_1]/
│   │   ├── TK:2026-A123456_1738261234567.pdf
│   │   └── TK:2026-A123456_1738261298765.jpg
│   ├── [id_ticket_2]/
│   │   └── TK:2026-A789012_1738261345678.docx
```

**Formato del nombre**: `{codigo_visual}_{timestamp}.{extension}`

Ejemplo: `TK:2026-A123456_1738261234567.pdf`

---

## 📝 Archivos Modificados

1. **[js/screens/ticketList.js](js/screens/ticketList.js)**
   - ✅ Campo de archivo en el formulario HTML
   - ✅ Lógica de validación de tamaño
   - ✅ Subida a Supabase Storage
   - ✅ Actualización del registro con la ruta del archivo

2. **[sql_setup_storage.sql](sql_setup_storage.sql)** (NUEVO)
   - ✅ Script de configuración de políticas
   - ✅ Creación de columna `archivo_adjunto`

---

## 🚀 Próximas Mejoras (Opcional)

- [ ] Mostrar el archivo adjunto en la pantalla de detalle del ticket
- [ ] Permitir descargar el archivo adjunto
- [ ] Permitir múltiples archivos adjuntos
- [ ] Vista previa de imágenes en el detalle del ticket
- [ ] Eliminar archivo adjunto (con confirmación)
- [ ] Historial de archivos adjuntos

---

## 🐛 Solución de Problemas

### Error: "Error al subir el archivo: new row violates row-level security policy"

**Causa**: El bucket no está configurado o las políticas de acceso no están creadas.

**Solución**: 
1. Verifica que el bucket `attachments` existe
2. Ejecuta las políticas en [sql_setup_storage.sql](sql_setup_storage.sql)

### Error: "Bucket not found"

**Causa**: El bucket `attachments` no existe en Supabase Storage.

**Solución**: Crea el bucket manualmente en el Dashboard de Supabase.

### Error: "File size exceeds limit"

**Causa**: El archivo es mayor a 5MB.

**Solución**: Comprime el archivo o selecciona uno más pequeño.

---

## ✅ Checklist de Configuración

- [ ] Bucket `attachments` creado en Supabase Storage
- [ ] Políticas de acceso configuradas (INSERT, SELECT, UPDATE, DELETE)
- [ ] Columna `archivo_adjunto` agregada a `pr_tickets`
- [ ] Probar crear un ticket con archivo adjunto
- [ ] Verificar que el archivo se subió correctamente en Storage
- [ ] Verificar que `archivo_adjunto` tiene la ruta en la tabla

---

**Última actualización**: 30 de enero de 2026
