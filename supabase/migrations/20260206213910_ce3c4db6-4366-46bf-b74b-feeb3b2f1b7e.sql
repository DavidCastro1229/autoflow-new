-- Add signature columns to convenios_afiliacion table
ALTER TABLE public.convenios_afiliacion
ADD COLUMN firma_aseguradora TEXT,
ADD COLUMN firma_taller TEXT,
ADD COLUMN fecha_firma_aseguradora TIMESTAMP WITH TIME ZONE,
ADD COLUMN fecha_firma_taller TIMESTAMP WITH TIME ZONE;