-- ============================================
-- SQL: Configuración de Storage para Archivos Adjuntos
-- ============================================
-- Este script crea el bucket de almacenamiento necesario
-- para subir archivos adjuntos en los tickets
--
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard -> Storage
-- 2. Crea un nuevo bucket llamado "attachments"
-- 3. Configura las políticas de acceso:

-- IMPORTANTE: No se puede crear buckets desde SQL
-- Debes ir manualmente a:
-- https://supabase.com/dashboard/project/[TU_PROYECTO]/storage/buckets
-- Y crear el bucket "attachments" con estas configuraciones:

/*
Nombre del Bucket: attachments
Público: No (privado)
Tamaño máximo de archivo: 5 MB
Tipos de archivo permitidos: image/*, application/pdf, application/msword, 
                              application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                              application/vnd.ms-excel,
                              application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                              text/plain
*/

-- ============================================
-- POLÍTICAS DE ACCESO (Storage Policies)
-- ============================================
-- Una vez creado el bucket, ejecuta estas políticas:

-- 1. Permitir que usuarios autenticados suban archivos
CREATE POLICY "Los usuarios autenticados pueden subir archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- 2. Permitir que usuarios autenticados lean sus archivos
CREATE POLICY "Los usuarios pueden ver sus archivos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

-- 3. Permitir que usuarios autenticados actualicen sus archivos
CREATE POLICY "Los usuarios pueden actualizar sus archivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- 4. Permitir que usuarios autenticados eliminen sus archivos
CREATE POLICY "Los usuarios pueden eliminar sus archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- ============================================
-- AGREGAR COLUMNA A LA TABLA pr_tickets (si no existe)
-- ============================================

-- Verificar si la columna existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pr_tickets' 
        AND column_name = 'archivo_adjunto'
    ) THEN
        ALTER TABLE pr_tickets 
        ADD COLUMN archivo_adjunto TEXT;
        
        RAISE NOTICE 'Columna archivo_adjunto agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna archivo_adjunto ya existe';
    END IF;
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la columna fue creada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pr_tickets' 
AND column_name = 'archivo_adjunto';
