-- Fix taller_id type in plantillas_fases (change from text to uuid)
ALTER TABLE public.plantillas_fases 
  ALTER COLUMN taller_id TYPE uuid USING taller_id::uuid;

-- Fix taller_id type in plantillas_flujos (change from text to uuid)  
ALTER TABLE public.plantillas_flujos 
  ALTER COLUMN taller_id TYPE uuid USING taller_id::uuid;

-- Now create table to store flows within phase templates
CREATE TABLE public.plantilla_fase_flujos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plantilla_fase_id UUID NOT NULL REFERENCES public.plantillas_fases(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  tiempo_estimado INTEGER,
  unidad_tiempo public.unidad_tiempo_tarea,
  numero_orden INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plantilla_fase_flujos ENABLE ROW LEVEL SECURITY;

-- RLS policies using user_roles instead of direct join
CREATE POLICY "Users can view flows of their phase templates"
  ON public.plantilla_fase_flujos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plantillas_fases pf
      WHERE pf.id = plantilla_fase_flujos.plantilla_fase_id 
        AND pf.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert flows to their phase templates"
  ON public.plantilla_fase_flujos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plantillas_fases pf
      WHERE pf.id = plantilla_fase_id 
        AND pf.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete flows from their phase templates"
  ON public.plantilla_fase_flujos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.plantillas_fases pf
      WHERE pf.id = plantilla_fase_flujos.plantilla_fase_id 
        AND pf.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())
    )
  );