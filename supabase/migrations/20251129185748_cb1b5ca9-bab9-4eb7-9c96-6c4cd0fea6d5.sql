-- Crear política para que aseguradoras puedan ver vehículos de talleres afiliados
CREATE POLICY "Aseguradoras can view vehicles from affiliated talleres"
ON public.vehiculos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM taller_aseguradoras ta
    JOIN aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = vehiculos.taller_id
    AND a.user_id = auth.uid()
  )
);