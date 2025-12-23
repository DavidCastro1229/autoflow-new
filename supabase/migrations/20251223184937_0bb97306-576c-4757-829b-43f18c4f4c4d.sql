-- Add task tracking fields to ordenes table
ALTER TABLE public.ordenes 
ADD COLUMN tarea_id UUID REFERENCES public.catalogo_tareas(id) ON DELETE SET NULL,
ADD COLUMN fase_actual_id UUID REFERENCES public.tarea_fases(id) ON DELETE SET NULL,
ADD COLUMN flujo_actual_id UUID REFERENCES public.fase_flujos(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_ordenes_tarea_id ON public.ordenes(tarea_id);
CREATE INDEX idx_ordenes_fase_actual_id ON public.ordenes(fase_actual_id);
CREATE INDEX idx_ordenes_flujo_actual_id ON public.ordenes(flujo_actual_id);

-- Create a table to track order history through the process
CREATE TABLE public.orden_proceso_historial (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
  fase_id UUID NOT NULL REFERENCES public.tarea_fases(id) ON DELETE CASCADE,
  flujo_id UUID REFERENCES public.fase_flujos(id) ON DELETE SET NULL,
  fecha_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_salida TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orden_proceso_historial ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orden_proceso_historial
CREATE POLICY "Users can view order history from their taller" 
ON public.orden_proceso_historial 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ordenes o
    JOIN public.user_roles ur ON o.taller_id = ur.taller_id
    WHERE o.id = orden_proceso_historial.orden_id
    AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert order history for their taller" 
ON public.orden_proceso_historial 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ordenes o
    JOIN public.user_roles ur ON o.taller_id = ur.taller_id
    WHERE o.id = orden_proceso_historial.orden_id
    AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update order history for their taller" 
ON public.orden_proceso_historial 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.ordenes o
    JOIN public.user_roles ur ON o.taller_id = ur.taller_id
    WHERE o.id = orden_proceso_historial.orden_id
    AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete order history for their taller" 
ON public.orden_proceso_historial 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.ordenes o
    JOIN public.user_roles ur ON o.taller_id = ur.taller_id
    WHERE o.id = orden_proceso_historial.orden_id
    AND ur.user_id = auth.uid()
  )
);