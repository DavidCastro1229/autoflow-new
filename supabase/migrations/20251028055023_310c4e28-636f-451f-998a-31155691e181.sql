-- Remove the problematic recursive policy
DROP POLICY IF EXISTS "Users with taller can manage users in same taller" ON public.user_roles;

-- The edge function already handles taller user management with service role
-- Only keep the simple, non-recursive policies:
-- 1. view_own_role (already exists)
-- 2. Super admins can manage user roles (already exists, uses security definer function)