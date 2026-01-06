-- =============================================
-- DATABASE SCHEMA - Workshop Management System
-- Generated: 2026-01-06
-- =============================================

-- =============================================
-- ENUMERATED TYPES
-- =============================================

CREATE TYPE public.app_role AS ENUM (
  'taller',
  'admin_taller',
  'aseguradora',
  'super_admin',
  'cliente',
  'tecnico'
);

CREATE TYPE public.area_tecnico AS ENUM (
  'tecnico',
  'tecnico_senior'
);

CREATE TYPE public.estado_cita AS ENUM (
  'programada',
  'confirmada',
  'completada',
  'cancelada'
);

CREATE TYPE public.estado_cotizacion AS ENUM (
  'pendiente',
  'aprobada',
  'rechazada',
  'convertida_a_orden'
);

CREATE TYPE public.estado_factura AS ENUM (
  'pendiente',
  'pagada',
  'parcial',
  'vencida',
  'cancelada'
);

CREATE TYPE public.estado_flota AS ENUM (
  'activa',
  'en_renovacion',
  'inactiva'
);

CREATE TYPE public.estado_inventario AS ENUM (
  'activo',
  'descontinuado',
  'agotado'
);

CREATE TYPE public.estado_orden AS ENUM (
  'pendiente',
  'en_proceso',
  'completada',
  'cancelada'
);

CREATE TYPE public.estado_solicitud_afiliacion AS ENUM (
  'pendiente',
  'aprobada',
  'rechazada'
);

CREATE TYPE public.estado_suscripcion AS ENUM (
  'prueba',
  'activo',
  'expirado'
);

CREATE TYPE public.estado_vehiculo AS ENUM (
  'activo',
  'en_servicio',
  'entregado',
  'inactivo'
);

CREATE TYPE public.forma_pago_tarea AS ENUM (
  'por_hora',
  'salario_fijo',
  'contrato_precio_fijo'
);

CREATE TYPE public.metodo_pago AS ENUM (
  'efectivo',
  'tarjeta_credito',
  'tarjeta_debito',
  'transferencia',
  'cheque',
  'otro'
);

CREATE TYPE public.operacion_parte AS ENUM (
  'corregir',
  'reparar',
  'cambiar'
);

CREATE TYPE public.prioridad_orden AS ENUM (
  'baja',
  'media',
  'alta',
  'urgente'
);

CREATE TYPE public.taller_status AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado'
);

CREATE TYPE public.tipo_cliente AS ENUM (
  'individual',
  'empresa',
  'flota'
);

CREATE TYPE public.tipo_comunicacion_externa AS ENUM (
  'aseguradora',
  'arrendadora',
  'taller_externo'
);

CREATE TYPE public.tipo_comunicacion_interna AS ENUM (
  'gerencia',
  'ventas',
  'produccion',
  'suministro'
);

CREATE TYPE public.tipo_contrato AS ENUM (
  'arrendamiento',
  'propiedad',
  'subcontratacion'
);

CREATE TYPE public.tipo_flota AS ENUM (
  'propia',
  'alquilada',
  'mixta'
);

CREATE TYPE public.tipo_tarea AS ENUM (
  'administrativa',
  'operativa'
);

CREATE TYPE public.unidad_tiempo_tarea AS ENUM (
  'minutos',
  'horas'
);

-- =============================================
-- TABLES
-- =============================================

-- Aseguradoras (Insurance Companies)
CREATE TABLE public.aseguradoras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nombre_aseguradora text NOT NULL,
  rfc text NOT NULL,
  telefono text NOT NULL,
  direccion text NOT NULL,
  ciudad text NOT NULL,
  estado text NOT NULL,
  codigo_postal text NOT NULL,
  nombre_contacto text NOT NULL,
  apellido_contacto text NOT NULL,
  email text NOT NULL,
  descripcion text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cargos Administrativos (Administrative Positions)
