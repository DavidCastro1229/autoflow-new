-- Fix the syntax error and the circular dependency issue
-- Drop problematic policies
DROP POLICY IF EXISTS "Admin taller can view users with their taller_id" ON public.user_roles;
DROP POLICY IF EXISTS "Admin taller can insert users with their taller_id" ON public.user_roles;
DROP POLICY IF EXISTS "Admin taller can update users with their taller_id" ON public.user_roles;
DROP POLICY IF EXISTS "Admin taller can delete users with their taller_id" ON public.user_roles;

-- Also drop the has_role policies from talleres that cause the circular dependency
DROP POLICY IF EXISTS "Aseguradoras can view assigned talleres" ON public.talleres;
DROP POLICY IF EXISTS "Admin taller can view their employees" ON public.taller_empleados;
DROP POLICY IF EXISTS "Admin taller can insert employees" ON public.taller_empleados;
DROP POLICY IF EXISTS "Admin taller can update their employees" ON public.taller_empleados;
DROP POLICY IF EXISTS "Admin taller can delete their employees" ON public.taller_empleados;

-- Simple policies for user_roles without circular dependencies
CREATE POLICY "Users can view roles from same taller"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  taller_id IS NOT NULL 
  AND taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users with taller can manage users in same taller"
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

-- Simple policies for taller_empleados without using has_role
CREATE POLICY "Employees can view from same taller"
ON public.taller_empleados
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users with taller can manage employees"
ON public.taller_empleados
FOR ALL
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Recreate talleres policy without has_role to break the cycle
CREATE POLICY "Aseguradoras can view talleres through relationship"
ON public.talleres
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM taller_aseguradoras ta
    JOIN aseguradoras a ON ta.aseguradora_id = a.id
    WHERE ta.taller_id = talleres.id
    AND a.user_id = auth.uid()
  )
);