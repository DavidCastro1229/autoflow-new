-- Paso 1: Eliminar el constraint del default temporal
ALTER TABLE ordenes ALTER COLUMN estado DROP DEFAULT;

-- Paso 2: Crear el nuevo enum
CREATE TYPE estado_orden_new AS ENUM ('recepcion', 'autorizado', 'en_proceso', 'finalizada', 'cancelada');

-- Paso 3: Actualizar la columna para usar el nuevo enum con mapeo de valores
ALTER TABLE ordenes 
  ALTER COLUMN estado TYPE estado_orden_new 
  USING CASE 
    WHEN estado::text = 'pendiente' THEN 'recepcion'::estado_orden_new
    WHEN estado::text = 'en_proceso' THEN 'en_proceso'::estado_orden_new
    WHEN estado::text = 'completada' THEN 'finalizada'::estado_orden_new
    WHEN estado::text = 'entregada' THEN 'finalizada'::estado_orden_new
    ELSE 'cancelada'::estado_orden_new
  END;

-- Paso 4: Establecer el nuevo default
ALTER TABLE ordenes ALTER COLUMN estado SET DEFAULT 'recepcion'::estado_orden_new;

-- Paso 5: Eliminar el enum viejo
DROP TYPE estado_orden;

-- Paso 6: Renombrar el nuevo enum
ALTER TYPE estado_orden_new RENAME TO estado_orden;