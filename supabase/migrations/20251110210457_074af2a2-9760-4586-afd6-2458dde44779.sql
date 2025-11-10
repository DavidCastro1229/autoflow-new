-- Create enum types for cotizaciones
CREATE TYPE estado_cotizacion AS ENUM ('pendiente', 'aprobada', 'rechazada', 'convertida_a_orden');
CREATE TYPE operacion_parte AS ENUM ('corregir', 'reparar', 'cambiar');

-- Create cotizaciones table
CREATE TABLE public.cotizaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_cotizacion TEXT NOT NULL UNIQUE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_id UUID NOT NULL,
  vehiculo_id UUID NOT NULL,
  estado estado_cotizacion NOT NULL DEFAULT 'pendiente',
  taller_id UUID NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cotizacion_partes table
CREATE TABLE public.cotizacion_partes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL,
  categoria_id UUID NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  descripcion TEXT NOT NULL,
  operacion operacion_parte NOT NULL,
  tipo_material TEXT NOT NULL,
  tipo_reparacion TEXT NOT NULL,
  dias INTEGER NOT NULL DEFAULT 0,
  horas INTEGER NOT NULL DEFAULT 0,
  mano_obra NUMERIC NOT NULL DEFAULT 0,
  materiales NUMERIC NOT NULL DEFAULT 0,
  repuestos NUMERIC NOT NULL DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_partes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cotizaciones
CREATE POLICY "Super admins can manage all cotizaciones"
  ON public.cotizaciones
  FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their taller's cotizaciones"
  ON public.cotizaciones
  FOR SELECT
  TO authenticated
  USING (
    taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Taller employees can create cotizaciones for their taller"
  ON public.cotizaciones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Taller employees can update their taller's cotizaciones"
  ON public.cotizaciones
  FOR UPDATE
  TO authenticated
  USING (
    taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Taller employees can delete their taller's cotizaciones"
  ON public.cotizaciones
  FOR DELETE
  TO authenticated
  USING (
    taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Aseguradoras can view cotizaciones"
  ON public.cotizaciones
  FOR SELECT
  TO authenticated
  USING (has_role('aseguradora'::app_role, auth.uid()));

-- RLS Policies for cotizacion_partes
CREATE POLICY "Super admins can manage all cotizacion partes"
  ON public.cotizacion_partes
  FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their cotizacion partes"
  ON public.cotizacion_partes
  FOR SELECT
  TO authenticated
  USING (
    cotizacion_id IN (
      SELECT id FROM cotizaciones WHERE taller_id IN (
        SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Taller employees can manage their cotizacion partes"
  ON public.cotizacion_partes
  FOR ALL
  TO authenticated
  USING (
    cotizacion_id IN (
      SELECT id FROM cotizaciones WHERE taller_id IN (
        SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    cotizacion_id IN (
      SELECT id FROM cotizaciones WHERE taller_id IN (
        SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Aseguradoras can view cotizacion partes"
  ON public.cotizacion_partes
  FOR SELECT
  TO authenticated
  USING (
    cotizacion_id IN (
      SELECT id FROM cotizaciones WHERE has_role('aseguradora'::app_role, auth.uid())
    )
  );

-- Create function to generate codigo_cotizacion
CREATE OR REPLACE FUNCTION public.generate_codigo_cotizacion()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  cotizacion_code TEXT;
  current_year TEXT;
  current_month TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  current_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  SELECT COUNT(*) + 1 INTO next_number 
  FROM public.cotizaciones 
  WHERE codigo_cotizacion LIKE 'COT-' || current_year || '-' || current_month || '-%';
  
  cotizacion_code := 'COT-' || current_year || '-' || current_month || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN cotizacion_code;
END;
$$;

-- Create updated_at triggers
CREATE TRIGGER update_cotizaciones_updated_at
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cotizacion_partes_updated_at
  BEFORE UPDATE ON public.cotizacion_partes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();