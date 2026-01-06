-- Cambiar tipo_tarea de enum a array de strings para soportar múltiples tipos
ALTER TABLE public.catalogo_tareas 
ALTER COLUMN tipo_tarea DROP DEFAULT;

ALTER TABLE public.catalogo_tareas 
ALTER COLUMN tipo_tarea TYPE text[] USING ARRAY[tipo_tarea::text];

ALTER TABLE public.catalogo_tareas 
ALTER COLUMN tipo_tarea SET DEFAULT ARRAY['operativa']::text[];

COMMENT ON COLUMN public.catalogo_tareas.tipo_tarea IS 'Tipos de tarea: administrativa, operativa o ambos';