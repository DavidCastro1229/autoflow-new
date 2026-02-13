
-- Allow aseguradoras to delete their PENDING solicitudes
CREATE POLICY "Aseguradoras can delete pending solicitudes"
ON public.solicitudes_afiliacion
FOR DELETE
USING (
  aseguradora_id = get_aseguradora_id_for_user(auth.uid())
  AND estado = 'pendiente'::estado_solicitud_afiliacion
);

-- Allow aseguradoras to delete convenios of their pending solicitudes
CREATE POLICY "Aseguradoras can delete convenios of pending solicitudes"
ON public.convenios_afiliacion
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_afiliacion sa
    WHERE sa.id = convenios_afiliacion.solicitud_id
    AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid())
    AND sa.estado = 'pendiente'::estado_solicitud_afiliacion
  )
);
