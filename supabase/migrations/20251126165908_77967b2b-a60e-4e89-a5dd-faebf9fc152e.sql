-- Allow aseguradoras to insert into taller_aseguradoras when approving affiliation requests
CREATE POLICY "Aseguradoras can create affiliations when approving"
ON public.taller_aseguradoras
FOR INSERT
TO authenticated
WITH CHECK (
  aseguradora_id = public.get_aseguradora_id_for_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.solicitudes_afiliacion sa
    WHERE sa.taller_id = taller_aseguradoras.taller_id
    AND sa.aseguradora_id = taller_aseguradoras.aseguradora_id
    AND sa.estado = 'pendiente'
  )
);