CREATE TABLE public.cargos_administrativos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  emoji text NOT NULL DEFAULT '👤',
  color text NOT NULL DEFAULT 'blue',
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Talleres (Workshops)
CREATE TABLE public.talleres (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nombre_taller text NOT NULL,
  telefono text NOT NULL,
  direccion text NOT NULL,
  ciudad text NOT NULL,
  estado text NOT NULL,
  codigo_postal text NOT NULL,
  nombre_contacto text NOT NULL,
  apellido_contacto text NOT NULL,
  email text NOT NULL,
  descripcion text,
  logo_url text,
  status public.taller_status NOT NULL DEFAULT 'pendiente',
  estado_suscripcion public.estado_suscripcion,
  fecha_inicio_prueba timestamp with time zone,
  fecha_fin_prueba timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Catalogo de Tareas (Task Catalog)
CREATE TABLE public.catalogo_tareas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  numero_orden integer NOT NULL,
  codigo_tarea text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  objetivo text,
  tipo_tarea public.tipo_tarea NOT NULL DEFAULT 'operativa',
  categorias text[] NOT NULL DEFAULT ARRAY[]::text[],
  condiciones_aplicacion text[] NOT NULL DEFAULT ARRAY[]::text[],
  tiempo_estimado integer DEFAULT 0,
  unidad_tiempo public.unidad_tiempo_tarea DEFAULT 'minutos',
  medidas_seguridad text,
  notas_internas text,
  roles_preferentes integer[] DEFAULT ARRAY[]::integer[],
  forma_pago public.forma_pago_tarea DEFAULT 'por_hora',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Categorias de Servicio (Service Categories)
CREATE TABLE public.categorias_servicio (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Clientes (Clients)
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  user_id uuid NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  email text NOT NULL,
  telefono text NOT NULL,
  tipo_cliente public.tipo_cliente NOT NULL,
  nombre_empresa text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Vehiculos (Vehicles)
CREATE TABLE public.vehiculos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  marca text NOT NULL,
  modelo text NOT NULL,
  anio integer NOT NULL,
  placa text NOT NULL,
  color text NOT NULL,
  vin text,
  kilometraje integer,
  tipo_combustible text,
  transmision text,
  motor text,
  notas text,
  estado public.estado_vehiculo NOT NULL DEFAULT 'activo',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Especialidades de Taller (Workshop Specialties)
CREATE TABLE public.especialidades_taller (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tecnicos (Technicians)
CREATE TABLE public.tecnicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  user_id uuid NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  email text NOT NULL,
  telefono text NOT NULL,
  direccion text NOT NULL,
  especialidad_id integer NOT NULL,
  experiencia text NOT NULL,
  area public.area_tecnico NOT NULL DEFAULT 'tecnico',
  certificaciones text,
  habilidades text,
  rtn text,
  codigo_empleado text,
  documento_identidad text,
  fecha_nacimiento text,
  genero text,
  fecha_contratacion text,
  frecuencia_pago text,
  salario numeric,
  estado text DEFAULT 'activo',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Citas (Appointments)
CREATE TABLE public.citas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id),
  tecnico_id uuid NOT NULL REFERENCES public.tecnicos(id),
  servicio_id uuid NOT NULL REFERENCES public.categorias_servicio(id),
  fecha text NOT NULL,
  hora_inicio text NOT NULL,
  hora_fin text NOT NULL,
  estado public.estado_cita NOT NULL DEFAULT 'programada',
  nota text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cotizaciones (Quotes)
CREATE TABLE public.cotizaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id),
  codigo_cotizacion text NOT NULL,
  fecha text NOT NULL DEFAULT CURRENT_DATE,
  estado public.estado_cotizacion NOT NULL DEFAULT 'pendiente',
  total numeric NOT NULL DEFAULT 0,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cotizacion Partes (Quote Parts)
CREATE TABLE public.cotizacion_partes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id),
  categoria_id uuid NOT NULL REFERENCES public.categorias_servicio(id),
  descripcion text NOT NULL,
  operacion public.operacion_parte NOT NULL,
  tipo_material text NOT NULL,
  tipo_reparacion text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  horas integer NOT NULL DEFAULT 0,
  dias integer NOT NULL DEFAULT 0,
  mano_obra numeric NOT NULL DEFAULT 0,
  repuestos numeric NOT NULL DEFAULT 0,
  materiales numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Equipo (Team Members)
