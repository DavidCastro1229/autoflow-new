CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_taller_id uuid;
  v_aseguradora_id uuid;
  v_flota_id uuid;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF v_user_type = 'aseguradora' THEN
    INSERT INTO public.aseguradoras (
      user_id, nombre_aseguradora, rfc, telefono, direccion, ciudad, estado,
      codigo_postal, nombre_contacto, apellido_contacto, email, descripcion
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_aseguradora',
      NEW.raw_user_meta_data->>'rfc',
      NEW.raw_user_meta_data->>'telefono',
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'estado',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      NEW.email,
      NEW.raw_user_meta_data->>'descripcion'
    ) RETURNING id INTO v_aseguradora_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'aseguradora'::app_role);
    
  ELSIF v_user_type = 'taller' THEN
    INSERT INTO public.talleres (
      user_id, nombre_taller, telefono, direccion, ciudad, estado,
      codigo_postal, nombre_contacto, apellido_contacto, email, descripcion, status
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_taller',
      NEW.raw_user_meta_data->>'telefono',
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'estado',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      NEW.email,
      NEW.raw_user_meta_data->>'descripcion',
      'pendiente'::taller_status
    ) RETURNING id INTO v_taller_id;
    
  ELSIF v_user_type = 'flota' THEN
    INSERT INTO public.flotas (
      user_id, nombre_flota, razon_social, numero_rtn, telefono_contacto,
      correo_contacto, direccion_fisica, ciudad, codigo_postal,
      nombre_contacto, apellido_contacto, numero_flota, rubro_empresa, status, estado, tipo_flota
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_flota',
      COALESCE(NEW.raw_user_meta_data->>'razon_social', ''),
      COALESCE(NEW.raw_user_meta_data->>'numero_rtn', ''),
      NEW.raw_user_meta_data->>'telefono',
      NEW.email,
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      'PENDING',
      COALESCE(NEW.raw_user_meta_data->>'rubro_empresa', 'General'),
      'pendiente'::taller_status,
      'activa'::estado_flota,
      'propia'::tipo_flota
    ) RETURNING id INTO v_flota_id;
    
    INSERT INTO public.user_roles (user_id, role, flota_id)
    VALUES (NEW.id, 'flota'::app_role, v_flota_id);
    
  END IF;
  
  RETURN NEW;
END;
$$;