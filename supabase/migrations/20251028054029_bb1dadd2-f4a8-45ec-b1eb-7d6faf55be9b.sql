-- Remove ALL existing policies on user_roles
DROP POLICY IF EXISTS "Users can view roles from same taller" ON public.user_roles;
DROP POLICY IF EXISTS "Users with taller_id can manage users in same taller" ON public.user_roles;

-- Create fresh, simple policies without circular dependencies
-- Policy 1: Users can always view their own role (CRITICAL)
CREATE POLICY "view_own_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can view other users from the same taller
CREATE POLICY "view_same_taller_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  taller_id IS NOT NULL 
  AND taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Policy 3: Manage users in same taller (INSERT, UPDATE, DELETE)
CREATE POLICY "manage_same_taller_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  taller_id IS NOT NULL
  AND taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IS NOT NULL
  AND taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
  AND role IN ('taller', 'admin_taller')
);