-- Add 'cliente' role to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cliente';

-- Create enum for client types
CREATE TYPE public.tipo_cliente AS ENUM ('individual', 'empresa', 'flota');

-- Create clientes table
CREATE TABLE public.clientes (
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
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();