-- =============================================================================
-- SQL: LIMPIEZA DEL MÓDULO DE PRECIOS/TARIFAS
-- =============================================================================
-- Este script elimina todas las tablas y funciones relacionadas con el módulo de precios

-- =============================================================================
-- 1. ELIMINAR TABLAS
-- =============================================================================

-- Tablas del módulo de precios (orden inverso por foreign keys)
DROP TABLE IF EXISTS public.historial_tarifas CASCADE;
DROP TABLE IF EXISTS public.tarifas CASCADE;
DROP TABLE IF EXISTS public.factores_calculadora CASCADE;
DROP TABLE IF EXISTS public.localidades CASCADE;
DROP TABLE IF EXISTS public.zonas CASCADE;
DROP TABLE IF EXISTS public.cotizaciones CASCADE;

-- =============================================================================
-- 2. ELIMINAR FUNCIONES RPC RELACIONADAS CON PRECIOS
-- =============================================================================

DROP FUNCTION IF EXISTS public.calculate_shipping_price(JSONB);
DROP FUNCTION IF EXISTS public.get_effective_tariff(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.create_zone(JSONB);
DROP FUNCTION IF EXISTS public.update_zone(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_zone(UUID);
DROP FUNCTION IF EXISTS public.create_locality(JSONB);
DROP FUNCTION IF EXISTS public.update_locality(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_locality(UUID);
DROP FUNCTION IF EXISTS public.create_tariff_rate(JSONB);
DROP FUNCTION IF EXISTS public.update_tariff_rate(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_tariff_rate(UUID);
DROP FUNCTION IF EXISTS public.create_calculator_factor(JSONB);
DROP FUNCTION IF EXISTS public.update_calculator_factor(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_calculator_factor(UUID);
DROP FUNCTION IF EXISTS public.create_formula_calculo(JSONB);
DROP FUNCTION IF EXISTS public.update_formula_calculo(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_formula_calculo(UUID);

-- =============================================================================
-- 3. ELIMINAR ROLES (si existen)
-- =============================================================================

-- No hay roles específicos para este módulo

-- =============================================================================
-- 4. RECARGAR SCHEMA CACHE DE SUPABASE
-- =============================================================================

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

SELECT 
  'Tablas eliminadas' AS accion,
  COUNT(*) AS cantidad
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tarifas', 'zonas', 'localidades', 'factores_calculadora', 'cotizaciones', 'historial_tarifas');

-- Verificar que no existan funciones relacionadas
SELECT 
  'Funciones eliminadas' AS accion,
  COUNT(*) AS cantidad
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%tariff%'
   OR p.proname LIKE '%zone%'
   OR p.proname LIKE '%calculator%'
   OR p.proname LIKE '%formula%'
   OR p.proname LIKE '%pricing%'
   OR p.proname LIKE '%tarifa%';