-- Create table for technician schedules
CREATE TABLE IF NOT EXISTS public.tecnico_horarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tecnico_id UUID NOT NULL REFERENCES public.tecnicos(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL CHECK (dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')),
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tecnico_id, dia_semana)
);

-- Enable RLS
ALTER TABLE public.tecnico_horarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tecnico_horarios
CREATE POLICY "Super admins can manage all horarios"
  ON public.tecnico_horarios
  FOR ALL
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage horarios"
  ON public.tecnico_horarios
  FOR ALL
  USING (
    tecnico_id IN (
      SELECT t.id FROM public.tecnicos t
      WHERE t.taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    tecnico_id IN (
      SELECT t.id FROM public.tecnicos t
      WHERE t.taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Taller employees can view horarios"
  ON public.tecnico_horarios
  FOR SELECT
  USING (
    tecnico_id IN (
      SELECT t.id FROM public.tecnicos t
      WHERE t.taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_tecnico_horarios_updated_at
  BEFORE UPDATE ON public.tecnico_horarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();