-- Crear política para que aseguradoras puedan ver clientes de talleres afiliados
CREATE POLICY "Aseguradoras can view clients from affiliated talleres"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM taller_aseguradoras ta
    JOIN aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = clientes.taller_id
    AND a.user_id = auth.uid()
  )
);