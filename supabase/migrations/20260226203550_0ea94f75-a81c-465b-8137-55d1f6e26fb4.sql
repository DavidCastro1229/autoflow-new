
-- RLS policies for flota-politicas storage bucket
CREATE POLICY "Flota users can upload their PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flota-politicas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM flotas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Flota users can view their PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'flota-politicas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM flotas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Flota users can delete their PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'flota-politicas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM flotas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can manage flota PDFs"
ON storage.objects FOR ALL
USING (
  bucket_id = 'flota-politicas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id = 'flota-politicas' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Super admins can manage all flota PDFs"
ON storage.objects FOR ALL
USING (
  bucket_id = 'flota-politicas' AND
  has_role('super_admin'::app_role, auth.uid())
)
WITH CHECK (
  bucket_id = 'flota-politicas' AND
  has_role('super_admin'::app_role, auth.uid())
);
