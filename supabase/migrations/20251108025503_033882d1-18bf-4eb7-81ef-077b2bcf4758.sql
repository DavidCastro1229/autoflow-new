-- Create servicios table
CREATE TABLE public.servicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES public.categorias_servicio(id),
  precio NUMERIC NOT NULL DEFAULT 0,
  tiempo_estimado JSONB NOT NULL DEFAULT '{"dias": 0, "horas": 0, "minutos": 0}'::jsonb,
  descripcion TEXT,
  materiales_requeridos TEXT[] DEFAULT ARRAY[]::TEXT[],
  estado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;

-- Create policies for servicios
CREATE POLICY "Super admins can manage all servicios"
ON public.servicios
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their taller's servicios"
ON public.servicios
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can create servicios for their taller"
ON public.servicios
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's servicios"
ON public.servicios
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's servicios"
ON public.servicios
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_servicios_updated_at
BEFORE UPDATE ON public.servicios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();