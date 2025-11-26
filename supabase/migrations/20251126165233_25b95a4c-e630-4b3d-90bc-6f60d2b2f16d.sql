-- Create security definer function to get aseguradora_id
CREATE OR REPLACE FUNCTION public.get_aseguradora_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.aseguradoras WHERE user_id = _user_id LIMIT 1;
$$;

-- Drop and recreate aseguradoras policies using the function
DROP POLICY IF EXISTS "Aseguradoras can view own data" ON public.aseguradoras;
DROP POLICY IF EXISTS "Aseguradoras can update own data" ON public.aseguradoras;
DROP POLICY IF EXISTS "Talleres can view aseguradoras" ON public.aseguradoras;
DROP POLICY IF EXISTS "Super admin full access to aseguradoras" ON public.aseguradoras;

-- Simple policy for aseguradoras to view their own data
CREATE POLICY "Aseguradoras can view own data"
ON public.aseguradoras
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Aseguradoras can update their own data
CREATE POLICY "Aseguradoras can update own data"
ON public.aseguradoras
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Talleres can view all aseguradoras (simple, no subqueries)
CREATE POLICY "Talleres can view aseguradoras"
ON public.aseguradoras
FOR SELECT
TO authenticated
USING (
  has_role('taller'::app_role, auth.uid())
  OR has_role('admin_taller'::app_role, auth.uid())
);

-- Super admin full access
CREATE POLICY "Super admin full access to aseguradoras"
ON public.aseguradoras
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Fix solicitudes_afiliacion policies to avoid recursion
DROP POLICY IF EXISTS "Aseguradoras can view their solicitudes" ON public.solicitudes_afiliacion;
CREATE POLICY "Aseguradoras can view their solicitudes"
ON public.solicitudes_afiliacion
FOR SELECT
TO authenticated
USING (aseguradora_id = public.get_aseguradora_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Aseguradoras can update their solicitudes" ON public.solicitudes_afiliacion;
CREATE POLICY "Aseguradoras can update their solicitudes"
ON public.solicitudes_afiliacion
FOR UPDATE
TO authenticated
USING (aseguradora_id = public.get_aseguradora_id_for_user(auth.uid()));

-- Fix mensajes policies to avoid recursion
DROP POLICY IF EXISTS "Aseguradoras can view messages with their talleres" ON public.mensajes;
CREATE POLICY "Aseguradoras can view messages with their talleres"
ON public.mensajes
FOR SELECT
TO authenticated
USING (aseguradora_id = public.get_aseguradora_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Aseguradoras can send messages to their talleres" ON public.mensajes;
CREATE POLICY "Aseguradoras can send messages to their talleres"
ON public.mensajes
FOR INSERT
TO authenticated
WITH CHECK (
  aseguradora_id = public.get_aseguradora_id_for_user(auth.uid())
  AND sender_type = 'aseguradora'
);

-- Fix taller_aseguradoras policies
DROP POLICY IF EXISTS "Aseguradoras can view their talleres" ON public.taller_aseguradoras;
CREATE POLICY "Aseguradoras can view their talleres"
ON public.taller_aseguradoras
FOR SELECT
TO authenticated
USING (aseguradora_id = public.get_aseguradora_id_for_user(auth.uid()));