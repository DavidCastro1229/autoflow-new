-- Create storage bucket for hoja de ingreso images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hojas-ingreso', 'hojas-ingreso', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for hoja de ingreso
CREATE POLICY "Users can view hojas ingreso images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'hojas-ingreso');

CREATE POLICY "Taller employees can upload hojas ingreso images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'hojas-ingreso' AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE taller_id IS NOT NULL
  )
);

CREATE POLICY "Taller employees can delete their hojas ingreso images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'hojas-ingreso' AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE taller_id IS NOT NULL
  )
);

-- Create hojas_ingreso table
CREATE TABLE public.hojas_ingreso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  interiores JSONB NOT NULL DEFAULT '{}'::jsonb,
  exteriores JSONB NOT NULL DEFAULT '{}'::jsonb,
  nivel_gasolina TEXT NOT NULL DEFAULT '1/4',
  coqueta JSONB NOT NULL DEFAULT '{}'::jsonb,
  motor JSONB NOT NULL DEFAULT '{}'::jsonb,
  comentarios TEXT,
  imagenes_carroceria TEXT[] DEFAULT ARRAY[]::TEXT[],
  firma_cliente TEXT,
  firma_encargado TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hojas_ingreso ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Taller employees can view their taller's hojas ingreso"
ON public.hojas_ingreso
FOR SELECT
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can create hojas ingreso"
ON public.hojas_ingreso
FOR INSERT
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's hojas ingreso"
ON public.hojas_ingreso
FOR UPDATE
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's hojas ingreso"
ON public.hojas_ingreso
FOR DELETE
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all hojas ingreso"
ON public.hojas_ingreso
FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_hojas_ingreso_updated_at
BEFORE UPDATE ON public.hojas_ingreso
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();