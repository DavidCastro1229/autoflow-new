-- Function to update expired trials
CREATE OR REPLACE FUNCTION public.update_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE talleres
  SET estado_suscripcion = 'expirado'
  WHERE estado_suscripcion = 'prueba'
    AND fecha_fin_prueba < now()
    AND fecha_fin_prueba IS NOT NULL;
END;
$$;

-- Modify approve_taller function to initialize trial dates
CREATE OR REPLACE FUNCTION public.approve_taller(taller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT has_role('super_admin'::app_role, auth.uid()) THEN
    RAISE EXCEPTION 'Solo super administradores pueden aprobar talleres';
  END IF;
  
  SELECT user_id INTO v_user_id
  FROM public.talleres
  WHERE id = taller_id_param;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Taller no encontrado';
  END IF;
  
  -- Update taller status and initialize trial dates
  UPDATE public.talleres
  SET 
    status = 'aprobado'::taller_status,
    estado_suscripcion = 'prueba',
    fecha_inicio_prueba = now(),
    fecha_fin_prueba = now() + interval '15 days'
  WHERE id = taller_id_param;
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role, taller_id)
  VALUES (v_user_id, 'admin_taller'::app_role, taller_id_param)
  ON CONFLICT DO NOTHING;
END;
$$;