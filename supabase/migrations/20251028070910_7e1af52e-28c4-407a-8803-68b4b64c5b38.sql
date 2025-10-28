-- Crear el tipo taller_status solo si no existe
DO $$ BEGIN
  CREATE TYPE public.taller_status AS ENUM ('pendiente', 'aprobado', 'rechazado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Agregar campo status a la tabla talleres si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'talleres' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.talleres
    ADD COLUMN status public.taller_status NOT NULL DEFAULT 'pendiente';
  END IF;
END $$;

-- Modificar el trigger para NO crear user_roles automáticamente para talleres
-- Solo crear el registro en talleres y dejarlo pendiente de aprobación
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_type text;
  v_taller_id uuid;
  v_aseguradora_id uuid;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
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
      descripcion,
      status
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
      NEW.raw_user_meta_data->>'descripcion',
      'pendiente'::taller_status
    )
    RETURNING id INTO v_taller_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear función para aprobar talleres
CREATE OR REPLACE FUNCTION public.approve_taller(taller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  UPDATE public.talleres
  SET status = 'aprobado'::taller_status
  WHERE id = taller_id_param;
  
  INSERT INTO public.user_roles (user_id, role, taller_id)
  VALUES (v_user_id, 'admin_taller'::app_role, taller_id_param)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Crear función para rechazar talleres
CREATE OR REPLACE FUNCTION public.reject_taller(taller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role('super_admin'::app_role, auth.uid()) THEN
    RAISE EXCEPTION 'Solo super administradores pueden rechazar talleres';
  END IF;
  
  UPDATE public.talleres
  SET status = 'rechazado'::taller_status
  WHERE id = taller_id_param;
END;
$$;

-- Políticas RLS
DROP POLICY IF EXISTS "Super admins can view all talleres" ON public.talleres;
CREATE POLICY "Super admins can view all talleres"
ON public.talleres
FOR SELECT
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()));

DROP POLICY IF EXISTS "Super admins can update talleres status" ON public.talleres;
CREATE POLICY "Super admins can update talleres status"
ON public.talleres
FOR UPDATE
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()));