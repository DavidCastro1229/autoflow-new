-- Add trial system to talleres table
CREATE TYPE estado_suscripcion AS ENUM ('prueba', 'activo', 'expirado');

ALTER TABLE talleres 
ADD COLUMN fecha_inicio_prueba timestamp with time zone,
ADD COLUMN fecha_fin_prueba timestamp with time zone,
ADD COLUMN estado_suscripcion estado_suscripcion DEFAULT 'prueba';

-- Function to check if trial is expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(taller_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN t.estado_suscripcion = 'activo' THEN false
      WHEN t.fecha_fin_prueba IS NULL THEN false
      WHEN t.fecha_fin_prueba < now() THEN true
      ELSE false
    END
  FROM talleres t
  WHERE t.id = taller_id;
$$;

-- Trigger to set trial dates when taller is created or approved
CREATE OR REPLACE FUNCTION public.set_trial_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set trial dates if they're not already set and estado_suscripcion is 'prueba'
  IF NEW.fecha_inicio_prueba IS NULL AND NEW.estado_suscripcion = 'prueba' THEN
    NEW.fecha_inicio_prueba := now();
    NEW.fecha_fin_prueba := now() + interval '15 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_trial_dates
BEFORE INSERT OR UPDATE ON talleres
FOR EACH ROW
EXECUTE FUNCTION set_trial_dates();