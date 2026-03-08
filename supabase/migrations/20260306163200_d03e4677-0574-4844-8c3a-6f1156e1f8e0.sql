
-- Allow flota users to view approved talleres (for association requests)
CREATE POLICY "Flota users can view approved talleres"
ON public.talleres
FOR SELECT
TO authenticated
USING (
  status = 'aprobado'::taller_status
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'flota'::app_role
  )
);
