-- Crear tabla de especialidades de taller
CREATE TABLE public.especialidades_taller (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.especialidades_taller ENABLE ROW LEVEL SECURITY;

-- Políticas: Los usuarios autenticados pueden ver las especialidades
CREATE POLICY "Authenticated users can view especialidades"
ON public.especialidades_taller
FOR SELECT
TO authenticated
USING (true);

-- Solo super admins pueden gestionar especialidades
CREATE POLICY "Super admins can manage especialidades"
ON public.especialidades_taller
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Insertar especialidades iniciales
INSERT INTO public.especialidades_taller (id, nombre) VALUES
  (1, 'Mecánica General'),
  (2, 'Pintura'),
  (3, 'Carrocería'),
  (4, 'Electricidad'),
  (5, 'Alineación y Balanceo'),
  (6, 'Transmición'),
  (7, 'Frenos'),
  (8, 'Atención al Cliente'),
  (9, 'Administración');

-- Actualizar la secuencia para que continúe después del último ID insertado
SELECT setval('especialidades_taller_id_seq', 9, true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_especialidades_taller_updated_at
BEFORE UPDATE ON public.especialidades_taller
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();