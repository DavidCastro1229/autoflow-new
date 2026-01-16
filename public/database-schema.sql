-- =====================================================
-- DATABASE SCHEMA FOR WORKSHOP MANAGEMENT SYSTEM
-- Generated: 2026-01-16
-- =====================================================

-- ENUMERATED TYPES
CREATE TYPE public.app_role AS ENUM ('taller', 'admin_taller', 'aseguradora', 'super_admin', 'cliente', 'tecnico');
CREATE TYPE public.area_tecnico AS ENUM ('tecnico', 'tecnico_senior');
CREATE TYPE public.estado_cita AS ENUM ('programada', 'confirmada', 'completada', 'cancelada');
CREATE TYPE public.estado_cotizacion AS ENUM ('pendiente', 'aprobada', 'rechazada', 'convertida_a_orden');
CREATE TYPE public.estado_factura AS ENUM ('pendiente', 'pagada', 'parcial', 'vencida', 'cancelada');
CREATE TYPE public.estado_flota AS ENUM ('activa', 'en_renovacion', 'inactiva');
CREATE TYPE public.estado_inventario AS ENUM ('activo', 'descontinuado', 'agotado');
CREATE TYPE public.estado_orden AS ENUM ('pendiente', 'en_proceso', 'completada', 'cancelada');
CREATE TYPE public.estado_solicitud_afiliacion AS ENUM ('pendiente', 'aprobada', 'rechazada');
CREATE TYPE public.estado_suscripcion AS ENUM ('prueba', 'activo', 'expirado');
CREATE TYPE public.estado_vehiculo AS ENUM ('activo', 'en_servicio', 'entregado', 'inactivo');
CREATE TYPE public.forma_pago_tarea AS ENUM ('por_hora', 'salario_fijo', 'contrato_precio_fijo');
CREATE TYPE public.metodo_pago AS ENUM ('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro');
CREATE TYPE public.operacion_parte AS ENUM ('corregir', 'reparar', 'cambiar');
CREATE TYPE public.prioridad_orden AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE public.taller_status AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE public.tipo_cliente AS ENUM ('individual', 'empresa', 'flota');
CREATE TYPE public.tipo_comunicacion_externa AS ENUM ('aseguradora', 'arrendadora', 'taller_externo');
CREATE TYPE public.tipo_comunicacion_interna AS ENUM ('gerencia', 'ventas', 'produccion', 'suministro');
CREATE TYPE public.tipo_contrato AS ENUM ('arrendamiento', 'propiedad', 'subcontratacion');
CREATE TYPE public.tipo_flota AS ENUM ('propia', 'alquilada', 'mixta');
CREATE TYPE public.tipo_tarea AS ENUM ('administrativa', 'operativa');
CREATE TYPE public.unidad_tiempo_tarea AS ENUM ('minutos', 'horas');

-- TABLES (49 total): aseguradoras, cargos_administrativos, catalogo_tareas, categorias_servicio, citas, clientes, cotizacion_partes, cotizaciones, equipo, especialidades_taller, facturas, fase_flujos, fase_materiales, flota_comunicacion_externa, flota_comunicacion_interna, flota_conductores, flota_datos_bancarios, flota_datos_negociacion, flota_departamentos, flota_jefe, flota_propietarios, flota_tarifas_servicio, flota_terminos_politicas, flota_vehiculos, flotas, hojas_ingreso, inventario, mensajes, orden_proceso_historial, ordenes, paquete_servicio_items, paquetes_servicios, plantilla_fase_flujos, plantilla_fase_materiales, plantillas_fases, plantillas_flujos, profiles, servicios, siniestros, solicitudes_afiliacion, taller_aseguradoras, taller_empleados, talleres, tarea_fases, tecnico_horarios, tecnicos, tipos_operacion, user_roles, vehiculos

-- FUNCTIONS: approve_taller, generate_codigo_cotizacion, generate_codigo_producto, generate_codigo_tarea, generate_numero_factura, get_aseguradora_id_for_user, get_next_numero_orden_tarea, handle_new_user, has_role, is_trial_expired, reject_taller, set_trial_dates, update_expired_trials, update_updated_at_column

-- Full schema available via Lovable Cloud database tools
