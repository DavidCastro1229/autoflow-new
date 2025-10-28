-- Add 'cliente' role to the app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND 'cliente' = ANY(enum_range(NULL::app_role)::text[])) THEN
    ALTER TYPE app_role ADD VALUE 'cliente';
  END IF;
END $$;

-- Create enum for client types if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_cliente') THEN
    CREATE TYPE public.tipo_cliente AS ENUM ('individual', 'empresa', 'flota');
  END IF;
END $$;

-- Create clientes table
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  nombre_empresa TEXT,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  tipo_cliente tipo_cliente NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own client info" ON public.clientes;
DROP POLICY IF EXISTS "Taller employees can view their taller's clients" ON public.clientes;
DROP POLICY IF EXISTS "Taller employees can manage their taller's clients" ON public.clientes;
DROP POLICY IF EXISTS "Super admins can manage all clients" ON public.clientes;

-- RLS Policies for clientes
CREATE POLICY "Users can view their own client info"
  ON public.clientes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Taller employees can view their taller's clients"
  ON public.clientes
  FOR SELECT
  USING (
    taller_id IN (
      SELECT taller_id 
      FROM user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Taller employees can manage their taller's clients"
  ON public.clientes
  FOR ALL
  USING (
    taller_id IN (
      SELECT taller_id 
      FROM user_roles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    taller_id IN (
      SELECT taller_id 
      FROM user_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all clients"
  ON public.clientes
  FOR ALL
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();