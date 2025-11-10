-- Create storage bucket for taller logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('taller-logos', 'taller-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Add logo_url column to talleres table if it doesn't exist
ALTER TABLE public.talleres 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- RLS policies for taller-logos bucket
CREATE POLICY "Public can view taller logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'taller-logos');

CREATE POLICY "Taller admins can upload their logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'taller-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE role IN ('admin_taller', 'super_admin')
  )
);

CREATE POLICY "Taller admins can update their logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'taller-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE role IN ('admin_taller', 'super_admin')
  )
);

CREATE POLICY "Taller admins can delete their logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'taller-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE role IN ('admin_taller', 'super_admin')
  )
);