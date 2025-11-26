-- Fix infinite recursion in aseguradoras RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Aseguradoras can view own data" ON public.aseguradoras;
DROP POLICY IF EXISTS "Aseguradoras can update own data" ON public.aseguradoras;
DROP POLICY IF EXISTS "Talleres can view aseguradoras" ON public.aseguradoras;
DROP POLICY IF EXISTS "Super admin full access to aseguradoras" ON public.aseguradoras;

-- Create simple, non-recursive policies
-- Aseguradoras can view and update their own record
CREATE POLICY "Aseguradoras can view own data"
ON public.aseguradoras
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Aseguradoras can update own data"
ON public.aseguradoras
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Talleres can view all aseguradoras (to request affiliation)
CREATE POLICY "Talleres can view aseguradoras"
ON public.aseguradoras
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'taller'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_taller'
  )
);

-- Super admin full access
CREATE POLICY "Super admin full access to aseguradoras"
ON public.aseguradoras
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);