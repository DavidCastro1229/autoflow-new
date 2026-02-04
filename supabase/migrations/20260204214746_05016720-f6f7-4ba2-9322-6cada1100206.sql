-- Create enum for contact types
CREATE TYPE tipo_contacto_aseguradora AS ENUM (
  'gerente_pais',
  'gerente_regional',
  'reclamos',
  'ajustadores',
  'corredores'
);

-- Create table for aseguradora contacts
CREATE TABLE public.aseguradora_contactos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aseguradora_id UUID NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  tipo_contacto tipo_contacto_aseguradora NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  whatsapp TEXT,
  notificar_email BOOLEAN NOT NULL DEFAULT false,
  notificar_whatsapp BOOLEAN NOT NULL DEFAULT false,
  notificar_app BOOLEAN NOT NULL DEFAULT false,
  incluir_cliente_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aseguradora_contactos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Aseguradoras can manage their own contacts"
ON public.aseguradora_contactos
FOR ALL
USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()))
WITH CHECK (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));

CREATE POLICY "Super admins can manage all contacts"
ON public.aseguradora_contactos
FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_aseguradora_contactos_updated_at
BEFORE UPDATE ON public.aseguradora_contactos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();