CREATE TABLE public.equipo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  cargo_id uuid NOT NULL REFERENCES public.cargos_administrativos(id),
  cargo text,
  nombre text NOT NULL,
  apellido text NOT NULL,
  email text NOT NULL,
  telefono text NOT NULL,
  direccion text NOT NULL,
  documento_identidad text,
  fecha_nacimiento text,
  genero text,
  fecha_contratacion text NOT NULL DEFAULT CURRENT_DATE,
  frecuencia_pago text NOT NULL DEFAULT 'mensual',
  salario numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'activo',
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tipos de Operacion (Operation Types)
CREATE TABLE public.tipos_operacion (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tarea Fases (Task Phases)
CREATE TABLE public.tarea_fases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarea_id uuid NOT NULL REFERENCES public.catalogo_tareas(id),
  titulo text NOT NULL,
  numero_orden integer NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  tiempo_estimado integer,
  unidad_tiempo public.unidad_tiempo_tarea,
  tecnico_id uuid REFERENCES public.tecnicos(id),
  equipo_id uuid REFERENCES public.equipo(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ordenes (Work Orders)
CREATE TABLE public.ordenes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id),
  tecnico_id uuid NOT NULL REFERENCES public.tecnicos(id),
  tipo_servicio_id uuid NOT NULL REFERENCES public.tipos_operacion(id),
  tarea_id uuid REFERENCES public.catalogo_tareas(id),
  fase_actual_id uuid REFERENCES public.tarea_fases(id),
  flujo_actual_id uuid,
  descripcion text NOT NULL,
  prioridad public.prioridad_orden NOT NULL DEFAULT 'media',
  estado public.estado_orden NOT NULL DEFAULT 'pendiente',
  fecha_ingreso text NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega text,
  costo_estimado numeric,
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Facturas (Invoices)
CREATE TABLE public.facturas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  orden_id uuid REFERENCES public.ordenes(id),
  numero_factura text NOT NULL,
  nombre_factura text NOT NULL,
  fecha_emision text NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento text,
  fecha_pago text,
  estado public.estado_factura NOT NULL DEFAULT 'pendiente',
  subtotal numeric NOT NULL DEFAULT 0,
  impuestos numeric NOT NULL DEFAULT 0,
  descuento numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  metodo_pago public.metodo_pago,
  tipo_tarjeta text,
  monto_pagado numeric DEFAULT 0,
  referencia_pago text,
  nota_pago text,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inventario (Inventory)
CREATE TABLE public.inventario (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  codigo text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  categoria_id uuid REFERENCES public.categorias_servicio(id),
  precio_compra numeric NOT NULL DEFAULT 0,
  precio_venta numeric NOT NULL DEFAULT 0,
  stock_actual integer NOT NULL DEFAULT 0,
  stock_minimo integer NOT NULL DEFAULT 0,
  proveedor text,
  ubicacion_almacen text,
  estado public.estado_inventario NOT NULL DEFAULT 'activo',
  fecha_ingreso text NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Fase Flujos (Phase Flows)
CREATE TABLE public.fase_flujos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fase_id uuid NOT NULL REFERENCES public.tarea_fases(id),
  titulo text NOT NULL,
  numero_orden integer NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  tiempo_estimado integer,
  unidad_tiempo public.unidad_tiempo_tarea,
  completado boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Fase Materiales (Phase Materials)
CREATE TABLE public.fase_materiales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fase_id uuid NOT NULL REFERENCES public.tarea_fases(id),
  inventario_id uuid NOT NULL REFERENCES public.inventario(id),
  cantidad integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flotas (Fleets)
CREATE TABLE public.flotas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  numero_flota text NOT NULL,
  nombre_flota text NOT NULL,
  tipo_flota public.tipo_flota NOT NULL,
  razon_social text NOT NULL,
  numero_rtn text NOT NULL,
  rubro_empresa text NOT NULL,
  direccion_fisica text NOT NULL,
  direccion_escrita text,
  direccion_google_maps text,
  direccion_parqueo text,
  direccion_google_maps_parqueo text,
  telefono_contacto text NOT NULL,
  correo_contacto text NOT NULL,
  sitio_web text,
  logo_url text,
  horarios_atencion text,
  cantidad_vehiculos integer NOT NULL DEFAULT 0,
  categoria_vehiculos text[],
  estado public.estado_flota NOT NULL DEFAULT 'activa',
  fecha_registro text NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Departamentos (Fleet Departments)
CREATE TABLE public.flota_departamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  nombre_departamento text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Comunicacion Externa (Fleet External Communication)
CREATE TABLE public.flota_comunicacion_externa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento_id uuid NOT NULL REFERENCES public.flota_departamentos(id),
  nombre text NOT NULL,
  correo text NOT NULL,
  telefono_fijo text,
  celular text,
  whatsapp text,
  tipo public.tipo_comunicacion_externa NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Comunicacion Interna (Fleet Internal Communication)
CREATE TABLE public.flota_comunicacion_interna (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento_id uuid NOT NULL REFERENCES public.flota_departamentos(id),
  nombre text NOT NULL,
  correo text NOT NULL,
  telefono_fijo text,
  celular text,
  whatsapp text,
  tipo public.tipo_comunicacion_interna NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Conductores (Fleet Drivers)
CREATE TABLE public.flota_conductores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  nombre text NOT NULL,
  apellido text NOT NULL,
  cedula_identidad text NOT NULL,
  fecha_nacimiento text NOT NULL,
  direccion text NOT NULL,
  telefono text NOT NULL,
  correo text,
  estado_civil text,
  tipo_licencia text NOT NULL,
  numero_licencia text NOT NULL,
  fecha_emision_licencia text NOT NULL,
  fecha_vencimiento_licencia text NOT NULL,
  restricciones_licencia text,
  fecha_ingreso text NOT NULL,
  vehiculo_asignado_actual text,
  historial_asignaciones text,
  viaticos_autorizados numeric,
  limite_diario_viaticos numeric,
  notas_viaticos text,
  calificacion_desempeno numeric,
  observaciones_desempeno text,
  contacto_emergencia_nombre text,
  contacto_emergencia_telefono text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Datos Bancarios (Fleet Bank Data)
CREATE TABLE public.flota_datos_bancarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  entidad_bancaria text NOT NULL,
  tipo_cuenta text NOT NULL,
  cuenta_bancaria text NOT NULL,
  moneda text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Datos Negociacion (Fleet Negotiation Data)
CREATE TABLE public.flota_datos_negociacion (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  tipo_contrato public.tipo_contrato NOT NULL,
  fecha_inicio text NOT NULL,
  duracion_contrato text NOT NULL,
  tarifa_precios numeric,
  tarifa_descuento numeric,
  dias_credito_autorizado integer,
  credito_autorizado_por text,
  descuento_pronto_pago numeric,
  porcentaje_cobro_mora numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Jefe (Fleet Manager)
CREATE TABLE public.flota_jefe (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL UNIQUE REFERENCES public.flotas(id),
  nombre text NOT NULL,
  cargo_posicion text NOT NULL,
  telefono text NOT NULL,
  correo text NOT NULL,
  horarios_trabajo text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Propietarios (Fleet Owners)
CREATE TABLE public.flota_propietarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  nombre_propietario text NOT NULL,
  razon_social text NOT NULL,
  rtn text NOT NULL,
  telefono text NOT NULL,
  correo text NOT NULL,
  cantidad_vehiculos integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Tarifas Servicio (Fleet Service Rates)
CREATE TABLE public.flota_tarifas_servicio (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  categoria_servicio_id uuid NOT NULL REFERENCES public.categorias_servicio(id),
  tarifa numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Terminos Politicas (Fleet Terms and Policies)
CREATE TABLE public.flota_terminos_politicas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  politicas_uso_vehiculos text[],
  politicas_combustible text[],
  politicas_renovacion text[],
  seguros_covertura text[],
  politicas_condiciones_uso text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Flota Vehiculos (Fleet Vehicles)
CREATE TABLE public.flota_vehiculos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flota_id uuid NOT NULL REFERENCES public.flotas(id),
  numero_unidad text NOT NULL,
  numero_placa text NOT NULL,
  numero_vin text NOT NULL,
  marca_modelo text NOT NULL,
  anio_fabricacion integer NOT NULL,
  estado_vehiculo text NOT NULL,
  kilometraje_actual integer NOT NULL DEFAULT 0,
  fecha_ultimo_mantenimiento text,
  proximo_mantenimiento_programado text,
  historial_reparaciones text,
  conductores_asignados text,
  permiso_circulacion text,
  fecha_autorizacion_circulacion text,
  fecha_vencimiento_circulacion text,
  permiso_explotacion_unidad text,
  fecha_autorizacion_explotacion text,
  fecha_vencimiento_explotacion text,
  permiso_publicidad text,
  fecha_autorizacion_publicidad text,
  fecha_vencimiento_publicidad text,
  permisos_especiales text,
  fecha_autorizacion_especiales text,
  fecha_vencimiento_especiales text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Hojas de Ingreso (Entry Sheets)
CREATE TABLE public.hojas_ingreso (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id),
  nivel_gasolina text NOT NULL,
  exteriores jsonb NOT NULL DEFAULT '{}'::jsonb,
  interiores jsonb NOT NULL DEFAULT '{}'::jsonb,
  motor jsonb NOT NULL DEFAULT '{}'::jsonb,
  coqueta jsonb NOT NULL DEFAULT '{}'::jsonb,
  comentarios text,
  firma_cliente text,
  firma_encargado text,
  imagenes_carroceria text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Mensajes (Messages)
CREATE TABLE public.mensajes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  aseguradora_id uuid NOT NULL REFERENCES public.aseguradoras(id),
  contenido text NOT NULL,
  sender_type text NOT NULL,
  leido boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Orden Proceso Historial (Order Process History)
CREATE TABLE public.orden_proceso_historial (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id uuid NOT NULL REFERENCES public.ordenes(id),
  fase_id uuid NOT NULL REFERENCES public.tarea_fases(id),
  flujo_id uuid REFERENCES public.fase_flujos(id),
  fecha_entrada timestamp with time zone NOT NULL DEFAULT now(),
  fecha_salida timestamp with time zone,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Paquetes de Servicios (Service Packages)
CREATE TABLE public.paquetes_servicios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  precio_total numeric NOT NULL DEFAULT 0,
  descuento numeric,
  estado boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Servicios (Services)
CREATE TABLE public.servicios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  categoria_id uuid NOT NULL REFERENCES public.categorias_servicio(id),
  nombre text NOT NULL,
  descripcion text,
  precio numeric NOT NULL DEFAULT 0,
  tiempo_estimado jsonb NOT NULL DEFAULT '{}'::jsonb,
  materiales_requeridos text[],
  estado boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Paquete Servicio Items (Package Service Items)
CREATE TABLE public.paquete_servicio_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paquete_id uuid NOT NULL REFERENCES public.paquetes_servicios(id),
  servicio_id uuid NOT NULL REFERENCES public.servicios(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Plantillas Fases (Phase Templates)
CREATE TABLE public.plantillas_fases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  titulo text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  tiempo_estimado integer,
  unidad_tiempo public.unidad_tiempo_tarea,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Plantilla Fase Flujos (Phase Template Flows)
CREATE TABLE public.plantilla_fase_flujos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plantilla_fase_id uuid NOT NULL REFERENCES public.plantillas_fases(id),
  titulo text NOT NULL,
  numero_orden integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#3B82F6',
  tiempo_estimado integer,
  unidad_tiempo public.unidad_tiempo_tarea,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Plantilla Fase Materiales (Phase Template Materials)
CREATE TABLE public.plantilla_fase_materiales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plantilla_fase_id uuid NOT NULL REFERENCES public.plantillas_fases(id),
  inventario_id uuid NOT NULL REFERENCES public.inventario(id),
  cantidad integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Plantillas Flujos (Flow Templates)
CREATE TABLE public.plantillas_flujos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL,
  titulo text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  tiempo_estimado integer,
  unidad_tiempo public.unidad_tiempo_tarea,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Profiles (User Profiles)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  nombre_taller text NOT NULL,
  nombre_aseguradora text,
  rfc text,
  telefono text NOT NULL,
  direccion text NOT NULL,
  ciudad text NOT NULL,
  estado text NOT NULL,
  codigo_postal text NOT NULL,
  nombre_contacto text NOT NULL,
  apellido_contacto text NOT NULL,
  email text NOT NULL,
  descripcion text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Siniestros (Claims)
CREATE TABLE public.siniestros (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id),
  numero_siniestro text NOT NULL,
  fecha_siniestro text NOT NULL,
  descripcion text NOT NULL,
  monto_estimado numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Solicitudes de Afiliacion (Affiliation Requests)
CREATE TABLE public.solicitudes_afiliacion (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  aseguradora_id uuid NOT NULL REFERENCES public.aseguradoras(id),
  estado public.estado_solicitud_afiliacion NOT NULL DEFAULT 'pendiente',
  mensaje text,
  respuesta text,
  fecha_solicitud text NOT NULL DEFAULT CURRENT_DATE,
  fecha_respuesta text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Taller Aseguradoras (Workshop-Insurance Relationships)
CREATE TABLE public.taller_aseguradoras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  aseguradora_id uuid NOT NULL REFERENCES public.aseguradoras(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Taller Empleados (Workshop Employees)
CREATE TABLE public.taller_empleados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taller_id uuid NOT NULL REFERENCES public.talleres(id),
  user_id uuid NOT NULL,
  nombre text NOT NULL,
  apellidos text NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tecnico Horarios (Technician Schedules)
CREATE TABLE public.tecnico_horarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tecnico_id uuid NOT NULL REFERENCES public.tecnicos(id),
  dia_semana text NOT NULL,
  hora_inicio text NOT NULL,
  hora_fin text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  taller_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function: approve_taller
CREATE OR REPLACE FUNCTION public.approve_taller(taller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT has_role('super_admin'::app_role, auth.uid()) THEN
    RAISE EXCEPTION 'Solo super administradores pueden aprobar talleres';
  END IF;
  
  SELECT user_id INTO v_user_id
  FROM public.talleres
  WHERE id = taller_id_param;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Taller no encontrado';
  END IF;
  
  UPDATE public.talleres
  SET 
    status = 'aprobado'::taller_status,
    estado_suscripcion = 'prueba',
    fecha_inicio_prueba = now(),
    fecha_fin_prueba = now() + interval '15 days'
  WHERE id = taller_id_param;
  
  INSERT INTO public.user_roles (user_id, role, taller_id)
  VALUES (v_user_id, 'admin_taller'::app_role, taller_id_param)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function: generate_codigo_cotizacion
CREATE OR REPLACE FUNCTION public.generate_codigo_cotizacion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  cotizacion_code TEXT;
  current_year TEXT;
  current_month TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  current_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  SELECT COUNT(*) + 1 INTO next_number 
  FROM public.cotizaciones 
  WHERE codigo_cotizacion LIKE 'COT-' || current_year || '-' || current_month || '-%';
  
  cotizacion_code := 'COT-' || current_year || '-' || current_month || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN cotizacion_code;
END;
$$;

-- Function: generate_codigo_producto
CREATE OR REPLACE FUNCTION public.generate_codigo_producto()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function: generate_codigo_tarea
CREATE OR REPLACE FUNCTION public.generate_codigo_tarea(p_taller_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  tarea_code TEXT;
BEGIN
  SELECT COALESCE(MAX(numero_orden), 0) + 1 INTO next_number 
  FROM public.catalogo_tareas 
  WHERE taller_id = p_taller_id;
  
  tarea_code := 'TAR-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN tarea_code;
END;
$$;

-- Function: generate_numero_factura
CREATE OR REPLACE FUNCTION public.generate_numero_factura()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function: get_aseguradora_id_for_user
CREATE OR REPLACE FUNCTION public.get_aseguradora_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.aseguradoras WHERE user_id = _user_id LIMIT 1;
$$;

-- Function: get_next_numero_orden_tarea
CREATE OR REPLACE FUNCTION public.get_next_numero_orden_tarea(p_taller_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_orden), 0) + 1 INTO next_number 
  FROM public.catalogo_tareas 
  WHERE taller_id = p_taller_id;
  
  RETURN next_number;
END;
$$;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_type text;
  v_taller_id uuid;
  v_aseguradora_id uuid;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF v_user_type = 'aseguradora' THEN
    INSERT INTO public.aseguradoras (
      user_id,
      nombre_aseguradora,
      rfc,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      nombre_contacto,
      apellido_contacto,
      email,
      descripcion
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_aseguradora',
      NEW.raw_user_meta_data->>'rfc',
      NEW.raw_user_meta_data->>'telefono',
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'estado',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      NEW.email,
      NEW.raw_user_meta_data->>'descripcion'
    )
    RETURNING id INTO v_aseguradora_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'aseguradora'::app_role);
    
  ELSIF v_user_type = 'taller' THEN
    INSERT INTO public.talleres (
      user_id,
      nombre_taller,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      nombre_contacto,
      apellido_contacto,
      email,
      descripcion,
      status
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nombre_taller',
      NEW.raw_user_meta_data->>'telefono',
      NEW.raw_user_meta_data->>'direccion',
      NEW.raw_user_meta_data->>'ciudad',
      NEW.raw_user_meta_data->>'estado',
      NEW.raw_user_meta_data->>'codigo_postal',
      NEW.raw_user_meta_data->>'nombre_contacto',
      NEW.raw_user_meta_data->>'apellido_contacto',
      NEW.email,
      NEW.raw_user_meta_data->>'descripcion',
      'pendiente'::taller_status
    )
    RETURNING id INTO v_taller_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function: is_trial_expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(taller_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN t.estado_suscripcion = 'activo' THEN false
      WHEN t.fecha_fin_prueba IS NULL THEN false
      WHEN t.fecha_fin_prueba < now() THEN true
      ELSE false
    END
  FROM talleres t
  WHERE t.id = taller_id;
$$;

-- Function: reject_taller
CREATE OR REPLACE FUNCTION public.reject_taller(taller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role('super_admin'::app_role, auth.uid()) THEN
    RAISE EXCEPTION 'Solo super administradores pueden rechazar talleres';
  END IF;
  
  UPDATE public.talleres
  SET status = 'rechazado'::taller_status
  WHERE id = taller_id_param;
END;
$$;

-- Function: set_trial_dates
CREATE OR REPLACE FUNCTION public.set_trial_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.fecha_inicio_prueba IS NULL AND NEW.estado_suscripcion = 'prueba' THEN
    NEW.fecha_inicio_prueba := now();
    NEW.fecha_fin_prueba := now() + interval '15 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Function: update_expired_trials
CREATE OR REPLACE FUNCTION public.update_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE talleres
  SET estado_suscripcion = 'expirado'
  WHERE estado_suscripcion = 'prueba'
    AND fecha_fin_prueba < now()
    AND fecha_fin_prueba IS NOT NULL;
END;
$$;

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
