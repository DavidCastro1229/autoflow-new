-- Allow aseguradoras to view approved talleres for sending affiliation requests
CREATE POLICY "Aseguradoras can view approved talleres"
ON public.talleres
FOR SELECT
USING (
  status = 'aprobado' AND has_role('aseguradora'::app_role, auth.uid())
);

-- Allow talleres to insert into taller_aseguradoras when accepting a request
CREATE POLICY "Talleres can create affiliations when accepting"
ON public.taller_aseguradoras
FOR INSERT
WITH CHECK (
  taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM solicitudes_afiliacion sa
    WHERE sa.taller_id = taller_aseguradoras.taller_id
    AND sa.aseguradora_id = taller_aseguradoras.aseguradora_id
    AND sa.estado = 'pendiente'::estado_solicitud_afiliacion
  )
);