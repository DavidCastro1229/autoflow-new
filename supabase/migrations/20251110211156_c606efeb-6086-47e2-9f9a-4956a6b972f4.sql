-- Add foreign key constraints to cotizaciones table
ALTER TABLE public.cotizaciones
  ADD CONSTRAINT cotizaciones_cliente_id_fkey 
  FOREIGN KEY (cliente_id) 
  REFERENCES public.clientes(id) 
  ON DELETE CASCADE;

ALTER TABLE public.cotizaciones
  ADD CONSTRAINT cotizaciones_vehiculo_id_fkey 
  FOREIGN KEY (vehiculo_id) 
  REFERENCES public.vehiculos(id) 
  ON DELETE CASCADE;

ALTER TABLE public.cotizaciones
  ADD CONSTRAINT cotizaciones_taller_id_fkey 
  FOREIGN KEY (taller_id) 
  REFERENCES public.talleres(id) 
  ON DELETE CASCADE;

-- Add foreign key constraints to cotizacion_partes table
ALTER TABLE public.cotizacion_partes
  ADD CONSTRAINT cotizacion_partes_cotizacion_id_fkey 
  FOREIGN KEY (cotizacion_id) 
  REFERENCES public.cotizaciones(id) 
  ON DELETE CASCADE;

ALTER TABLE public.cotizacion_partes
  ADD CONSTRAINT cotizacion_partes_categoria_id_fkey 
  FOREIGN KEY (categoria_id) 
  REFERENCES public.categorias_servicio(id) 
  ON DELETE CASCADE;