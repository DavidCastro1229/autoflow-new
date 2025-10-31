-- Create enums for flotas
CREATE TYPE tipo_flota AS ENUM ('propia', 'alquilada', 'mixta');
CREATE TYPE estado_flota AS ENUM ('activa', 'en_renovacion', 'inactiva');
CREATE TYPE tipo_comunicacion_interna AS ENUM ('gerencia', 'ventas', 'produccion', 'suministro');
CREATE TYPE tipo_comunicacion_externa AS ENUM ('aseguradora', 'arrendadora', 'taller_externo');

-- Create flotas table
CREATE TABLE public.flotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_flota TEXT NOT NULL UNIQUE,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nombre_flota TEXT NOT NULL,
  logo_url TEXT,
  tipo_flota tipo_flota NOT NULL,
  razon_social TEXT NOT NULL,
  numero_rtn TEXT NOT NULL,
  cantidad_vehiculos INTEGER NOT NULL DEFAULT 0,
  categoria_vehiculos TEXT[] DEFAULT ARRAY[]::TEXT[],
  estado estado_flota NOT NULL DEFAULT 'activa',
  rubro_empresa TEXT NOT NULL,
  direccion_fisica TEXT NOT NULL,
  telefono_contacto TEXT NOT NULL,
  correo_contacto TEXT NOT NULL,
  sitio_web TEXT,
  direccion_google_maps TEXT,
  direccion_escrita TEXT,
  direccion_parqueo TEXT,
  direccion_google_maps_parqueo TEXT,
  horarios_atencion TEXT,
  taller_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flota_propietarios table (for tipo_flota = 'mixta')
CREATE TABLE public.flota_propietarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id UUID NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  nombre_propietario TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  rtn TEXT NOT NULL,
  cantidad_vehiculos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flota_jefe table
CREATE TABLE public.flota_jefe (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id UUID NOT NULL UNIQUE REFERENCES public.flotas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  correo TEXT NOT NULL,
  cargo_posicion TEXT NOT NULL,
  horarios_trabajo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flota_departamentos table
CREATE TABLE public.flota_departamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id UUID NOT NULL REFERENCES public.flotas(id) ON DELETE CASCADE,
  nombre_departamento TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flota_comunicacion_interna table
CREATE TABLE public.flota_comunicacion_interna (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento_id UUID NOT NULL REFERENCES public.flota_departamentos(id) ON DELETE CASCADE,
  tipo tipo_comunicacion_interna NOT NULL,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  celular TEXT,
  whatsapp TEXT,
  telefono_fijo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flota_comunicacion_externa table
CREATE TABLE public.flota_comunicacion_externa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento_id UUID NOT NULL REFERENCES public.flota_departamentos(id) ON DELETE CASCADE,
  tipo tipo_comunicacion_externa NOT NULL,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  celular TEXT,
  whatsapp TEXT,
  telefono_fijo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_jefe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_comunicacion_interna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_comunicacion_externa ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flotas
CREATE POLICY "Taller employees can view their taller's flotas"
ON public.flotas FOR SELECT
USING (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Taller employees can create flotas"
ON public.flotas FOR INSERT
WITH CHECK (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Taller employees can update their taller's flotas"
ON public.flotas FOR UPDATE
USING (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Taller employees can delete their taller's flotas"
ON public.flotas FOR DELETE
USING (taller_id IN (
  SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
));

CREATE POLICY "Super admins can manage all flotas"
ON public.flotas FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- RLS Policies for flota_propietarios
CREATE POLICY "Taller employees can view propietarios"
ON public.flota_propietarios FOR SELECT
USING (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Taller employees can manage propietarios"
ON public.flota_propietarios FOR ALL
USING (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
))
WITH CHECK (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Super admins can manage all propietarios"
ON public.flota_propietarios FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- RLS Policies for flota_jefe
CREATE POLICY "Taller employees can view jefe"
ON public.flota_jefe FOR SELECT
USING (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Taller employees can manage jefe"
ON public.flota_jefe FOR ALL
USING (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
))
WITH CHECK (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Super admins can manage all jefe"
ON public.flota_jefe FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- RLS Policies for flota_departamentos
CREATE POLICY "Taller employees can view departamentos"
ON public.flota_departamentos FOR SELECT
USING (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Taller employees can manage departamentos"
ON public.flota_departamentos FOR ALL
USING (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
))
WITH CHECK (flota_id IN (
  SELECT id FROM flotas WHERE taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Super admins can manage all departamentos"
ON public.flota_departamentos FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- RLS Policies for flota_comunicacion_interna
CREATE POLICY "Taller employees can view comunicacion interna"
ON public.flota_comunicacion_interna FOR SELECT
USING (departamento_id IN (
  SELECT id FROM flota_departamentos WHERE flota_id IN (
    SELECT id FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Taller employees can manage comunicacion interna"
ON public.flota_comunicacion_interna FOR ALL
USING (departamento_id IN (
  SELECT id FROM flota_departamentos WHERE flota_id IN (
    SELECT id FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
))
WITH CHECK (departamento_id IN (
  SELECT id FROM flota_departamentos WHERE flota_id IN (
    SELECT id FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Super admins can manage all comunicacion interna"
ON public.flota_comunicacion_interna FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- RLS Policies for flota_comunicacion_externa
CREATE POLICY "Taller employees can view comunicacion externa"
ON public.flota_comunicacion_externa FOR SELECT
USING (departamento_id IN (
  SELECT id FROM flota_departamentos WHERE flota_id IN (
    SELECT id FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Taller employees can manage comunicacion externa"
ON public.flota_comunicacion_externa FOR ALL
USING (departamento_id IN (
  SELECT id FROM flota_departamentos WHERE flota_id IN (
    SELECT id FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
))
WITH CHECK (departamento_id IN (
  SELECT id FROM flota_departamentos WHERE flota_id IN (
    SELECT id FROM flotas WHERE taller_id IN (
      SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
));

CREATE POLICY "Super admins can manage all comunicacion externa"
ON public.flota_comunicacion_externa FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_flotas_updated_at
BEFORE UPDATE ON public.flotas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_propietarios_updated_at
BEFORE UPDATE ON public.flota_propietarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_jefe_updated_at
BEFORE UPDATE ON public.flota_jefe
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_departamentos_updated_at
BEFORE UPDATE ON public.flota_departamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_comunicacion_interna_updated_at
BEFORE UPDATE ON public.flota_comunicacion_interna
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flota_comunicacion_externa_updated_at
BEFORE UPDATE ON public.flota_comunicacion_externa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();