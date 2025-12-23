-- Create table for phase template materials
CREATE TABLE public.plantilla_fase_materiales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plantilla_fase_id UUID NOT NULL REFERENCES public.plantillas_fases(id) ON DELETE CASCADE,
  inventario_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plantilla_fase_materiales ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view template materials"
ON public.plantilla_fase_materiales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert template materials"
ON public.plantilla_fase_materiales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update template materials"
ON public.plantilla_fase_materiales
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete template materials"
ON public.plantilla_fase_materiales
FOR DELETE
TO authenticated
USING (true);