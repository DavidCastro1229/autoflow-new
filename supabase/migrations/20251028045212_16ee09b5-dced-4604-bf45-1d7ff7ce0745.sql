-- Step 1: Drop all policies that depend on has_role function
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all talleres" ON public.talleres;
DROP POLICY IF EXISTS "Super admins can manage talleres" ON public.talleres;
DROP POLICY IF EXISTS "Aseguradoras can view assigned talleres" ON public.talleres;
DROP POLICY IF EXISTS "Super admins can view all aseguradoras" ON public.aseguradoras;
DROP POLICY IF EXISTS "Super admins can manage aseguradoras" ON public.aseguradoras;
DROP POLICY IF EXISTS "Talleres can view assigned aseguradoras" ON public.aseguradoras;
DROP POLICY IF EXISTS "Super admins can manage taller_aseguradoras" ON public.taller_aseguradoras;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can manage roles" ON public.roles;

-- Step 2: Drop the old has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;

-- Step 3: Drop tables and recreate with correct structure
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Step 4: Create app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('taller', 'admin_taller', 'aseguradora', 'super_admin');
  END IF;
END $$;

-- Step 5: Create user_roles with role as enum
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create the new has_role function with correct signature
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 7: Recreate all policies with updated function calls

-- Policies for profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role('super_admin'::app_role, auth.uid()));

-- Policies for talleres
CREATE POLICY "Super admins can view all talleres"
ON public.talleres
FOR SELECT
USING (public.has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Super admins can manage talleres"
ON public.talleres
FOR ALL
USING (public.has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Aseguradoras can view assigned talleres"
ON public.talleres
FOR SELECT
USING (
  public.has_role('aseguradora'::app_role, auth.uid()) 
  AND EXISTS (
    SELECT 1
    FROM taller_aseguradoras ta
    JOIN aseguradoras a ON ta.aseguradora_id = a.id
    WHERE ta.taller_id = talleres.id 
      AND a.user_id = auth.uid()
  )
);

-- Policies for aseguradoras
CREATE POLICY "Super admins can view all aseguradoras"
ON public.aseguradoras
FOR SELECT
USING (public.has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Super admins can manage aseguradoras"
ON public.aseguradoras
FOR ALL
USING (public.has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Talleres can view assigned aseguradoras"
ON public.aseguradoras
FOR SELECT
USING (
  public.has_role('admin_taller'::app_role, auth.uid()) 
  AND EXISTS (
    SELECT 1
    FROM taller_aseguradoras ta
    JOIN talleres t ON ta.taller_id = t.id
    WHERE ta.aseguradora_id = aseguradoras.id 
      AND t.user_id = auth.uid()
  )
);

-- Policies for taller_aseguradoras
CREATE POLICY "Super admins can manage taller_aseguradoras"
ON public.taller_aseguradoras
FOR ALL
USING (public.has_role('super_admin'::app_role, auth.uid()));

-- Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Super admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.has_role('super_admin'::app_role, auth.uid()));