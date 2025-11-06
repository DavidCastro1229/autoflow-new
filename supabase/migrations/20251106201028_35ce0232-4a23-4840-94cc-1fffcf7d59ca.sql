-- Create enum for cita status
CREATE TYPE estado_cita AS ENUM ('programada', 'confirmada', 'completada', 'cancelada');

-- Add estado column to citas table
ALTER TABLE public.citas
  ADD COLUMN estado estado_cita NOT NULL DEFAULT 'programada';