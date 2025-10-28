-- Add email column to taller_empleados
ALTER TABLE public.taller_empleados
ADD COLUMN IF NOT EXISTS email TEXT;