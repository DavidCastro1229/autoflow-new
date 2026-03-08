-- =====================================================
-- DATABASE SCHEMA FOR WORKSHOP MANAGEMENT SYSTEM
-- Generated: 2026-03-08
-- =====================================================

-- ENUMERATED TYPES
CREATE TYPE public.app_role AS ENUM ('taller', 'admin_taller', 'aseguradora', 'super_admin', 'cliente', 'tecnico', 'flota');
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
CREATE TYPE public.tipo_contacto_aseguradora AS ENUM ('gerente_pais', 'gerente_regional', 'reclamos', 'ajustadores', 'corredores');
CREATE TYPE public.unidad_tiempo_tarea AS ENUM ('minutos', 'horas');

-- =====================================================
-- TABLES (52 total)
-- =====================================================

-- TABLE: aseguradora_contactos
-- Contacts for insurance companies
CREATE TABLE public.aseguradora_contactos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aseguradora_id uuid NOT NULL REFERENCES aseguradoras(id),
    tipo_contacto tipo_contacto_aseguradora NOT NULL,
    nombre text NOT NULL,
    email text,
    telefono text,
    whatsapp text,
    notificar_email boolean NOT NULL DEFAULT false,
    notificar_whatsapp boolean NOT NULL DEFAULT false,
    notificar_app boolean NOT NULL DEFAULT false,
    incluir_cliente_final boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: aseguradoras
-- Insurance companies
CREATE TABLE public.aseguradoras (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: cargos_administrativos
-- Administrative positions
CREATE TABLE public.cargos_administrativos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    emoji text NOT NULL DEFAULT '👤',
    color text NOT NULL DEFAULT 'blue',
    orden integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: catalogo_tareas
-- Task catalog for workshops
CREATE TABLE public.catalogo_tareas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL REFERENCES talleres(id),
    numero_orden integer NOT NULL,
    codigo_tarea text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    objetivo text,
    tipo_tarea text[] NOT NULL DEFAULT ARRAY['operativa'],
    categorias text[] NOT NULL DEFAULT ARRAY[]::text[],
    condiciones_aplicacion text[] NOT NULL DEFAULT ARRAY[]::text[],
    tiempo_estimado integer DEFAULT 0,
    unidad_tiempo unidad_tiempo_tarea DEFAULT 'minutos',
    medidas_seguridad text,
    notas_internas text,
    roles_preferentes integer[] DEFAULT ARRAY[]::integer[],
    forma_pago forma_pago_tarea DEFAULT 'por_hora',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: categorias_servicio
-- Service categories
CREATE TABLE public.categorias_servicio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: citas
-- Appointments
CREATE TABLE public.citas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL REFERENCES talleres(id),
    cliente_id uuid NOT NULL REFERENCES clientes(id),
    vehiculo_id uuid NOT NULL REFERENCES vehiculos(id),
    fecha date NOT NULL,
    hora_inicio text NOT NULL,
    hora_fin text NOT NULL,
    tecnico_id uuid NOT NULL REFERENCES tecnicos(id),
    servicio_id uuid NOT NULL REFERENCES categorias_servicio(id),
    nota text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    estado estado_cita NOT NULL DEFAULT 'programada'
);

-- TABLE: clientes
-- Clients
CREATE TABLE public.clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    taller_id uuid NOT NULL REFERENCES talleres(id),
    nombre text NOT NULL,
    apellido text NOT NULL,
    nombre_empresa text,
    email text NOT NULL,
    telefono text NOT NULL,
    tipo_cliente tipo_cliente NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: convenios_afiliacion
