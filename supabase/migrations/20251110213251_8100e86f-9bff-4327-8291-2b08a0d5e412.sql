-- Create enum for estado_inventario
CREATE TYPE estado_inventario AS ENUM ('activo', 'descontinuado', 'agotado');

-- Create inventario table
CREATE TABLE public.inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria_id UUID REFERENCES public.categorias_servicio(id),
  estado estado_inventario NOT NULL DEFAULT 'activo',
  precio_compra NUMERIC NOT NULL DEFAULT 0,
  precio_venta NUMERIC NOT NULL DEFAULT 0,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  proveedor TEXT,
  ubicacion_almacen TEXT,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  taller_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to generate product code
CREATE OR REPLACE FUNCTION public.generate_codigo_producto()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_number INTEGER;
  product_code TEXT;
  current_year TEXT;
  current_month TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  current_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  SELECT COUNT(*) + 1 INTO next_number 
  FROM public.inventario 
  WHERE codigo LIKE 'PRO-' || current_year || '-' || current_month || '-%';
  
  product_code := 'PRO-' || current_year || '-' || current_month || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN product_code;
END;
$$;

-- Enable RLS
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventario
CREATE POLICY "Super admins can manage all inventario"
ON public.inventario
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their taller's inventario"
ON public.inventario
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can create inventario for their taller"
ON public.inventario
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's inventario"
ON public.inventario
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's inventario"
ON public.inventario
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_inventario_updated_at
BEFORE UPDATE ON public.inventario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();