
-- Table for flota-taller association requests
CREATE TABLE public.flota_taller_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flota_id uuid REFERENCES public.flotas(id) ON DELETE CASCADE NOT NULL,
  taller_id uuid REFERENCES public.talleres(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pendiente',
  mensaje text,
  fecha_respuesta timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(flota_id, taller_id)
);

-- Add tipo_taller field to flotas
ALTER TABLE public.flotas ADD COLUMN tipo_taller text DEFAULT 'externo';

-- Enable RLS
ALTER TABLE public.flota_taller_solicitudes ENABLE ROW LEVEL SECURITY;

-- Flotas can see their own solicitudes
CREATE POLICY "Flotas can view own solicitudes"
ON public.flota_taller_solicitudes
FOR SELECT
TO authenticated
USING (
  flota_id IN (SELECT id FROM public.flotas WHERE user_id = auth.uid())
  OR taller_id IN (SELECT id FROM public.talleres WHERE user_id = auth.uid())
  OR public.has_role('super_admin'::app_role, auth.uid())
);

-- Flotas can insert solicitudes
CREATE POLICY "Flotas can insert solicitudes"
ON public.flota_taller_solicitudes
FOR INSERT
TO authenticated
WITH CHECK (
  flota_id IN (SELECT id FROM public.flotas WHERE user_id = auth.uid())
);

-- Talleres can update solicitudes (approve/reject)
CREATE POLICY "Talleres can update solicitudes"
ON public.flota_taller_solicitudes
FOR UPDATE
TO authenticated
USING (
  taller_id IN (SELECT id FROM public.talleres WHERE user_id = auth.uid())
  OR taller_id IN (
    SELECT ur.taller_id FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin_taller', 'taller')
  )
);

-- Flotas can delete their pending solicitudes
CREATE POLICY "Flotas can delete own pending solicitudes"
ON public.flota_taller_solicitudes
FOR DELETE
TO authenticated
USING (
  flota_id IN (SELECT id FROM public.flotas WHERE user_id = auth.uid())
  AND status = 'pendiente'
);

-- Updated_at trigger
CREATE TRIGGER update_flota_taller_solicitudes_updated_at
  BEFORE UPDATE ON public.flota_taller_solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
