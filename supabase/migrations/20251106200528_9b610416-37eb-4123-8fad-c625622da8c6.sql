-- Add foreign key relationships to citas table
ALTER TABLE public.citas
  ADD CONSTRAINT citas_taller_id_fkey 
  FOREIGN KEY (taller_id) 
  REFERENCES public.talleres(id) 
  ON DELETE CASCADE;

ALTER TABLE public.citas
  ADD CONSTRAINT citas_cliente_id_fkey 
  FOREIGN KEY (cliente_id) 
  REFERENCES public.clientes(id) 
  ON DELETE CASCADE;

ALTER TABLE public.citas
  ADD CONSTRAINT citas_vehiculo_id_fkey 
  FOREIGN KEY (vehiculo_id) 
  REFERENCES public.vehiculos(id) 
  ON DELETE CASCADE;

ALTER TABLE public.citas
  ADD CONSTRAINT citas_tecnico_id_fkey 
  FOREIGN KEY (tecnico_id) 
  REFERENCES public.tecnicos(id) 
  ON DELETE CASCADE;

ALTER TABLE public.citas
  ADD CONSTRAINT citas_servicio_id_fkey 
  FOREIGN KEY (servicio_id) 
  REFERENCES public.categorias_servicio(id) 
  ON DELETE CASCADE;