-- Affiliation agreements between aseguradoras and talleres
CREATE TABLE public.convenios_afiliacion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id uuid NOT NULL UNIQUE REFERENCES solicitudes_afiliacion(id),
    tarifa_mo_mecanica numeric NOT NULL DEFAULT 0,
    tarifa_mo_pintura numeric NOT NULL DEFAULT 0,
    descuento_repuestos_b2b numeric NOT NULL DEFAULT 0,
    regla_origen_piezas text NOT NULL DEFAULT 'OEM',
    tiempo_max_inspeccion integer NOT NULL DEFAULT 24,
    tiempo_max_traslado integer NOT NULL DEFAULT 48,
    tiempo_max_presupuesto integer NOT NULL DEFAULT 24,
    tiempo_max_autorizacion_tap integer NOT NULL DEFAULT 24,
    tiempo_max_auth_repuestos integer NOT NULL DEFAULT 24,
    tiempo_max_entrega_repuestos integer NOT NULL DEFAULT 5,
    tiempo_max_reparacion integer NOT NULL DEFAULT 72,
    tiempo_max_auth_complementos integer NOT NULL DEFAULT 12,
    tiempo_max_qc_final integer NOT NULL DEFAULT 4,
    dias_credito_pago integer NOT NULL DEFAULT 30,
    duracion_garantia_meses integer NOT NULL DEFAULT 12,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    firma_aseguradora text,
    firma_taller text,
    fecha_firma_aseguradora timestamptz,
    fecha_firma_taller timestamptz
);

-- TABLE: cotizacion_partes
-- Quotation parts/items
CREATE TABLE public.cotizacion_partes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id uuid NOT NULL REFERENCES cotizaciones(id),
    categoria_id uuid NOT NULL REFERENCES categorias_servicio(id),
    cantidad integer NOT NULL DEFAULT 1,
    descripcion text NOT NULL,
    operacion operacion_parte NOT NULL,
    tipo_material text NOT NULL,
    tipo_reparacion text NOT NULL,
    dias integer NOT NULL DEFAULT 0,
    horas integer NOT NULL DEFAULT 0,
    mano_obra numeric NOT NULL DEFAULT 0,
    materiales numeric NOT NULL DEFAULT 0,
    repuestos numeric NOT NULL DEFAULT 0,
    subtotal numeric NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: cotizaciones
-- Quotations
CREATE TABLE public.cotizaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL REFERENCES talleres(id),
    cliente_id uuid NOT NULL REFERENCES clientes(id),
    vehiculo_id uuid NOT NULL REFERENCES vehiculos(id),
    codigo_cotizacion text NOT NULL,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    estado estado_cotizacion NOT NULL DEFAULT 'pendiente',
    observaciones text,
    total numeric NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: equipo
-- Team members (administrative staff)
CREATE TABLE public.equipo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL REFERENCES talleres(id),
    cargo_id uuid NOT NULL REFERENCES cargos_administrativos(id),
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    telefono text NOT NULL,
    direccion text NOT NULL,
    cargo text,
    documento_identidad text,
    fecha_nacimiento text,
    genero text,
    fecha_contratacion text NOT NULL DEFAULT now(),
    salario numeric NOT NULL DEFAULT 0,
    frecuencia_pago text NOT NULL DEFAULT 'mensual',
    estado text NOT NULL DEFAULT 'activo',
    notas text,
    created_at timestamptz,
    updated_at timestamptz
);

