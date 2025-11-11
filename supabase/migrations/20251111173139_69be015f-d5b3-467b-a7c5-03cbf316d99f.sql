-- Add trial system columns to talleres table (estado_suscripcion type already exists)
ALTER TABLE talleres 
ADD COLUMN IF NOT EXISTS fecha_inicio_prueba timestamp with time zone,
ADD COLUMN IF NOT EXISTS fecha_fin_prueba timestamp with time zone,
ADD COLUMN IF NOT EXISTS estado_suscripcion estado_suscripcion DEFAULT 'prueba';