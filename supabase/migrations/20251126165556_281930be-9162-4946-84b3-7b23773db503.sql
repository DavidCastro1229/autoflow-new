-- Allow aseguradoras to view talleres that have sent them affiliation requests
CREATE POLICY "Aseguradoras can view talleres with solicitudes"
ON public.talleres
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes_afiliacion sa
    WHERE sa.taller_id = talleres.id
    AND sa.aseguradora_id = public.get_aseguradora_id_for_user(auth.uid())
  )
);