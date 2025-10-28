-- Drop existing problematic policies on user_roles
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create new policies using the security definer function to avoid recursion
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));