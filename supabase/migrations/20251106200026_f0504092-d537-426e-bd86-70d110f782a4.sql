-- Create citas table
CREATE TABLE public.citas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  cliente_id uuid NOT NULL,
  vehiculo_id uuid NOT NULL,
  fecha date NOT NULL,
  hora_inicio text NOT NULL,
  hora_fin text NOT NULL,
  tecnico_id uuid NOT NULL,
  servicio_id uuid NOT NULL,
  nota text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- Create policies for citas
CREATE POLICY "Super admins can manage all citas"
ON public.citas
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their taller's citas"
ON public.citas
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can create citas for their taller"
ON public.citas
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's citas"
ON public.citas
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's citas"
ON public.citas
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_citas_updated_at
BEFORE UPDATE ON public.citas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();