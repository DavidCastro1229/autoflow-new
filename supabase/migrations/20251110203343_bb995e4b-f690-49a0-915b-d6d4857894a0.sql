-- Fix search_path for generate_numero_factura function
CREATE OR REPLACE FUNCTION generate_numero_factura()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  factura_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_number FROM public.facturas;
  factura_number := 'FAC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 6, '0');
  RETURN factura_number;
END;
$$;