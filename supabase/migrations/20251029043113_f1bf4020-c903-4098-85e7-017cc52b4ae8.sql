-- Crear enums para prioridad y estado de órdenes
CREATE TYPE public.prioridad_orden AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE public.estado_orden AS ENUM ('pendiente', 'en_proceso', 'completada', 'entregada', 'cancelada');

-- Crear tabla ordenes
CREATE TABLE public.ordenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE RESTRICT,
  descripcion TEXT NOT NULL,
  tipo_servicio_id UUID NOT NULL REFERENCES public.tipos_operacion(id) ON DELETE RESTRICT,
  tecnico_id UUID NOT NULL REFERENCES public.tecnicos(id) ON DELETE RESTRICT,
  fecha_ingreso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  prioridad prioridad_orden NOT NULL DEFAULT 'media',
  estado estado_orden NOT NULL DEFAULT 'pendiente',
  costo_estimado NUMERIC(10, 2),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Taller employees can view their taller's ordenes"
ON public.ordenes
FOR SELECT
USING (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Taller employees can create ordenes for their taller"
ON public.ordenes
FOR INSERT
WITH CHECK (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Taller employees can update their taller's ordenes"
ON public.ordenes
FOR UPDATE
USING (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Taller employees can delete their taller's ordenes"
ON public.ordenes
FOR DELETE
USING (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Super admins can manage all ordenes"
ON public.ordenes
FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Crear trigger para updated_at
CREATE TRIGGER update_ordenes_updated_at
BEFORE UPDATE ON public.ordenes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejorar performance
CREATE INDEX idx_ordenes_taller_id ON public.ordenes(taller_id);
CREATE INDEX idx_ordenes_cliente_id ON public.ordenes(cliente_id);
CREATE INDEX idx_ordenes_vehiculo_id ON public.ordenes(vehiculo_id);
CREATE INDEX idx_ordenes_estado ON public.ordenes(estado);
CREATE INDEX idx_ordenes_fecha_ingreso ON public.ordenes(fecha_ingreso);
CREATE INDEX idx_ordenes_fecha_entrega ON public.ordenes(fecha_entrega);