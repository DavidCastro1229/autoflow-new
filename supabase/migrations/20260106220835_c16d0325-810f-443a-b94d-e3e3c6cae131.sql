-- Add notification columns to tarea_fases
ALTER TABLE public.tarea_fases 
ADD COLUMN notificar boolean DEFAULT false,
ADD COLUMN mensaje_notificacion text;

-- Add notification columns to plantillas_fases for templates
ALTER TABLE public.plantillas_fases 
ADD COLUMN notificar boolean DEFAULT false,
ADD COLUMN mensaje_notificacion text;