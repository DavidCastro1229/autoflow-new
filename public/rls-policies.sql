-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- WORKSHOP MANAGEMENT SYSTEM
-- Generated: 2026-02-13
-- =====================================================

-- All 51 tables have RLS enabled with policies for:
-- - Super admins (full access)
-- - Taller employees (access to their taller's data)
-- - Aseguradoras (access to affiliated talleres' data)
-- - Users (access to their own data)

-- KEY POLICIES FOR SOLICITUDES_AFILIACION:
-- - Aseguradoras can create solicitudes (INSERT)
-- - Aseguradoras can view their solicitudes (SELECT)
-- - Aseguradoras can update their solicitudes (UPDATE)
-- - Aseguradoras can delete pending solicitudes (DELETE) -- revoke feature
-- - Talleres can view their own solicitudes (SELECT)
-- - Talleres can update their solicitudes (UPDATE) -- accept/reject
-- - Super admins can manage all solicitudes (ALL)

-- KEY POLICIES FOR CONVENIOS_AFILIACION:
-- - Aseguradoras can manage their convenios (ALL)
-- - Aseguradoras can delete convenios of pending solicitudes (DELETE) -- revoke feature
-- - Talleres can view convenios for their solicitudes (SELECT)
-- - Super admins can manage all convenios (ALL)

-- Tables with RLS: aseguradora_contactos, aseguradoras, cargos_administrativos, catalogo_tareas, categorias_servicio, citas, clientes, convenios_afiliacion, cotizacion_partes, cotizaciones, equipo, especialidades_taller, facturas, fase_flujos, fase_materiales, flota_comunicacion_externa, flota_comunicacion_interna, flota_conductores, flota_datos_bancarios, flota_datos_negociacion, flota_departamentos, flota_jefe, flota_propietarios, flota_tarifas_servicio, flota_terminos_politicas, flota_vehiculos, flotas, hojas_ingreso, inventario, mensajes, orden_proceso_historial, ordenes, paquete_servicio_items, paquetes_servicios, plantilla_fase_flujos, plantilla_fase_materiales, plantillas_fases, plantillas_flujos, profiles, servicios, siniestros, solicitudes_afiliacion, taller_aseguradoras, taller_empleados, talleres, tarea_fases, tecnico_horarios, tecnicos, tipos_operacion, user_roles, vehiculos

-- Full RLS policies available via Lovable Cloud database tools
