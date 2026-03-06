
-- Allow taller users to view flotas that have solicitudes to their taller
CREATE POLICY "Taller users can view flotas with solicitudes"
ON public.flotas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flota_taller_solicitudes fts
    JOIN public.user_roles ur ON ur.taller_id = fts.taller_id AND ur.user_id = auth.uid()
    WHERE fts.flota_id = flotas.id
    AND ur.role IN ('taller', 'admin_taller')
  )
);

-- Allow taller users to view solicitudes for their taller
CREATE POLICY "Taller users can view their solicitudes"
ON public.flota_taller_solicitudes
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT ur.taller_id FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('taller', 'admin_taller')
  )
);

-- Allow taller users to update solicitudes for their taller (approve/reject)
CREATE POLICY "Taller users can update their solicitudes"
ON public.flota_taller_solicitudes
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT ur.taller_id FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('taller', 'admin_taller')
  )
)
WITH CHECK (
  taller_id IN (
    SELECT ur.taller_id FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('taller', 'admin_taller')
  )
);
