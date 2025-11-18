-- Add genero column to equipo table
ALTER TABLE public.equipo ADD COLUMN IF NOT EXISTS genero text;