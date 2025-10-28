-- Fix handle_new_user to properly set taller_id in user_roles

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_taller_id uuid;
  v_aseguradora_id uuid;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Only create taller/aseguradora records for users with explicit user_type
  IF v_user_type = 'aseguradora' THEN
    INSERT INTO public.aseguradoras (
      user_id,
      nombre_aseguradora,
      rfc,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      nombre_contacto,
      apellido_contacto,
      email,
      descripcion
    )
    VALUES (
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
    )
    RETURNING id INTO v_aseguradora_id;
    
    -- Create user_roles with aseguradora role (no taller_id)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'aseguradora'::app_role);
    
  ELSIF v_user_type = 'taller' THEN
    INSERT INTO public.talleres (
      user_id,
      nombre_taller,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      nombre_contacto,
      apellido_contacto,
      email,
      descripcion
    )
    VALUES (
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
      NEW.raw_user_meta_data->>'descripcion'
    )
    RETURNING id INTO v_taller_id;
    
    -- Create user_roles with admin_taller role and the taller_id
    INSERT INTO public.user_roles (user_id, role, taller_id)
    VALUES (NEW.id, 'admin_taller'::app_role, v_taller_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();