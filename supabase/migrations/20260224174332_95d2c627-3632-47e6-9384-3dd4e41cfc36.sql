
-- 1. Add 'flota' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'flota';

-- 2. Add user_id and status to flotas table, make taller_id nullable
ALTER TABLE public.flotas ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.flotas ADD COLUMN IF NOT EXISTS status public.taller_status NOT NULL DEFAULT 'pendiente'::taller_status;
ALTER TABLE public.flotas ADD COLUMN IF NOT EXISTS nombre_contacto text;
ALTER TABLE public.flotas ADD COLUMN IF NOT EXISTS apellido_contacto text;
ALTER TABLE public.flotas ADD COLUMN IF NOT EXISTS ciudad text;
ALTER TABLE public.flotas ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE public.flotas ADD COLUMN IF NOT EXISTS codigo_postal text;
ALTER TABLE public.flotas ALTER COLUMN taller_id DROP NOT NULL;

-- 3. Add flota_id to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS flota_id uuid;

-- 4. Update handle_new_user to support flota registration
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
      correo_contacto, direccion_fisica, ciudad, estado, codigo_postal,
      nombre_contacto, apellido_contacto, numero_flota, rubro_empresa, status
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_flota',
      COALESCE(NEW.raw_user_meta_data->>'razon_social', ''),
      COALESCE(NEW.raw_user_meta_data->>'numero_rtn', ''),
      NEW.raw_user_meta_data->>'telefono',
      NEW.email,
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'estado',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      'PENDING',
      COALESCE(NEW.raw_user_meta_data->>'rubro_empresa', 'General'),
      'pendiente'::taller_status
    ) RETURNING id INTO v_flota_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Create approve/reject functions for flotas
CREATE OR REPLACE FUNCTION public.approve_flota(flota_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role, flota_id)
  VALUES (v_user_id, 'flota'::app_role, v_flota_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Generate numero_flota
  UPDATE public.flotas 
  SET numero_flota = 'FLOT-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' || LEFT(flota_id::text, 8)
  WHERE id = flota_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_flota(flota_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.flotas SET status = 'rechazado'::taller_status WHERE id = flota_id AND status = 'pendiente'::taller_status;
END;
$$;

-- 6. RLS policies for flota users on flotas table
CREATE POLICY "Flota users can view their own flota"
ON public.flotas
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Flota users can update their own flota"
ON public.flotas
FOR UPDATE
USING (auth.uid() = user_id);

-- 7. RLS policies for flota users on related tables
-- flota_jefe
CREATE POLICY "Flota users can manage their own jefe"
ON public.flota_jefe
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_departamentos
CREATE POLICY "Flota users can manage their own departamentos"
ON public.flota_departamentos
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_comunicacion_interna
CREATE POLICY "Flota users can manage their own comunicacion interna"
ON public.flota_comunicacion_interna
FOR ALL
USING (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid()))
WITH CHECK (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid()));

-- flota_comunicacion_externa
CREATE POLICY "Flota users can manage their own comunicacion externa"
ON public.flota_comunicacion_externa
FOR ALL
USING (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid()))
WITH CHECK (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid()));

-- flota_datos_bancarios
CREATE POLICY "Flota users can manage their own datos bancarios"
ON public.flota_datos_bancarios
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_datos_negociacion
CREATE POLICY "Flota users can manage their own datos negociacion"
ON public.flota_datos_negociacion
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_tarifas_servicio
CREATE POLICY "Flota users can manage their own tarifas"
ON public.flota_tarifas_servicio
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_terminos_politicas
CREATE POLICY "Flota users can manage their own terminos"
ON public.flota_terminos_politicas
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_conductores
CREATE POLICY "Flota users can manage their own conductores"
ON public.flota_conductores
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_propietarios
CREATE POLICY "Flota users can manage their own propietarios"
ON public.flota_propietarios
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- flota_vehiculos
CREATE POLICY "Flota users can manage their own vehiculos"
ON public.flota_vehiculos
FOR ALL
USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()))
WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));

-- 8. Helper function to get flota_id for a user
CREATE OR REPLACE FUNCTION public.get_flota_id_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.flotas WHERE user_id = p_user_id LIMIT 1;
$$;
