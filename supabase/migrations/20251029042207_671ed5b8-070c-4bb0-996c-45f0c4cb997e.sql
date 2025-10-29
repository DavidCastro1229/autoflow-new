-- Crear tabla tipos_operacion
CREATE TABLE public.tipos_operacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tipos_operacion ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Usuarios autenticados pueden ver tipos de operación"
ON public.tipos_operacion
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins pueden gestionar tipos de operación"
ON public.tipos_operacion
FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Admin taller puede gestionar tipos de operación"
ON public.tipos_operacion
FOR ALL
USING (has_role('admin_taller'::app_role, auth.uid()))
WITH CHECK (has_role('admin_taller'::app_role, auth.uid()));

-- Crear trigger para updated_at
CREATE TRIGGER update_tipos_operacion_updated_at
BEFORE UPDATE ON public.tipos_operacion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar datos iniciales
INSERT INTO public.tipos_operacion (id, codigo, nombre, descripcion, created_at, updated_at) VALUES 
('2ed45f6b-15ee-4ff2-a951-a57d7a86208e', 'PIN', 'Pintura', 'Operación de pintura', '2025-05-14 17:19:01.920292+00', '2025-05-14 17:19:01.920292+00'),
('b24fa47e-70c4-4af7-a0fc-f916b91c9599', 'MANT', 'Mantenimiento', 'Mantenimiento preventivo y correctivo', '2025-08-19 15:56:35.580561+00', '2025-08-19 15:56:35.580561+00'),
('c191406f-11ab-41f1-bf77-29843783242c', 'REP', 'Reparación', 'Operación de reparación', '2025-05-14 17:19:01.920292+00', '2025-05-14 17:19:01.920292+00'),
('e13f927e-9f17-41ae-b985-ef4404d6d5c1', 'CAM', 'Cambio', 'Operación de cambio', '2025-05-14 17:19:01.920292+00', '2025-05-14 17:19:01.920292+00'),
('e360e91a-3e78-4ce5-9167-bef7a32fcf74', 'DIAG', 'Diagnóstico', 'Diagnóstico y evaluación técnica', '2025-08-19 15:56:41.872671+00', '2025-08-19 15:56:41.872671+00'),
('e6155af2-abee-4b10-93de-c8a2ecb4681f', 'REPA', 'Reparación Especifica', 'Reparación de componentes específicos', '2025-08-19 15:56:38.173417+00', '2025-08-19 15:56:38.173417+00'),
('ef5368e5-abc4-4641-91cc-23ede551ecb2', 'COR', 'Corte', 'Operación de corte', '2025-05-14 17:19:01.920292+00', '2025-05-14 17:19:01.920292+00');