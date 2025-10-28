-- Create talleres table
CREATE TABLE public.talleres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_taller TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  estado TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  nombre_contacto TEXT NOT NULL,
  apellido_contacto TEXT NOT NULL,
  email TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create aseguradoras table
CREATE TABLE public.aseguradoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_aseguradora TEXT NOT NULL,
  rfc TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  estado TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  nombre_contacto TEXT NOT NULL,
  apellido_contacto TEXT NOT NULL,
  email TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create relationship table between talleres and aseguradoras
CREATE TABLE public.taller_aseguradoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  aseguradora_id UUID NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(taller_id, aseguradora_id)
);

-- Enable RLS on talleres
ALTER TABLE public.talleres ENABLE ROW LEVEL SECURITY;

-- RLS policies for talleres
CREATE POLICY "Users can view their own taller"
ON public.talleres FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own taller"
ON public.talleres FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all talleres"
ON public.talleres FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage talleres"
ON public.talleres FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Aseguradoras can view assigned talleres"
ON public.talleres FOR SELECT
USING (
  has_role(auth.uid(), 'aseguradora') AND
  EXISTS (
    SELECT 1 FROM public.taller_aseguradoras ta
    INNER JOIN public.aseguradoras a ON ta.aseguradora_id = a.id
    WHERE ta.taller_id = talleres.id AND a.user_id = auth.uid()
  )
);

-- Enable RLS on aseguradoras
ALTER TABLE public.aseguradoras ENABLE ROW LEVEL SECURITY;

-- RLS policies for aseguradoras
CREATE POLICY "Users can view their own aseguradora"
ON public.aseguradoras FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own aseguradora"
ON public.aseguradoras FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all aseguradoras"
ON public.aseguradoras FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage aseguradoras"
ON public.aseguradoras FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Talleres can view assigned aseguradoras"
ON public.aseguradoras FOR SELECT
USING (
  has_role(auth.uid(), 'admin_taller') AND
  EXISTS (
    SELECT 1 FROM public.taller_aseguradoras ta
    INNER JOIN public.talleres t ON ta.taller_id = t.id
    WHERE ta.aseguradora_id = aseguradoras.id AND t.user_id = auth.uid()
  )
);

-- Enable RLS on taller_aseguradoras
ALTER TABLE public.taller_aseguradoras ENABLE ROW LEVEL SECURITY;

-- RLS policies for taller_aseguradoras
CREATE POLICY "Super admins can manage taller_aseguradoras"
ON public.taller_aseguradoras FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Talleres can view their aseguradoras"
ON public.taller_aseguradoras FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.talleres t
    WHERE t.id = taller_aseguradoras.taller_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Aseguradoras can view their talleres"
ON public.taller_aseguradoras FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.aseguradoras a
    WHERE a.id = taller_aseguradoras.aseguradora_id AND a.user_id = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_talleres_updated_at
BEFORE UPDATE ON public.talleres
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aseguradoras_updated_at
BEFORE UPDATE ON public.aseguradoras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to insert into correct tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_assigned_role app_role;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF v_user_type = 'aseguradora' THEN
    v_assigned_role := 'aseguradora';
    
    INSERT INTO public.aseguradoras (
      user_id,
      nombre_aseguradora,
      rfc,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      nombre_contacto,
      apellido_contacto,
      email,
      descripcion
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_aseguradora',
      NEW.raw_user_meta_data->>'rfc',
      NEW.raw_user_meta_data->>'telefono',
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'estado',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      NEW.email,
      NEW.raw_user_meta_data->>'descripcion'
    );
  ELSE
    v_assigned_role := 'admin_taller';
    
    INSERT INTO public.talleres (
      user_id,
      nombre_taller,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      nombre_contacto,
      apellido_contacto,
      email,
      descripcion
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_taller',
      NEW.raw_user_meta_data->>'telefono',
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'estado',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      NEW.email,
      NEW.raw_user_meta_data->>'descripcion'
    );
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_assigned_role);
  
  RETURN NEW;
END;
$$;