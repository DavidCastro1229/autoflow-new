-- Primero quitamos el default
ALTER TABLE ordenes ALTER COLUMN estado DROP DEFAULT;

-- Renombramos el enum existente
ALTER TYPE estado_orden RENAME TO estado_orden_old;

-- Crear el nuevo enum con los estados correctos
CREATE TYPE estado_orden AS ENUM ('pendiente', 'en_proceso', 'completada', 'cancelada');

-- Actualizar la columna para usar el nuevo enum
ALTER TABLE ordenes 
ALTER COLUMN estado TYPE estado_orden 
USING (
  CASE 
    WHEN estado::text IN ('recepcion', 'pendiente') THEN 'pendiente'::estado_orden
    WHEN estado::text IN ('en_proceso', 'diagnostico', 'reparacion') THEN 'en_proceso'::estado_orden
    WHEN estado::text IN ('finalizada', 'completada', 'entregado') THEN 'completada'::estado_orden
    WHEN estado::text = 'cancelada' THEN 'cancelada'::estado_orden
    ELSE 'pendiente'::estado_orden
  END
);

-- Establecer el nuevo valor por defecto
ALTER TABLE ordenes ALTER COLUMN estado SET DEFAULT 'pendiente'::estado_orden;

-- Eliminar el enum viejo
DROP TYPE estado_orden_old;