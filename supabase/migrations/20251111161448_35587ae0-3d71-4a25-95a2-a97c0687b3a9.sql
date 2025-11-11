-- Agregar nuevas columnas a la tabla tecnicos
ALTER TABLE public.tecnicos
ADD COLUMN genero text,
ADD COLUMN codigo_empleado text,
ADD COLUMN documento_identidad text,
ADD COLUMN rtn text,
ADD COLUMN fecha_contratacion date DEFAULT CURRENT_DATE,
ADD COLUMN fecha_nacimiento date,
ADD COLUMN estado text DEFAULT 'activo',
ADD COLUMN frecuencia_pago text,
ADD COLUMN salario numeric DEFAULT 0;

-- Crear índice único para codigo_empleado
CREATE UNIQUE INDEX IF NOT EXISTS idx_tecnicos_codigo_empleado ON public.tecnicos(codigo_empleado);