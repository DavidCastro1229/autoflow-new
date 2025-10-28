-- Add taller_id to user_roles to link users with their taller
ALTER TABLE public.user_roles 
ADD COLUMN taller_id uuid REFERENCES public.talleres(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_user_roles_taller_id ON public.user_roles(taller_id);

-- Update RLS policies for user_roles to allow admin_taller to manage their taller users
DROP POLICY IF EXISTS "Super admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Users can view their own role
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin taller can view users from their taller
CREATE POLICY "Admin taller can view their taller users"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
);

-- Admin taller can insert users for their taller
CREATE POLICY "Admin taller can create taller users"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
  AND user_roles.role IN ('taller', 'admin_taller')
);

-- Admin taller can update users from their taller
CREATE POLICY "Admin taller can update their taller users"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
);

-- Admin taller can delete users from their taller
CREATE POLICY "Admin taller can delete their taller users"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
);

-- Super admins can manage all user roles
CREATE POLICY "Super admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role('super_admin', auth.uid()))
WITH CHECK (has_role('super_admin', auth.uid()));

-- Create a table to store additional user information for taller employees
CREATE TABLE IF NOT EXISTS public.taller_empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  taller_id uuid REFERENCES public.talleres(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  apellidos text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on taller_empleados
ALTER TABLE public.taller_empleados ENABLE ROW LEVEL SECURITY;

-- RLS policies for taller_empleados
CREATE POLICY "Users can view their own employee info"
ON public.taller_empleados
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin taller can view their employees"
ON public.taller_empleados
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = taller_empleados.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
);

CREATE POLICY "Admin taller can insert employees"
ON public.taller_empleados
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = taller_empleados.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
);

CREATE POLICY "Admin taller can update their employees"
ON public.taller_empleados
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = taller_empleados.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
);

CREATE POLICY "Admin taller can delete their employees"
ON public.taller_empleados
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = taller_empleados.taller_id
    AND talleres.user_id = auth.uid()
    AND has_role('admin_taller', auth.uid())
  )
);

CREATE POLICY "Super admins can manage all employees"
ON public.taller_empleados
FOR ALL
TO authenticated
USING (has_role('super_admin', auth.uid()))
WITH CHECK (has_role('super_admin', auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_taller_empleados_updated_at
BEFORE UPDATE ON public.taller_empleados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();