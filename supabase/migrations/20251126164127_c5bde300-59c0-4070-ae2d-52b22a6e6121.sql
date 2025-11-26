-- Create enum for solicitud status
CREATE TYPE public.estado_solicitud_afiliacion AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- Create table for affiliation requests
CREATE TABLE public.solicitudes_afiliacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  aseguradora_id UUID NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  estado estado_solicitud_afiliacion NOT NULL DEFAULT 'pendiente',
  mensaje TEXT,
  respuesta TEXT,
  fecha_solicitud TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_respuesta TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(taller_id, aseguradora_id)
);

-- Enable RLS
ALTER TABLE public.solicitudes_afiliacion ENABLE ROW LEVEL SECURITY;

-- RLS Policies for solicitudes_afiliacion
-- Talleres can view their own solicitudes
CREATE POLICY "Talleres can view their own solicitudes"
ON public.solicitudes_afiliacion
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Talleres can create solicitudes
CREATE POLICY "Talleres can create solicitudes"
ON public.solicitudes_afiliacion
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Aseguradoras can view solicitudes directed to them
CREATE POLICY "Aseguradoras can view their solicitudes"
ON public.solicitudes_afiliacion
FOR SELECT
TO authenticated
USING (
  aseguradora_id IN (
    SELECT id FROM public.aseguradoras WHERE user_id = auth.uid()
  )
);

-- Aseguradoras can update solicitudes directed to them
CREATE POLICY "Aseguradoras can update their solicitudes"
ON public.solicitudes_afiliacion
FOR UPDATE
TO authenticated
USING (
  aseguradora_id IN (
    SELECT id FROM public.aseguradoras WHERE user_id = auth.uid()
  )
);

-- Super admins can manage all solicitudes
CREATE POLICY "Super admins can manage all solicitudes"
ON public.solicitudes_afiliacion
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_solicitudes_afiliacion_updated_at
BEFORE UPDATE ON public.solicitudes_afiliacion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();