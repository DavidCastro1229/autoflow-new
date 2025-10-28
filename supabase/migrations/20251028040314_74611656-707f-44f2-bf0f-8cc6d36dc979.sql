-- Add columns to profiles table for aseguradoras
ALTER TABLE public.profiles
ADD COLUMN nombre_aseguradora text,
ADD COLUMN rfc text;

-- Update the handle_new_user function to detect user type and assign correct role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type text;
  v_assigned_role app_role;
BEGIN
  -- Get user type from metadata
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Determine role based on user type
  IF v_user_type = 'aseguradora' THEN
    v_assigned_role := 'aseguradora';
    
    -- Insert profile data for aseguradora
    INSERT INTO public.profiles (
      id,
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
    );
  ELSE
    -- Default to admin_taller for taller registrations
    v_assigned_role := 'admin_taller';
    
    -- Insert profile data for taller
    INSERT INTO public.profiles (
      id,
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
    );
  END IF;
  
  -- Assign the determined role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_assigned_role);
  
  RETURN NEW;
END;
$function$;