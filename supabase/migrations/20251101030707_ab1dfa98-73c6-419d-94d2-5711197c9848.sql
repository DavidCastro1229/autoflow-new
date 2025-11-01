-- Create enum for tipo_contrato
CREATE TYPE tipo_contrato AS ENUM ('arrendamiento', 'propiedad', 'subcontratacion');

-- Create categorias_servicio table
CREATE TABLE public.categorias_servicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default categorias
INSERT INTO public.categorias_servicio (nombre) VALUES
  ('Mantenimiento'),
  ('Diagnostico'),
  ('Reparacion'),
  ('Carroceria'),
  ('Estetica'),
  ('Pintura'),
  ('Vidrios'),
  ('Chasis'),
  ('Mecanica'),
  ('Aire Acondicionado'),
  ('Estructural');

-- Create flota_datos_bancarios table
CREATE TABLE public.flota_datos_bancarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flota_id uuid NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  entidad_bancaria text NOT NULL,
  cuenta_bancaria text NOT NULL,
  tipo_cuenta text NOT NULL,
  moneda text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create flota_datos_negociacion table
CREATE TABLE public.flota_datos_negociacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flota_id uuid NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  tipo_contrato tipo_contrato NOT NULL,
  fecha_inicio date NOT NULL,
  duracion_contrato text NOT NULL,
  tarifa_precios numeric,
  tarifa_descuento numeric,
  descuento_pronto_pago numeric,
  credito_autorizado_por text,
  dias_credito_autorizado integer,
  porcentaje_cobro_mora numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create flota_tarifas_servicio table
CREATE TABLE public.flota_tarifas_servicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flota_id uuid NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  categoria_servicio_id uuid NOT NULL REFERENCES public.categorias_servicio(id) ON DELETE CASCADE,
  tarifa numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(flota_id, categoria_servicio_id)
);

-- Create flota_terminos_politicas table
CREATE TABLE public.flota_terminos_politicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flota_id uuid NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  politicas_uso_vehiculos text[],
  politicas_combustible text[],
  seguros_covertura text[],
  politicas_renovacion text[],
  politicas_condiciones_uso text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create storage bucket for flota policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('flota-politicas', 'flota-politicas', false);

-- Enable RLS on new tables
ALTER TABLE public.flota_datos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_datos_negociacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_tarifas_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_terminos_politicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_servicio ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categorias_servicio
CREATE POLICY "Authenticated users can view categorias"
  ON public.categorias_servicio FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage categorias"
  ON public.categorias_servicio FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- RLS Policies for flota_datos_bancarios
CREATE POLICY "Super admins can manage all datos bancarios"
  ON public.flota_datos_bancarios FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage datos bancarios"
  ON public.flota_datos_bancarios FOR ALL
  TO authenticated
  USING (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for flota_datos_negociacion
CREATE POLICY "Super admins can manage all datos negociacion"
  ON public.flota_datos_negociacion FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage datos negociacion"
  ON public.flota_datos_negociacion FOR ALL
  TO authenticated
  USING (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for flota_tarifas_servicio
CREATE POLICY "Super admins can manage all tarifas servicio"
  ON public.flota_tarifas_servicio FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage tarifas servicio"
  ON public.flota_tarifas_servicio FOR ALL
  TO authenticated
  USING (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for flota_terminos_politicas
CREATE POLICY "Super admins can manage all terminos politicas"
  ON public.flota_terminos_politicas FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage terminos politicas"
  ON public.flota_terminos_politicas FOR ALL
  TO authenticated
  USING (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    flota_id IN (
      SELECT id FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Storage policies for flota-politicas bucket
CREATE POLICY "Users can view their taller's flota policies"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'flota-politicas' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload their taller's flota policies"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'flota-politicas' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their taller's flota policies"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'flota-politicas' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their taller's flota policies"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'flota-politicas' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.flotas
      WHERE taller_id IN (
        SELECT taller_id FROM public.user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_flota_datos_bancarios_updated_at
  BEFORE UPDATE ON public.flota_datos_bancarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_datos_negociacion_updated_at
  BEFORE UPDATE ON public.flota_datos_negociacion
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_tarifas_servicio_updated_at
  BEFORE UPDATE ON public.flota_tarifas_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_terminos_politicas_updated_at
  BEFORE UPDATE ON public.flota_terminos_politicas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_servicio_updated_at
  BEFORE UPDATE ON public.categorias_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();