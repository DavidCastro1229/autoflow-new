-- Crear tabla de siniestros
CREATE TABLE public.siniestros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_siniestro TEXT NOT NULL UNIQUE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  fecha_siniestro DATE NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  monto_estimado NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.siniestros ENABLE ROW LEVEL SECURITY;

-- Políticas para Super Admins
CREATE POLICY "Super admins can manage all siniestros"
ON public.siniestros
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Políticas para Aseguradoras - pueden ver siniestros de sus talleres afiliados
CREATE POLICY "Aseguradoras can view their talleres' siniestros"
ON public.siniestros
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.taller_aseguradoras ta
    JOIN public.aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = siniestros.taller_id
    AND a.user_id = auth.uid()
  )
);

-- Políticas para Talleres - pueden gestionar sus propios siniestros
CREATE POLICY "Taller employees can manage their taller's siniestros"
ON public.siniestros
FOR ALL
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IN (
    SELECT taller_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_siniestros_updated_at
BEFORE UPDATE ON public.siniestros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();