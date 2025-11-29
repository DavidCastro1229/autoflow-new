-- Crear política para que aseguradoras puedan ver hojas de ingreso de talleres afiliados
CREATE POLICY "Aseguradoras can view hojas ingreso from affiliated talleres"
ON public.hojas_ingreso
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM taller_aseguradoras ta
    JOIN aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = hojas_ingreso.taller_id
    AND a.user_id = auth.uid()
  )
);