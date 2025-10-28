-- Drop problematic policies on talleres that cause infinite recursion
DROP POLICY IF EXISTS "Super admins can view all talleres" ON public.talleres;
DROP POLICY IF EXISTS "Super admins can manage talleres" ON public.talleres;
DROP POLICY IF EXISTS "Aseguradoras can view talleres through relationship" ON public.talleres;

-- Keep only the simple, non-recursive policies
-- Users can view their own taller (already exists)
-- Users can update their own taller (already exists)

-- Add a simple policy for admin_taller users to view their own taller
-- This avoids recursion by not calling any functions
CREATE POLICY "Admin taller can view own taller" ON public.talleres
FOR SELECT
USING (auth.uid() = user_id);