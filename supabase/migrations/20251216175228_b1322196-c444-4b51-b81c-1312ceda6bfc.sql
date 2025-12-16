
-- Table for task phases
CREATE TABLE public.tarea_fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES public.catalogo_tareas(id) ON DELETE CASCADE,
  numero_orden INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  tiempo_estimado INTEGER DEFAULT 0,
  unidad_tiempo public.unidad_tiempo_tarea DEFAULT 'minutos',
  equipo_id UUID REFERENCES public.equipo(id) ON DELETE SET NULL,
  tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for flows within each phase
CREATE TABLE public.fase_flujos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id UUID NOT NULL REFERENCES public.tarea_fases(id) ON DELETE CASCADE,
  numero_orden INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#10B981',
  tiempo_estimado INTEGER DEFAULT 0,
  unidad_tiempo public.unidad_tiempo_tarea DEFAULT 'minutos',
  completado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table for materials per phase
CREATE TABLE public.fase_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id UUID NOT NULL REFERENCES public.tarea_fases(id) ON DELETE CASCADE,
  inventario_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tarea_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fase_flujos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fase_materiales ENABLE ROW LEVEL SECURITY;

-- RLS policies for tarea_fases
CREATE POLICY "Super admins can manage all tarea_fases"
ON public.tarea_fases FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their taller's tarea_fases"
ON public.tarea_fases FOR ALL
USING (
  tarea_id IN (
    SELECT ct.id FROM catalogo_tareas ct
    WHERE ct.taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  tarea_id IN (
    SELECT ct.id FROM catalogo_tareas ct
    WHERE ct.taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);

-- RLS policies for fase_flujos
CREATE POLICY "Super admins can manage all fase_flujos"
ON public.fase_flujos FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their taller's fase_flujos"
ON public.fase_flujos FOR ALL
USING (
  fase_id IN (
    SELECT tf.id FROM tarea_fases tf
    JOIN catalogo_tareas ct ON ct.id = tf.tarea_id
    WHERE ct.taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  fase_id IN (
    SELECT tf.id FROM tarea_fases tf
    JOIN catalogo_tareas ct ON ct.id = tf.tarea_id
    WHERE ct.taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);

-- RLS policies for fase_materiales
CREATE POLICY "Super admins can manage all fase_materiales"
ON public.fase_materiales FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their taller's fase_materiales"
ON public.fase_materiales FOR ALL
USING (
  fase_id IN (
    SELECT tf.id FROM tarea_fases tf
    JOIN catalogo_tareas ct ON ct.id = tf.tarea_id
    WHERE ct.taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  fase_id IN (
    SELECT tf.id FROM tarea_fases tf
    JOIN catalogo_tareas ct ON ct.id = tf.tarea_id
    WHERE ct.taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_tarea_fases_updated_at
  BEFORE UPDATE ON public.tarea_fases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fase_flujos_updated_at
  BEFORE UPDATE ON public.fase_flujos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
