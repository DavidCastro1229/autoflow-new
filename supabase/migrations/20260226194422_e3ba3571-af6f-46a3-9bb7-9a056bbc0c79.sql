
CREATE OR REPLACE FUNCTION public.approve_flota(flota_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_flota_id uuid;
BEGIN
  SELECT f.user_id, f.id INTO v_user_id, v_flota_id
  FROM public.flotas f
  WHERE f.id = flota_id AND f.status = 'pendiente'::taller_status;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Flota not found or already processed';
  END IF;
  
  UPDATE public.flotas SET status = 'aprobado'::taller_status WHERE id = flota_id;
  
  -- Update existing role with flota_id or insert new one
  UPDATE public.user_roles 
  SET flota_id = v_flota_id, role = 'flota'::app_role
  WHERE user_id = v_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role, flota_id)
    VALUES (v_user_id, 'flota'::app_role, v_flota_id);
  END IF;
  
  -- Generate numero_flota
  UPDATE public.flotas 
  SET numero_flota = 'FLOT-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' || LEFT(flota_id::text, 8)
  WHERE id = flota_id;
END;
$function$;
