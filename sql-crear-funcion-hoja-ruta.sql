-- =============================================================================
-- SQL: CREAR FUNCIÓN create_hoja_ruta_with_cargas
-- =============================================================================
-- Esta función crea una hoja de ruta con sus remitos asociados de forma atómica
-- Es llamada desde el backend cuando se crea una hoja de ruta desde el frontend

CREATE OR REPLACE FUNCTION public.create_hoja_ruta_with_cargas(
  p_unidad TEXT,
  p_chofer TEXT,
  p_acompanante TEXT DEFAULT NULL,
  p_deposito_origen_id UUID DEFAULT NULL,
  p_tipo_flota TEXT DEFAULT 'propia',
  p_tipo_servicio TEXT DEFAULT 'corta_distancia',
  p_estado TEXT DEFAULT 'Lista para salir',
  p_cargas JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hoja_id UUID;
  v_carga JSONB;
  v_remito_id UUID;
  v_orden INTEGER;
  v_sscc TEXT;
  v_seq INTEGER;
BEGIN
  -- 1. Generar SSCC único
  -- Buscar el último secuencial del día
  SELECT COALESCE(MAX(CAST(SUBSTRING(sscc FROM 16 FOR 6) AS INTEGER)), 0) + 1
  INTO v_seq
  FROM public.hojas_ruta
  WHERE sscc LIKE 'HR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';

  v_sscc := 'HR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_seq::TEXT, 6, '0');

  -- 2. Insertar la hoja de ruta
  INSERT INTO public.hojas_ruta (
    unidad,
    chofer,
    acompanante,
    deposito_origen_id,
    tipo_flota,
    tipo_servicio,
    estado,
    sscc
  )
  VALUES (
    p_unidad,
    p_chofer,
    p_acompanante,
    p_deposito_origen_id,
    p_tipo_flota,
    p_tipo_servicio,
    p_estado,
    v_sscc
  )
  RETURNING id INTO v_hoja_id;

  -- 3. Insertar las cargas (remitos asociados)
  v_orden := 0;
  FOR v_carga IN SELECT * FROM jsonb_array_elements(p_cargas)
  LOOP
    v_remito_id := (v_carga->>'remitoId')::UUID;
    v_orden := v_orden + 1;
    
    INSERT INTO public.hoja_ruta_remitos (hoja_ruta_id, remito_id, orden, estado_entrega)
    VALUES (v_hoja_id, v_remito_id, v_orden, 'En Base');
  END LOOP;

  -- 4. Retornar el ID de la hoja creada
  RETURN v_hoja_id;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating hoja de ruta: %', SQLERRM;
END;
$$;

-- =============================================================================
-- EXPONER FUNCIÓN A SUPABASE (Grant execute)
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.create_hoja_ruta_with_cargas TO anon, authenticated, service_role;

-- =============================================================================
-- REFRESCAR SCHEMA CACHE
-- =============================================================================

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

-- Verificar que la función existe
SELECT 
  proname AS function_name,
  pronargs AS parameter_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'create_hoja_ruta_with_cargas';