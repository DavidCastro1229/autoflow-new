-- Enum para tipo de tarea
CREATE TYPE tipo_tarea AS ENUM ('administrativa', 'operativa');

-- Enum para forma de pago
CREATE TYPE forma_pago_tarea AS ENUM ('por_hora', 'salario_fijo', 'contrato_precio_fijo');

-- Enum para unidad de tiempo
CREATE TYPE unidad_tiempo_tarea AS ENUM ('minutos', 'horas');

-- Tabla principal de catálogo de tareas
CREATE TABLE public.catalogo_tareas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  numero_orden INTEGER NOT NULL,
  codigo_tarea TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  objetivo TEXT,
  tipo_tarea tipo_tarea NOT NULL DEFAULT 'operativa',
  categorias TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  
  -- Condiciones de aplicación (array de strings)
  condiciones_aplicacion TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  
  -- Gestión de tiempo y seguridad
  tiempo_estimado INTEGER DEFAULT 0,
  unidad_tiempo unidad_tiempo_tarea DEFAULT 'minutos',
  medidas_seguridad TEXT,
  notas_internas TEXT,
  
  -- Configuración de mano de obra
  roles_preferentes INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  forma_pago forma_pago_tarea DEFAULT 'por_hora',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(taller_id, codigo_tarea)
);

-- Habilitar RLS
ALTER TABLE public.catalogo_tareas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Super admins can manage all catalogo_tareas" 
ON public.catalogo_tareas 
FOR ALL 
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their taller's catalogo_tareas" 
ON public.catalogo_tareas 
FOR SELECT 
USING (taller_id IN (
  SELECT user_roles.taller_id FROM user_roles WHERE user_roles.user_id = auth.uid()
));

CREATE POLICY "Taller employees can create catalogo_tareas for their taller" 
ON public.catalogo_tareas 
FOR INSERT 
WITH CHECK (taller_id IN (
  SELECT user_roles.taller_id FROM user_roles WHERE user_roles.user_id = auth.uid()
));

CREATE POLICY "Taller employees can update their taller's catalogo_tareas" 
ON public.catalogo_tareas 
FOR UPDATE 
USING (taller_id IN (
  SELECT user_roles.taller_id FROM user_roles WHERE user_roles.user_id = auth.uid()
));

CREATE POLICY "Taller employees can delete their taller's catalogo_tareas" 
ON public.catalogo_tareas 
FOR DELETE 
USING (taller_id IN (
  SELECT user_roles.taller_id FROM user_roles WHERE user_roles.user_id = auth.uid()
));

-- Trigger para updated_at
CREATE TRIGGER update_catalogo_tareas_updated_at
BEFORE UPDATE ON public.catalogo_tareas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Función para generar código de tarea
CREATE OR REPLACE FUNCTION public.generate_codigo_tarea(p_taller_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  tarea_code TEXT;
BEGIN
  SELECT COALESCE(MAX(numero_orden), 0) + 1 INTO next_number 
  FROM public.catalogo_tareas 
  WHERE taller_id = p_taller_id;
  
  tarea_code := 'TAR-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN tarea_code;
END;
$$;

-- Función para obtener siguiente número de orden
CREATE OR REPLACE FUNCTION public.get_next_numero_orden_tarea(p_taller_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_orden), 0) + 1 INTO next_number 
  FROM public.catalogo_tareas 
  WHERE taller_id = p_taller_id;
  
  RETURN next_number;
END;
$$;