-- Create storage bucket for fleet logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('flota-logos', 'flota-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for flota-logos bucket
CREATE POLICY "Anyone can view fleet logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'flota-logos');

CREATE POLICY "Taller employees can upload fleet logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flota-logos' AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE taller_id IS NOT NULL
  )
);

CREATE POLICY "Taller employees can update fleet logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'flota-logos' AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE taller_id IS NOT NULL
  )
);

CREATE POLICY "Taller employees can delete fleet logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'flota-logos' AND
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE taller_id IS NOT NULL
  )
);