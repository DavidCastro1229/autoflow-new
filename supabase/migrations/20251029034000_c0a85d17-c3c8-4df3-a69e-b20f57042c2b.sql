-- Agregar rol 'tecnico' al enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tecnico';

-- Crear enum para area de tecnico
CREATE TYPE public.area_tecnico AS ENUM ('tecnico', 'tecnico_senior');

-- Crear tabla de tecnicos
CREATE TABLE public.tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  area area_tecnico NOT NULL DEFAULT 'tecnico',
  especialidad_id INTEGER NOT NULL REFERENCES public.especialidades_taller(id),
  experiencia TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  habilidades TEXT,
  certificaciones TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Tecnicos can view their own info"
ON public.tecnicos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Taller employees can view their taller's tecnicos"
ON public.tecnicos
FOR SELECT
TO authenticated
USING (taller_id IN (
  SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Taller employees can manage their taller's tecnicos"
ON public.tecnicos
FOR ALL
TO authenticated
USING (taller_id IN (
  SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
))
WITH CHECK (taller_id IN (
  SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Super admins can manage all tecnicos"
ON public.tecnicos
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_tecnicos_updated_at
BEFORE UPDATE ON public.tecnicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();