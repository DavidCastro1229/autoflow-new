-- Create templates table for phases (fases)
CREATE TABLE public.plantillas_fases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  tiempo_estimado INTEGER,
  unidad_tiempo public.unidad_tiempo_tarea,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table for flows (flujos)
CREATE TABLE public.plantillas_flujos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#10b981',
  tiempo_estimado INTEGER,
  unidad_tiempo public.unidad_tiempo_tarea,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plantillas_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantillas_flujos ENABLE ROW LEVEL SECURITY;

-- RLS policies for plantillas_fases
CREATE POLICY "Users can view their taller plantillas_fases"
ON public.plantillas_fases FOR SELECT
USING (true);

CREATE POLICY "Users can insert plantillas_fases"
ON public.plantillas_fases FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update plantillas_fases"
ON public.plantillas_fases FOR UPDATE
USING (true);

CREATE POLICY "Users can delete plantillas_fases"
ON public.plantillas_fases FOR DELETE
USING (true);

-- RLS policies for plantillas_flujos
CREATE POLICY "Users can view their taller plantillas_flujos"
ON public.plantillas_flujos FOR SELECT
USING (true);

CREATE POLICY "Users can insert plantillas_flujos"
ON public.plantillas_flujos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update plantillas_flujos"
ON public.plantillas_flujos FOR UPDATE
USING (true);

CREATE POLICY "Users can delete plantillas_flujos"
ON public.plantillas_flujos FOR DELETE
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_plantillas_fases_updated_at
BEFORE UPDATE ON public.plantillas_fases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plantillas_flujos_updated_at
BEFORE UPDATE ON public.plantillas_flujos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();