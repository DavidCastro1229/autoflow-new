-- Remove the complex policies that could still cause recursion
DROP POLICY IF EXISTS "view_same_taller_roles" ON public.user_roles;
DROP POLICY IF EXISTS "manage_same_taller_roles" ON public.user_roles;

-- Keep ONLY the simplest policies
-- Users MUST be able to see their own role (without any complex checks)
-- This is already created above, so we're good

-- For admin operations, we rely on the edge function which uses service role
-- No RLS policies needed for insert/update/delete since the edge function bypasses RLS