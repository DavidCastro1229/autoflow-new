-- Create table for administrative positions/roles
CREATE TABLE IF NOT EXISTS public.cargos_administrativos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  emoji text NOT NULL DEFAULT '👤',
  color text NOT NULL DEFAULT 'blue',
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cargos_administrativos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view cargos
CREATE POLICY "Authenticated users can view cargos administrativos"
  ON public.cargos_administrativos
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow super admins to manage cargos
CREATE POLICY "Super admins can manage cargos administrativos"
  ON public.cargos_administrativos
  FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Insert predefined administrative positions
INSERT INTO public.cargos_administrativos (nombre, emoji, color, orden) VALUES
  ('Gerente General', '👔', 'purple', 1),
  ('Jefe de Taller', '🔧', 'blue', 2),
  ('Recepcionista', '📋', 'green', 3),
  ('Asesor de Servicio', '💼', 'cyan', 4),
  ('Contador', '📊', 'yellow', 5),
  ('Auxiliar Administrativo', '📝', 'orange', 6),
  ('Supervisor de Calidad', '✅', 'red', 7),
  ('Almacenista', '📦', 'indigo', 8),
  ('Vendedor de Repuestos', '🛒', 'pink', 9),
  ('Mecánico', '🔩', 'slate', 10),
  ('Electricista', '⚡', 'amber', 11),
  ('Pintor', '🎨', 'rose', 12),
  ('Hojalatero', '🔨', 'gray', 13);

-- Create trigger for updated_at
CREATE TRIGGER update_cargos_administrativos_updated_at
  BEFORE UPDATE ON public.cargos_administrativos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update equipo table to reference cargos_administrativos
-- First, let's make cargo nullable temporarily
ALTER TABLE public.equipo ALTER COLUMN cargo DROP NOT NULL;

-- Add foreign key column
ALTER TABLE public.equipo ADD COLUMN IF NOT EXISTS cargo_id uuid REFERENCES public.cargos_administrativos(id);

-- Migrate existing data
UPDATE public.equipo e
SET cargo_id = ca.id
FROM public.cargos_administrativos ca
WHERE e.cargo = ca.nombre;

-- Now we can make cargo_id required
ALTER TABLE public.equipo ALTER COLUMN cargo_id SET NOT NULL;

-- Keep the old cargo column for now as text for backward compatibility
-- We'll use cargo_id as the primary reference