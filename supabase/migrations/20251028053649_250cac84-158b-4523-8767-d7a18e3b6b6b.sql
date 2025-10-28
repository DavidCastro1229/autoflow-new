-- Fix infinite recursion in user_roles policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Admin taller can view their taller users" ON public.user_roles;
DROP POLICY IF EXISTS "Admin taller can create taller users" ON public.user_roles;
DROP POLICY IF EXISTS "Admin taller can update their taller users" ON public.user_roles;
DROP POLICY IF EXISTS "Admin taller can delete their taller users" ON public.user_roles;

-- Create simpler policies without circular dependencies
-- Admin taller can manage user_roles for their taller_id
CREATE POLICY "Admin taller can view users with their taller_id"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  taller_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
  )
);

CREATE POLICY "Admin taller can insert users with their taller_id"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
  )
  AND role IN ('taller', 'admin_taller')
);

CREATE POLICY "Admin taller can update users with their taller_id"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  taller_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
  )
);

CREATE POLICY "Admin taller can delete users with their taller_id"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  taller_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.talleres
    WHERE talleres.id = user_roles.taller_id
    AND talleres.user_id = auth.uid()
  )
);