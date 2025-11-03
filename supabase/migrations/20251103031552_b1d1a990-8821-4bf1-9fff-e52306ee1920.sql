-- Create flota_vehiculos table for inventory
CREATE TABLE public.flota_vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flota_id uuid NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  numero_unidad text NOT NULL,
  marca_modelo text NOT NULL,
  numero_placa text NOT NULL,
  numero_vin text NOT NULL,
  anio_fabricacion integer NOT NULL,
  kilometraje_actual integer NOT NULL DEFAULT 0,
  estado_vehiculo text NOT NULL,
  fecha_ultimo_mantenimiento date,
  proximo_mantenimiento_programado date,
  historial_reparaciones text,
  conductores_asignados text,
  permiso_explotacion_unidad text,
  fecha_autorizacion_explotacion date,
  fecha_vencimiento_explotacion date,
  permiso_circulacion text,
  fecha_autorizacion_circulacion date,
  fecha_vencimiento_circulacion date,
  permiso_publicidad text,
  fecha_autorizacion_publicidad date,
  fecha_vencimiento_publicidad date,
  permisos_especiales text,
  fecha_autorizacion_especiales date,
  fecha_vencimiento_especiales date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create flota_conductores table
CREATE TABLE public.flota_conductores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flota_id uuid NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  -- Datos Generales
  nombre text NOT NULL,
  apellido text NOT NULL,
  cedula_identidad text NOT NULL,
  fecha_nacimiento date NOT NULL,
  direccion text NOT NULL,
  telefono text NOT NULL,
  correo text,
  estado_civil text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  -- Datos de Licencia
  numero_licencia text NOT NULL,
  tipo_licencia text NOT NULL,
  fecha_emision_licencia date NOT NULL,
  fecha_vencimiento_licencia date NOT NULL,
  restricciones_licencia text,
  -- Historia y Desempeño
  fecha_ingreso date NOT NULL,
  vehiculo_asignado_actual text,
  historial_asignaciones text,
  calificacion_desempeno numeric,
  observaciones_desempeno text,
  -- Gastos de Viáticos
  viaticos_autorizados numeric DEFAULT 0,
  limite_diario_viaticos numeric DEFAULT 0,
  notas_viaticos text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flota_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_conductores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flota_vehiculos
CREATE POLICY "Super admins can manage all vehiculos"
  ON public.flota_vehiculos FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage vehiculos"
  ON public.flota_vehiculos FOR ALL
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

-- RLS Policies for flota_conductores
CREATE POLICY "Super admins can manage all conductores"
  ON public.flota_conductores FOR ALL
  TO authenticated
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage conductores"
  ON public.flota_conductores FOR ALL
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

-- Triggers for updated_at
CREATE TRIGGER update_flota_vehiculos_updated_at
  BEFORE UPDATE ON public.flota_vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_conductores_updated_at
  BEFORE UPDATE ON public.flota_conductores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();