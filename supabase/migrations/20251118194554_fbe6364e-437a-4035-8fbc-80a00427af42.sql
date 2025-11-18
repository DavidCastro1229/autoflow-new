-- Create equipo table for team members
CREATE TABLE IF NOT EXISTS public.equipo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  fecha_nacimiento DATE,
  documento_identidad TEXT,
  cargo TEXT NOT NULL,
  fecha_contratacion DATE NOT NULL DEFAULT CURRENT_DATE,
  salario NUMERIC NOT NULL DEFAULT 0,
  frecuencia_pago TEXT NOT NULL DEFAULT 'mensual',
  estado TEXT NOT NULL DEFAULT 'activo',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Super admins can manage all equipo"
ON public.equipo
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their taller's equipo"
ON public.equipo
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can create equipo for their taller"
ON public.equipo
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's equipo"
ON public.equipo
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's equipo"
ON public.equipo
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_equipo_updated_at
  BEFORE UPDATE ON public.equipo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();