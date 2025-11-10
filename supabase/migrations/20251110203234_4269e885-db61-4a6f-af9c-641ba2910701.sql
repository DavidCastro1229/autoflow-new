-- Create enum types for facturas
CREATE TYPE estado_factura AS ENUM ('pendiente', 'pagada', 'parcial', 'vencida', 'cancelada');
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro');

-- Create facturas table
CREATE TABLE public.facturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_factura TEXT NOT NULL UNIQUE,
  nombre_factura TEXT NOT NULL,
  estado estado_factura NOT NULL DEFAULT 'pendiente'::estado_factura,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  orden_id UUID REFERENCES public.ordenes(id) ON DELETE SET NULL,
  taller_id UUID NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  impuestos NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descuento NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notas TEXT,
  metodo_pago metodo_pago,
  tipo_tarjeta TEXT,
  referencia_pago TEXT,
  fecha_pago DATE,
  monto_pagado NUMERIC(10, 2) DEFAULT 0,
  nota_pago TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

-- Create policies for facturas
CREATE POLICY "Super admins can manage all facturas"
  ON public.facturas
  FOR ALL
  USING (has_role('super_admin'::app_role, auth.uid()))
  WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can view their taller's facturas"
  ON public.facturas
  FOR SELECT
  USING (taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Taller employees can create facturas for their taller"
  ON public.facturas
  FOR INSERT
  WITH CHECK (taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Taller employees can update their taller's facturas"
  ON public.facturas
  FOR UPDATE
  USING (taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Taller employees can delete their taller's facturas"
  ON public.facturas
  FOR DELETE
  USING (taller_id IN (
    SELECT taller_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_facturas_updated_at
  BEFORE UPDATE ON public.facturas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate numero_factura
CREATE OR REPLACE FUNCTION generate_numero_factura()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  factura_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_number FROM public.facturas;
  factura_number := 'FAC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 6, '0');
  RETURN factura_number;
END;
$$ LANGUAGE plpgsql;