-- Create table for convenios (agreement terms between aseguradora and taller)
CREATE TABLE public.convenios_afiliacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL,
  
  -- Tarifas y descuentos
  tarifa_mo_mecanica NUMERIC NOT NULL DEFAULT 0,
  tarifa_mo_pintura NUMERIC NOT NULL DEFAULT 0,
  descuento_repuestos_b2b NUMERIC NOT NULL DEFAULT 0,
  regla_origen_piezas TEXT NOT NULL DEFAULT 'OEM',
  
  -- SLA Pre-producción (en horas)
  tiempo_max_inspeccion INTEGER NOT NULL DEFAULT 24,
  tiempo_max_traslado INTEGER NOT NULL DEFAULT 48,
  tiempo_max_presupuesto INTEGER NOT NULL DEFAULT 24,
  tiempo_max_autorizacion_tap INTEGER NOT NULL DEFAULT 24,
  
  -- SLA Logística y producción
  tiempo_max_auth_repuestos INTEGER NOT NULL DEFAULT 24,
  tiempo_max_entrega_repuestos INTEGER NOT NULL DEFAULT 5, -- dias
  tiempo_max_reparacion INTEGER NOT NULL DEFAULT 72,
  tiempo_max_auth_complementos INTEGER NOT NULL DEFAULT 12,
  
  -- Cierre y postventa
  tiempo_max_qc_final INTEGER NOT NULL DEFAULT 4,
  dias_credito_pago INTEGER NOT NULL DEFAULT 30,
  duracion_garantia_meses INTEGER NOT NULL DEFAULT 12,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT convenios_afiliacion_solicitud_id_fkey 
    FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes_afiliacion(id) ON DELETE CASCADE,
  CONSTRAINT convenios_afiliacion_solicitud_id_unique UNIQUE (solicitud_id),
  CONSTRAINT convenios_regla_origen_check CHECK (regla_origen_piezas IN ('OEM', 'Certificada'))
);

-- Enable RLS
ALTER TABLE public.convenios_afiliacion ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convenios_afiliacion
CREATE POLICY "Super admins can manage all convenios"
ON public.convenios_afiliacion
FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Aseguradoras can manage their convenios"
ON public.convenios_afiliacion
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_afiliacion sa
    WHERE sa.id = convenios_afiliacion.solicitud_id
    AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM solicitudes_afiliacion sa
    WHERE sa.id = convenios_afiliacion.solicitud_id
    AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid())
  )
);

CREATE POLICY "Talleres can view convenios for their solicitudes"
ON public.convenios_afiliacion
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_afiliacion sa
    WHERE sa.id = convenios_afiliacion.solicitud_id
    AND sa.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_convenios_afiliacion_updated_at
BEFORE UPDATE ON public.convenios_afiliacion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies on solicitudes_afiliacion to allow aseguradoras to create
DROP POLICY IF EXISTS "Talleres can create solicitudes" ON public.solicitudes_afiliacion;

-- Now aseguradoras can create solicitudes (inverted flow)
CREATE POLICY "Aseguradoras can create solicitudes"
ON public.solicitudes_afiliacion
FOR INSERT
WITH CHECK (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));

-- Talleres can now update solicitudes (accept/reject)
CREATE POLICY "Talleres can update their solicitudes"
ON public.solicitudes_afiliacion
FOR UPDATE
USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));