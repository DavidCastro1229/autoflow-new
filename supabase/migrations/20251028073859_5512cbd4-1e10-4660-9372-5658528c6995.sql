-- Create estado_vehiculo enum
DO $$ BEGIN
  CREATE TYPE public.estado_vehiculo AS ENUM ('activo', 'en_servicio', 'entregado', 'inactivo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create vehiculos table
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL,
  placa TEXT NOT NULL,
  color TEXT NOT NULL,
  estado estado_vehiculo NOT NULL DEFAULT 'activo',
  vin TEXT NOT NULL,
  kilometraje INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(taller_id, placa)
);

-- Enable RLS
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Taller employees can view their taller's vehicles"
  ON public.vehiculos
  FOR SELECT
  USING (
    taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Taller employees can manage their taller's vehicles"
  ON public.vehiculos
  FOR ALL
  USING (
    taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all vehicles"
  ON public.vehiculos
  FOR ALL
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_vehiculos_updated_at
  BEFORE UPDATE ON public.vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();