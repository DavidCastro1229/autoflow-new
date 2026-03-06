
-- Drop the problematic policies
DROP POLICY IF EXISTS "Taller users can view their solicitudes" ON public.flota_taller_solicitudes;
DROP POLICY IF EXISTS "Taller users can update their solicitudes" ON public.flota_taller_solicitudes;

-- Create security definer function to check taller ownership
CREATE OR REPLACE FUNCTION public.is_taller_member(_user_id uuid, _taller_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND taller_id = _taller_id
      AND role IN ('taller', 'admin_taller')
  )
$$;

-- Recreate policies using the function
CREATE POLICY "Taller users can view their solicitudes"
ON public.flota_taller_solicitudes
FOR SELECT TO authenticated
USING (public.is_taller_member(auth.uid(), taller_id));

CREATE POLICY "Taller users can update their solicitudes"
ON public.flota_taller_solicitudes
FOR UPDATE TO authenticated
USING (public.is_taller_member(auth.uid(), taller_id))
WITH CHECK (public.is_taller_member(auth.uid(), taller_id));
