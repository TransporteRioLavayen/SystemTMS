-- =============================================================================
-- SQL: CREAR TABLA cotizaciones
-- =============================================================================
-- Tabla para cotizaciones desde la landing page

CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  deposito_origen character varying NOT NULL,
  zona_destino integer NOT NULL,
  localidad_destino character varying NOT NULL,
  tipo_carga character varying NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  valor_declarado double precision NOT NULL DEFAULT 0,
  incluir_iva boolean DEFAULT false,
  entrega_domicilio boolean DEFAULT false,
  precio_total double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cotizaciones_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- HABILITAR RLS (Row Level Security)
-- =============================================================================

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLÍTICAS DE ACCESO
-- =============================================================================

-- Cualquiera puede crear cotizaciones (público desde landing page)
CREATE POLICY "Permitir inserción pública" ON public.cotizaciones
  FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden leer
CREATE POLICY "Solo admins pueden leer cotizaciones" ON public.cotizaciones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users_system
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- Solo admins pueden actualizar
CREATE POLICY "Solo admins pueden actualizar cotizaciones" ON public.cotizaciones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users_system
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );

-- =============================================================================
-- EXPONER A SUPABASE
-- =============================================================================

GRANT ALL ON public.cotizaciones TO anon, authenticated, service_role;

-- Recargar schema cache
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================

SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'cotizaciones';