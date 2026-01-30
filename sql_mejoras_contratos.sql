-- ============================================
-- SQL: Mejoras en Gestión de Contratos v1.0002
-- ============================================
-- Agrega campos para control de facturación y edición de contratos
-- Fecha: 2026-01-30

-- ============================================
-- 1. AGREGAR COLUMNAS A pr_com_contratos
-- ============================================

-- Columna para indicar si el contrato ya fue facturado/cobrado
ALTER TABLE pr_com_contratos 
ADD COLUMN IF NOT EXISTS facturado BOOLEAN DEFAULT FALSE;

-- Columna para la fecha de facturación
ALTER TABLE pr_com_contratos 
ADD COLUMN IF NOT EXISTS fecha_facturacion DATE;

-- Columna para observaciones/notas del contrato
ALTER TABLE pr_com_contratos 
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Comentarios en las columnas
COMMENT ON COLUMN pr_com_contratos.facturado IS 'Indica si el contrato ya fue facturado/cobrado. Solo se puede editar si es FALSE';
COMMENT ON COLUMN pr_com_contratos.fecha_facturacion IS 'Fecha en que se facturó el contrato';
COMMENT ON COLUMN pr_com_contratos.observaciones IS 'Notas adicionales sobre el contrato';

-- ============================================
-- 2. VERIFICAR RELACIÓN CONTRATOS -> PROYECTOS
-- ============================================

-- Verificar que pr_proyectos tiene la columna id_contrato
-- Si no existe, agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pr_proyectos' 
        AND column_name = 'id_contrato'
    ) THEN
        ALTER TABLE pr_proyectos 
        ADD COLUMN id_contrato INTEGER REFERENCES pr_com_contratos(id_contrato);
        
        COMMENT ON COLUMN pr_proyectos.id_contrato IS 'Contrato del cual proviene este proyecto. REQUERIDO para crear proyectos';
        
        RAISE NOTICE 'Columna id_contrato agregada a pr_proyectos';
    ELSE
        RAISE NOTICE 'La columna id_contrato ya existe en pr_proyectos';
    END IF;
END $$;

-- ============================================
-- 3. AGREGAR RESTRICCIONES
-- ============================================

-- Los proyectos DEBEN tener un contrato (hacerlo obligatorio)
-- NOTA: Esto puede fallar si ya existen proyectos sin contrato
-- En ese caso, primero asigna contratos a los proyectos existentes
DO $$
BEGIN
    -- Intentar agregar la restricción NOT NULL
    BEGIN
        ALTER TABLE pr_proyectos 
        ALTER COLUMN id_contrato SET NOT NULL;
        
        RAISE NOTICE 'Restricción NOT NULL agregada a pr_proyectos.id_contrato';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo agregar NOT NULL - puede haber proyectos sin contrato. Error: %', SQLERRM;
    END;
END $$;

-- ============================================
-- 4. VISTA PARA CONTRATOS CON INFORMACIÓN AGREGADA
-- ============================================

CREATE OR REPLACE VIEW vw_contratos_resumen AS
SELECT 
    c.*,
    o.nombre_comercial,
    -- Contar proyectos asociados
    COUNT(DISTINCT p.id_proyecto) as total_proyectos,
    -- Contar tickets asociados (a través de proyectos)
    COUNT(DISTINCT t.id_ticket) as total_tickets,
    -- Calcular horas consumidas
    COALESCE(SUM(a.duracion_minutos), 0) / 60.0 as horas_consumidas,
    -- Calcular progreso
    CASE 
        WHEN c.horas_totales > 0 THEN 
            ROUND((COALESCE(SUM(a.duracion_minutos), 0) / 60.0 / c.horas_totales * 100)::numeric, 2)
        ELSE 0 
    END as porcentaje_consumido
FROM pr_com_contratos c
LEFT JOIN pr_organizaciones o ON c.id_organizacion = o.id_organizacion
LEFT JOIN pr_proyectos p ON p.id_contrato = c.id_contrato
LEFT JOIN pr_tickets t ON t.id_proyecto = p.id_proyecto
LEFT JOIN pr_actividades a ON a.id_ticket = t.id_ticket
GROUP BY c.id_contrato, o.nombre_comercial;

COMMENT ON VIEW vw_contratos_resumen IS 'Vista con información agregada de contratos: proyectos, tickets y horas consumidas';

-- ============================================
-- 5. FUNCIÓN PARA VALIDAR SI SE PUEDE EDITAR UN CONTRATO
-- ============================================

CREATE OR REPLACE FUNCTION fn_puede_editar_contrato(p_id_contrato INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_facturado BOOLEAN;
BEGIN
    SELECT facturado INTO v_facturado
    FROM pr_com_contratos
    WHERE id_contrato = p_id_contrato;
    
    -- Solo se puede editar si NO está facturado
    RETURN NOT COALESCE(v_facturado, FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_puede_editar_contrato(INTEGER) IS 'Verifica si un contrato puede ser editado (solo si no está facturado)';

-- ============================================
-- 6. FUNCIÓN PARA VALIDAR CREACIÓN DE PROYECTOS
-- ============================================

CREATE OR REPLACE FUNCTION fn_validar_proyecto_tiene_contrato()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que el contrato existe y está activo
    IF NEW.id_contrato IS NULL THEN
        RAISE EXCEPTION 'No se puede crear un proyecto sin un contrato asociado';
    END IF;
    
    -- Validar que el contrato existe
    IF NOT EXISTS (SELECT 1 FROM pr_com_contratos WHERE id_contrato = NEW.id_contrato) THEN
        RAISE EXCEPTION 'El contrato especificado no existe';
    END IF;
    
    -- Validar que el contrato no esté vencido
    IF EXISTS (
        SELECT 1 FROM pr_com_contratos 
        WHERE id_contrato = NEW.id_contrato 
        AND fecha_fin < CURRENT_DATE
    ) THEN
        RAISE WARNING 'El contrato asociado ya está vencido';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trg_validar_proyecto_contrato ON pr_proyectos;
CREATE TRIGGER trg_validar_proyecto_contrato
    BEFORE INSERT OR UPDATE ON pr_proyectos
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_proyecto_tiene_contrato();

COMMENT ON FUNCTION fn_validar_proyecto_tiene_contrato() IS 'Trigger que valida que todo proyecto tenga un contrato válido';

-- ============================================
-- 7. VERIFICACIÓN
-- ============================================

-- Ver estructura actualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pr_com_contratos' 
AND column_name IN ('facturado', 'fecha_facturacion', 'observaciones')
ORDER BY ordinal_position;

-- Ver si la vista se creó correctamente
SELECT COUNT(*) as total_contratos FROM vw_contratos_resumen;

-- Probar la función de validación (reemplaza 1 por un ID real)
-- SELECT fn_puede_editar_contrato(1);