-- TABLE: especialidades_taller
-- Workshop specialties catalog
CREATE TABLE public.especialidades_taller (
    id serial PRIMARY KEY,
    nombre text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: facturas
-- Invoices
CREATE TABLE public.facturas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    cliente_id uuid NOT NULL REFERENCES clientes(id),
    orden_id uuid REFERENCES ordenes(id),
    numero_factura text NOT NULL,
    nombre_factura text NOT NULL,
    fecha_emision text NOT NULL DEFAULT now(),
    fecha_vencimiento text,
    subtotal numeric NOT NULL DEFAULT 0,
    impuestos numeric NOT NULL DEFAULT 0,
    descuento numeric,
    total numeric NOT NULL DEFAULT 0,
    estado estado_factura NOT NULL DEFAULT 'pendiente',
    notas text,
    metodo_pago metodo_pago,
    fecha_pago text,
    monto_pagado numeric,
    referencia_pago text,
    nota_pago text,
    tipo_tarjeta text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: fase_flujos
-- Phase flows (sub-steps within task phases)
CREATE TABLE public.fase_flujos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fase_id uuid NOT NULL REFERENCES tarea_fases(id),
    titulo text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    numero_orden integer NOT NULL,
    completado boolean DEFAULT false,
    tiempo_estimado integer,
    unidad_tiempo unidad_tiempo_tarea,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: fase_materiales
-- Materials required per phase
CREATE TABLE public.fase_materiales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fase_id uuid NOT NULL REFERENCES tarea_fases(id),
    inventario_id uuid NOT NULL REFERENCES inventario(id),
    cantidad integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_comunicacion_externa
-- Fleet external communications
CREATE TABLE public.flota_comunicacion_externa (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    departamento_id uuid NOT NULL REFERENCES flota_departamentos(id),
    nombre text NOT NULL,
    correo text NOT NULL,
    telefono_fijo text,
    celular text,
    whatsapp text,
    tipo tipo_comunicacion_externa NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_comunicacion_interna
-- Fleet internal communications
CREATE TABLE public.flota_comunicacion_interna (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    departamento_id uuid NOT NULL REFERENCES flota_departamentos(id),
    nombre text NOT NULL,
    correo text NOT NULL,
    telefono_fijo text,
    celular text,
    whatsapp text,
    tipo tipo_comunicacion_interna NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_conductores
-- Fleet drivers
CREATE TABLE public.flota_conductores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    nombre text NOT NULL,
    apellido text NOT NULL,
    cedula_identidad text NOT NULL,
    telefono text NOT NULL,
    correo text,
    direccion text NOT NULL,
    ciudad text,
    pais text,
    estado_civil text,
    fecha_nacimiento text NOT NULL,
    fecha_ingreso text NOT NULL,
    numero_licencia text NOT NULL,
    tipo_licencia text NOT NULL,
    fecha_emision_licencia text NOT NULL,
    fecha_vencimiento_licencia text NOT NULL,
    restricciones_licencia text,
    vehiculo_asignado_actual text,
    historial_asignaciones text,
    calificacion_desempeno numeric,
    observaciones_desempeno text,
    viaticos_autorizados numeric,
    limite_diario_viaticos numeric,
    notas_viaticos text,
    contacto_emergencia_nombre text,
    contacto_emergencia_telefono text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_datos_bancarios
-- Fleet banking data
CREATE TABLE public.flota_datos_bancarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    entidad_bancaria text NOT NULL,
    tipo_cuenta text NOT NULL,
    cuenta_bancaria text NOT NULL,
    moneda text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_datos_negociacion
-- Fleet negotiation data
CREATE TABLE public.flota_datos_negociacion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    tipo_contrato tipo_contrato NOT NULL,
    duracion_contrato text NOT NULL,
    fecha_inicio text NOT NULL,
    tarifa_precios numeric,
    tarifa_descuento numeric,
    dias_credito_autorizado integer,
    credito_autorizado_por text,
    descuento_pronto_pago numeric,
    porcentaje_cobro_mora numeric,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_departamentos
-- Fleet departments
CREATE TABLE public.flota_departamentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    nombre_departamento text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_jefe
-- Fleet manager/boss
CREATE TABLE public.flota_jefe (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL UNIQUE REFERENCES flotas(id),
    nombre text NOT NULL,
    cargo_posicion text NOT NULL,
    correo text NOT NULL,
    telefono text NOT NULL,
    horarios_trabajo text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_propietarios
-- Fleet owners
CREATE TABLE public.flota_propietarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    nombre_propietario text NOT NULL,
    razon_social text NOT NULL,
    rtn text NOT NULL,
    correo text NOT NULL,
    telefono text NOT NULL,
    cantidad_vehiculos integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_taller_solicitudes
-- Fleet-Workshop affiliation requests
CREATE TABLE public.flota_taller_solicitudes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    taller_id uuid NOT NULL REFERENCES talleres(id),
    status text NOT NULL DEFAULT 'pendiente',
    mensaje text,
    fecha_respuesta timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_tarifas_servicio
-- Fleet service rates
CREATE TABLE public.flota_tarifas_servicio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    categoria_servicio_id uuid NOT NULL REFERENCES categorias_servicio(id),
    tarifa numeric NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_terminos_politicas
-- Fleet terms and policies
CREATE TABLE public.flota_terminos_politicas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    politicas_uso_vehiculos text[],
    politicas_combustible text[],
    politicas_condiciones_uso text[],
    politicas_renovacion text[],
    seguros_covertura text[],
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flota_vehiculos
-- Fleet vehicles
CREATE TABLE public.flota_vehiculos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flota_id uuid NOT NULL REFERENCES flotas(id),
    numero_unidad text NOT NULL,
    numero_placa text NOT NULL,
    marca_modelo text NOT NULL,
    anio_fabricacion integer NOT NULL,
    numero_vin text NOT NULL,
    kilometraje_actual integer NOT NULL DEFAULT 0,
    estado_vehiculo text NOT NULL,
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
    permisos_especiales text,
    fecha_autorizacion_especiales text,
    fecha_vencimiento_especiales text,
    permiso_publicidad text,
    fecha_autorizacion_publicidad text,
    fecha_vencimiento_publicidad text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: flotas
-- Fleets
CREATE TABLE public.flotas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    taller_id uuid,
    nombre_flota text NOT NULL,
    razon_social text NOT NULL,
    numero_rtn text NOT NULL,
    numero_flota text NOT NULL,
    rubro_empresa text NOT NULL,
    tipo_flota tipo_flota NOT NULL,
    tipo_taller text,
    cantidad_vehiculos integer NOT NULL DEFAULT 0,
    categoria_vehiculos text[],
    telefono_contacto text NOT NULL,
    correo_contacto text NOT NULL,
    direccion_fisica text NOT NULL,
    direccion_escrita text,
    direccion_google_maps text,
    direccion_parqueo text,
    direccion_google_maps_parqueo text,
    ciudad text,
    pais text,
    codigo_postal text,
    nombre_contacto text,
    apellido_contacto text,
    sitio_web text,
    logo_url text,
    horarios_atencion text,
    estado estado_flota NOT NULL DEFAULT 'activa',
    status taller_status NOT NULL DEFAULT 'pendiente',
    fecha_registro text NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: hojas_ingreso
-- Intake inspection sheets
CREATE TABLE public.hojas_ingreso (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL REFERENCES talleres(id),
    vehiculo_id uuid NOT NULL REFERENCES vehiculos(id),
    nivel_gasolina text NOT NULL,
    exteriores jsonb NOT NULL DEFAULT '{}',
    interiores jsonb NOT NULL DEFAULT '{}',
    motor jsonb NOT NULL DEFAULT '{}',
    coqueta jsonb NOT NULL DEFAULT '{}',
    imagenes_carroceria text[],
    firma_cliente text,
    firma_encargado text,
    comentarios text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: inventario
-- Inventory
CREATE TABLE public.inventario (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    categoria_id uuid REFERENCES categorias_servicio(id),
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    precio_compra numeric NOT NULL DEFAULT 0,
    precio_venta numeric NOT NULL DEFAULT 0,
    stock_actual integer NOT NULL DEFAULT 0,
    stock_minimo integer NOT NULL DEFAULT 0,
    proveedor text,
    ubicacion_almacen text,
    fecha_ingreso text NOT NULL DEFAULT now(),
    estado estado_inventario NOT NULL DEFAULT 'activo',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: mensajes
-- Messages between talleres and aseguradoras
CREATE TABLE public.mensajes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL REFERENCES talleres(id),
    aseguradora_id uuid NOT NULL REFERENCES aseguradoras(id),
    contenido text NOT NULL,
    sender_type text NOT NULL,
    leido boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: orden_proceso_historial
-- Order process history (Kanban tracking)
CREATE TABLE public.orden_proceso_historial (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id uuid NOT NULL REFERENCES ordenes(id),
    fase_id uuid NOT NULL REFERENCES tarea_fases(id),
    flujo_id uuid REFERENCES fase_flujos(id),
    fecha_entrada timestamptz NOT NULL DEFAULT now(),
    fecha_salida timestamptz,
    notas text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: ordenes
-- Work orders
CREATE TABLE public.ordenes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    cliente_id uuid NOT NULL REFERENCES clientes(id),
    vehiculo_id uuid NOT NULL REFERENCES vehiculos(id),
    tecnico_id uuid NOT NULL REFERENCES tecnicos(id),
    tipo_servicio_id uuid NOT NULL REFERENCES tipos_operacion(id),
    tarea_id uuid REFERENCES catalogo_tareas(id),
    fase_actual_id uuid REFERENCES tarea_fases(id),
    flujo_actual_id uuid REFERENCES fase_flujos(id),
    descripcion text NOT NULL,
    estado estado_orden NOT NULL DEFAULT 'pendiente',
    prioridad prioridad_orden NOT NULL DEFAULT 'media',
    fecha_ingreso text NOT NULL DEFAULT now(),
    fecha_entrega text,
    costo_estimado numeric,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: paquete_servicio_items
-- Service package items
CREATE TABLE public.paquete_servicio_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    paquete_id uuid NOT NULL REFERENCES paquetes_servicios(id),
    servicio_id uuid NOT NULL REFERENCES servicios(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: paquetes_servicios
-- Service packages
CREATE TABLE public.paquetes_servicios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    precio_total numeric NOT NULL DEFAULT 0,
    descuento numeric,
    estado boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: plantilla_fase_flujos
-- Template phase flows
CREATE TABLE public.plantilla_fase_flujos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_fase_id uuid NOT NULL REFERENCES plantillas_fases(id),
    titulo text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    numero_orden integer NOT NULL DEFAULT 0,
    tiempo_estimado integer,
    unidad_tiempo unidad_tiempo_tarea,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: plantilla_fase_materiales
-- Template phase materials
CREATE TABLE public.plantilla_fase_materiales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_fase_id uuid NOT NULL REFERENCES plantillas_fases(id),
    inventario_id uuid NOT NULL REFERENCES inventario(id),
    cantidad integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: plantillas_fases
-- Phase templates
CREATE TABLE public.plantillas_fases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    titulo text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    tiempo_estimado integer,
    unidad_tiempo unidad_tiempo_tarea,
    notificar boolean,
    mensaje_notificacion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: plantillas_flujos
-- Flow templates
CREATE TABLE public.plantillas_flujos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    titulo text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    tiempo_estimado integer,
    unidad_tiempo unidad_tiempo_tarea,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: profiles
-- User profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    nombre_taller text NOT NULL,
    nombre_contacto text NOT NULL,
    apellido_contacto text NOT NULL,
    email text NOT NULL,
    telefono text NOT NULL,
    direccion text NOT NULL,
    ciudad text NOT NULL,
    estado text NOT NULL,
    codigo_postal text NOT NULL,
    descripcion text,
    nombre_aseguradora text,
    rfc text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: servicios
-- Services
CREATE TABLE public.servicios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    categoria_id uuid NOT NULL REFERENCES categorias_servicio(id),
    nombre text NOT NULL,
    descripcion text,
    precio numeric NOT NULL DEFAULT 0,
    tiempo_estimado jsonb NOT NULL DEFAULT '{}',
    materiales_requeridos text[],
    estado boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: siniestros
-- Insurance claims/accidents
CREATE TABLE public.siniestros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    -- Additional columns managed by the system
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: solicitudes_afiliacion
-- Affiliation requests from aseguradoras to talleres
CREATE TABLE public.solicitudes_afiliacion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    aseguradora_id uuid NOT NULL,
    estado estado_solicitud_afiliacion NOT NULL DEFAULT 'pendiente',
    mensaje text,
    respuesta text,
    fecha_solicitud timestamptz NOT NULL DEFAULT now(),
    fecha_respuesta timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: taller_aseguradoras
-- Many-to-many: talleres <-> aseguradoras
CREATE TABLE public.taller_aseguradoras (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    aseguradora_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: taller_empleados
-- Workshop employees (linked to auth users)
CREATE TABLE public.taller_empleados (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    user_id uuid NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    telefono text,
    cargo text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: talleres
-- Workshops
CREATE TABLE public.talleres (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status taller_status NOT NULL DEFAULT 'pendiente',
    estado_suscripcion estado_suscripcion DEFAULT 'prueba',
    fecha_inicio_prueba timestamptz,
    fecha_fin_prueba timestamptz,
    logo_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: tarea_fases
-- Task phases (Kanban columns)
CREATE TABLE public.tarea_fases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id uuid NOT NULL REFERENCES catalogo_tareas(id),
    titulo text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    numero_orden integer NOT NULL,
    tiempo_estimado integer,
    unidad_tiempo unidad_tiempo_tarea,
    notificar boolean DEFAULT false,
    mensaje_notificacion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: tecnico_horarios
-- Technician schedules
CREATE TABLE public.tecnico_horarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tecnico_id uuid NOT NULL REFERENCES tecnicos(id),
    -- Schedule fields
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: tecnicos
-- Technicians
CREATE TABLE public.tecnicos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    user_id uuid,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    telefono text NOT NULL,
    area area_tecnico NOT NULL DEFAULT 'tecnico',
    especialidad text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: tipos_operacion
-- Operation types for work orders
CREATE TABLE public.tipos_operacion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: user_roles
-- User roles (separate from profiles for security)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    taller_id uuid,
    flota_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- TABLE: vehiculos
-- Vehicles (workshop-managed)
CREATE TABLE public.vehiculos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id uuid NOT NULL,
    cliente_id uuid REFERENCES clientes(id),
    marca text NOT NULL,
    modelo text NOT NULL,
    anio integer NOT NULL,
    color text,
    placa text NOT NULL,
    vin text,
    kilometraje integer DEFAULT 0,
    estado estado_vehiculo NOT NULL DEFAULT 'activo',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- FUNCTIONS (17 total)
-- =====================================================

-- approve_flota(flota_id uuid) -> void
-- approve_taller(taller_id_param uuid) -> void
-- generate_codigo_cotizacion() -> text
-- generate_codigo_producto() -> text
-- generate_codigo_tarea(p_taller_id uuid) -> text
-- generate_numero_factura() -> text
-- get_aseguradora_id_for_user(_user_id uuid) -> uuid [SECURITY DEFINER]
-- get_flota_id_for_user(p_user_id uuid) -> uuid [SECURITY DEFINER]
-- get_next_numero_orden_tarea(p_taller_id uuid) -> integer
-- handle_new_user() -> trigger [SECURITY DEFINER]
-- has_role(_role app_role, _user_id uuid) -> boolean [SECURITY DEFINER]
-- is_flota_owner(_user_id uuid, _flota_id uuid) -> boolean [SECURITY DEFINER]
-- is_taller_member(_user_id uuid, _taller_id uuid) -> boolean [SECURITY DEFINER]
-- is_trial_expired(taller_id uuid) -> boolean [SECURITY DEFINER]
-- reject_flota(flota_id uuid) -> void
-- reject_taller(taller_id_param uuid) -> void
-- set_trial_dates() -> trigger [SECURITY DEFINER]
-- update_expired_trials() -> void [SECURITY DEFINER]
-- update_updated_at_column() -> trigger
