
-- Drop ALL existing policies on flota_taller_solicitudes
DROP POLICY IF EXISTS "Flotas can view own solicitudes" ON public.flota_taller_solicitudes;
DROP POLICY IF EXISTS "Flotas can insert solicitudes" ON public.flota_taller_solicitudes;
DROP POLICY IF EXISTS "Flotas can delete own pending solicitudes" ON public.flota_taller_solicitudes;
DROP POLICY IF EXISTS "Taller users can view their solicitudes" ON public.flota_taller_solicitudes;
DROP POLICY IF EXISTS "Taller users can update their solicitudes" ON public.flota_taller_solicitudes;
DROP POLICY IF EXISTS "Talleres can update solicitudes" ON public.flota_taller_solicitudes;

-- Helper function for flota ownership check
CREATE OR REPLACE FUNCTION public.is_flota_owner(_user_id uuid, _flota_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flotas
    WHERE id = _flota_id AND user_id = _user_id
  )
$$;

-- SELECT: flota owners, taller members, super admins
CREATE POLICY "fts_select"
ON public.flota_taller_solicitudes
FOR SELECT TO authenticated
USING (
  public.is_flota_owner(auth.uid(), flota_id)
  OR public.is_taller_member(auth.uid(), taller_id)
  OR public.has_role('super_admin'::app_role, auth.uid())
);

-- INSERT: flota owners only
CREATE POLICY "fts_insert"
ON public.flota_taller_solicitudes
FOR INSERT TO authenticated
WITH CHECK (public.is_flota_owner(auth.uid(), flota_id));

-- UPDATE: taller members and super admins
CREATE POLICY "fts_update"
ON public.flota_taller_solicitudes
FOR UPDATE TO authenticated
USING (
  public.is_taller_member(auth.uid(), taller_id)
  OR public.has_role('super_admin'::app_role, auth.uid())
)
WITH CHECK (
  public.is_taller_member(auth.uid(), taller_id)
  OR public.has_role('super_admin'::app_role, auth.uid())
);

-- DELETE: flota owners on pending only
CREATE POLICY "fts_delete"
ON public.flota_taller_solicitudes
FOR DELETE TO authenticated
USING (
  public.is_flota_owner(auth.uid(), flota_id)
  AND status = 'pendiente'
);
