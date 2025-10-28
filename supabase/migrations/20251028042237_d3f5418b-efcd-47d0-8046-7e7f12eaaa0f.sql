-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert existing roles
INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Administrador del sistema con acceso completo'),
  ('admin_taller', 'Administrador de taller'),
  ('taller', 'Usuario de taller'),
  ('aseguradora', 'Usuario de aseguradora');

-- Enable RLS on roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles are viewable by everyone"
ON public.roles FOR SELECT
USING (true);

-- Create new user_roles table structure
CREATE TABLE public.user_roles_new (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Migrate existing data from old user_roles to new structure
INSERT INTO public.user_roles_new (user_id, role_id, created_at)
SELECT 
  ur.user_id,
  r.id,
  ur.created_at
FROM public.user_roles ur
INNER JOIN public.roles r ON r.name = ur.role::text;

-- Drop old policies before dropping table
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Drop old user_roles table
DROP TABLE public.user_roles;

-- Rename new table to user_roles
ALTER TABLE public.user_roles_new RENAME TO user_roles;

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    INNER JOIN public.roles r ON ur2.role_id = r.id
    WHERE ur2.user_id = auth.uid() AND r.name = 'super_admin'
  )
);

CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2
    INNER JOIN public.roles r ON ur2.role_id = r.id
    WHERE ur2.user_id = auth.uid() AND r.name = 'super_admin'
  )
);

-- Create policy for super admins to manage roles
CREATE POLICY "Only super admins can manage roles"
ON public.roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'super_admin'
  )
);

-- Create new version of has_role that accepts text
CREATE OR REPLACE FUNCTION public.has_role_text(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
  )
$$;

-- Update all policies to use the new text-based function

-- Profiles policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role_text(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all profiles"
ON public.profiles FOR UPDATE
USING (has_role_text(auth.uid(), 'super_admin'));

-- Talleres policies
DROP POLICY IF EXISTS "Super admins can view all talleres" ON public.talleres;
DROP POLICY IF EXISTS "Super admins can manage talleres" ON public.talleres;
DROP POLICY IF EXISTS "Aseguradoras can view assigned talleres" ON public.talleres;

CREATE POLICY "Super admins can view all talleres"
ON public.talleres FOR SELECT
USING (has_role_text(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage talleres"
ON public.talleres FOR ALL
USING (has_role_text(auth.uid(), 'super_admin'));

CREATE POLICY "Aseguradoras can view assigned talleres"
ON public.talleres FOR SELECT
USING (
  has_role_text(auth.uid(), 'aseguradora') AND
  EXISTS (
    SELECT 1 FROM public.taller_aseguradoras ta
    INNER JOIN public.aseguradoras a ON ta.aseguradora_id = a.id
    WHERE ta.taller_id = talleres.id AND a.user_id = auth.uid()
  )
);

-- Aseguradoras policies
DROP POLICY IF EXISTS "Super admins can view all aseguradoras" ON public.aseguradoras;
DROP POLICY IF EXISTS "Super admins can manage aseguradoras" ON public.aseguradoras;
DROP POLICY IF EXISTS "Talleres can view assigned aseguradoras" ON public.aseguradoras;

CREATE POLICY "Super admins can view all aseguradoras"
ON public.aseguradoras FOR SELECT
USING (has_role_text(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage aseguradoras"
ON public.aseguradoras FOR ALL
USING (has_role_text(auth.uid(), 'super_admin'));

CREATE POLICY "Talleres can view assigned aseguradoras"
ON public.aseguradoras FOR SELECT
USING (
  has_role_text(auth.uid(), 'admin_taller') AND
  EXISTS (
    SELECT 1 FROM public.taller_aseguradoras ta
    INNER JOIN public.talleres t ON ta.taller_id = t.id
    WHERE ta.aseguradora_id = aseguradoras.id AND t.user_id = auth.uid()
  )
);

-- Taller_aseguradoras policies
DROP POLICY IF EXISTS "Super admins can manage taller_aseguradoras" ON public.taller_aseguradoras;

CREATE POLICY "Super admins can manage taller_aseguradoras"
ON public.taller_aseguradoras FOR ALL
USING (has_role_text(auth.uid(), 'super_admin'));

-- Drop old has_role function that uses enum
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Rename new function to has_role
ALTER FUNCTION public.has_role_text(uuid, text) RENAME TO has_role;

-- Update handle_new_user function to use new structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_role_id uuid;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF v_user_type = 'aseguradora' THEN
    -- Get aseguradora role id
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'aseguradora';
    
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
    );
  ELSE
    -- Get admin_taller role id
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'admin_taller';
    
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
    );
  END IF;
  
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, v_role_id);
  
  RETURN NEW;
END;
$$;

-- Now we can safely drop the enum
DROP TYPE IF EXISTS public.app_role CASCADE;