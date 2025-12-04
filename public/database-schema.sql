-- =====================================================
-- DATABASE SCHEMA - Sistema de Gestión de Talleres
-- Generated: 2024-12-04
-- =====================================================

-- =====================================================
-- ENUMS (Tipos Enumerados)
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('taller', 'admin_taller', 'aseguradora', 'super_admin', 'cliente', 'tecnico');
CREATE TYPE public.area_tecnico AS ENUM ('tecnico', 'tecnico_senior');
CREATE TYPE public.estado_cita AS ENUM ('programada', 'confirmada', 'completada', 'cancelada');
CREATE TYPE public.estado_cotizacion AS ENUM ('pendiente', 'aprobada', 'rechazada', 'convertida_a_orden');
CREATE TYPE public.estado_factura AS ENUM ('pendiente', 'pagada', 'parcial', 'vencida', 'cancelada');
CREATE TYPE public.estado_flota AS ENUM ('activa', 'en_renovacion', 'inactiva');
CREATE TYPE public.estado_inventario AS ENUM ('activo', 'descontinuado', 'agotado');
CREATE TYPE public.estado_orden AS ENUM ('recepcion', 'autorizado', 'en_proceso', 'finalizada', 'cancelada');
CREATE TYPE public.estado_solicitud_afiliacion AS ENUM ('pendiente', 'aprobada', 'rechazada');
CREATE TYPE public.estado_suscripcion AS ENUM ('prueba', 'activo', 'expirado');
CREATE TYPE public.estado_vehiculo AS ENUM ('activo', 'en_servicio', 'entregado', 'inactivo');
CREATE TYPE public.metodo_pago AS ENUM ('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro');
CREATE TYPE public.operacion_parte AS ENUM ('corregir', 'reparar', 'cambiar');
CREATE TYPE public.prioridad_orden AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE public.taller_status AS ENUM ('pendiente', 'aprobado', 'rechazado');
CREATE TYPE public.tipo_cliente AS ENUM ('individual', 'empresa', 'flota');
CREATE TYPE public.tipo_comunicacion_externa AS ENUM ('aseguradora', 'arrendadora', 'taller_externo');
CREATE TYPE public.tipo_comunicacion_interna AS ENUM ('gerencia', 'ventas', 'produccion', 'suministro');
CREATE TYPE public.tipo_contrato AS ENUM ('arrendamiento', 'propiedad', 'subcontratacion');
CREATE TYPE public.tipo_flota AS ENUM ('propia', 'alquilada', 'mixta');

-- =====================================================
-- TABLES (Tablas)
-- =====================================================

-- -----------------------------------------------------
-- Table: aseguradoras
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Table: cargos_administrativos
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Table: categorias_servicio
-- -----------------------------------------------------
CREATE TABLE public.categorias_servicio (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: talleres
-- -----------------------------------------------------
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
    status public.taller_status NOT NULL DEFAULT 'pendiente',
    estado_suscripcion public.estado_suscripcion DEFAULT 'prueba',
    fecha_inicio_prueba timestamp with time zone,
    fecha_fin_prueba timestamp with time zone,
    logo_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: user_roles
-- -----------------------------------------------------
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    taller_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- -----------------------------------------------------
-- Table: clientes
-- -----------------------------------------------------
CREATE TABLE public.clientes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    taller_id uuid NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    nombre_empresa text,
    email text NOT NULL,
    telefono text NOT NULL,
    tipo_cliente public.tipo_cliente NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: vehiculos
-- -----------------------------------------------------
CREATE TABLE public.vehiculos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    marca text NOT NULL,
    modelo text NOT NULL,
    anio integer NOT NULL,
    placa text NOT NULL,
    color text NOT NULL,
    vin text NOT NULL,
    kilometraje integer NOT NULL DEFAULT 0,
    estado public.estado_vehiculo NOT NULL DEFAULT 'activo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: servicios
-- -----------------------------------------------------
CREATE TABLE public.servicios (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    categoria_id uuid,
    nombre text NOT NULL,
    descripcion text,
    duracion_estimada integer NOT NULL DEFAULT 60,
    precio numeric NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: tecnicos
-- -----------------------------------------------------
CREATE TABLE public.tecnicos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    taller_id uuid NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    telefono text NOT NULL,
    direccion text NOT NULL,
    fecha_nacimiento date,
    fecha_contratacion date DEFAULT CURRENT_DATE,
    documento_identidad text,
    rtn text,
    genero text,
    codigo_empleado text,
    especialidad_id integer NOT NULL,
    area public.area_tecnico NOT NULL DEFAULT 'tecnico',
    experiencia text NOT NULL,
    habilidades text,
    certificaciones text,
    salario numeric DEFAULT 0,
    frecuencia_pago text,
    estado text DEFAULT 'activo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: tecnico_horarios
-- -----------------------------------------------------
CREATE TABLE public.tecnico_horarios (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tecnico_id uuid NOT NULL,
    dia_semana text NOT NULL,
    hora_inicio text NOT NULL,
    hora_fin text NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: citas
-- -----------------------------------------------------
CREATE TABLE public.citas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    vehiculo_id uuid NOT NULL,
    tecnico_id uuid NOT NULL,
    servicio_id uuid NOT NULL,
    fecha date NOT NULL,
    hora_inicio text NOT NULL,
    hora_fin text NOT NULL,
    estado public.estado_cita NOT NULL DEFAULT 'programada',
    nota text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: ordenes
-- -----------------------------------------------------
CREATE TABLE public.ordenes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    vehiculo_id uuid NOT NULL,
    tipo_servicio_id uuid NOT NULL,
    tecnico_id uuid NOT NULL,
    descripcion text NOT NULL,
    fecha_ingreso timestamp with time zone NOT NULL DEFAULT now(),
    fecha_entrega timestamp with time zone,
    prioridad public.prioridad_orden NOT NULL DEFAULT 'media',
    estado public.estado_orden NOT NULL DEFAULT 'recepcion',
    costo_estimado numeric,
    observaciones text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: cotizaciones
-- -----------------------------------------------------
CREATE TABLE public.cotizaciones (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_cotizacion text NOT NULL,
    taller_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    vehiculo_id uuid NOT NULL,
    fecha date NOT NULL DEFAULT CURRENT_DATE,
    estado public.estado_cotizacion NOT NULL DEFAULT 'pendiente',
    total numeric NOT NULL DEFAULT 0,
    observaciones text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: cotizacion_partes
-- -----------------------------------------------------
CREATE TABLE public.cotizacion_partes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_id uuid NOT NULL,
    categoria_id uuid NOT NULL,
    descripcion text NOT NULL,
    cantidad integer NOT NULL DEFAULT 1,
    operacion public.operacion_parte NOT NULL,
    tipo_material text NOT NULL,
    tipo_reparacion text NOT NULL,
    dias integer NOT NULL DEFAULT 0,
    horas integer NOT NULL DEFAULT 0,
    mano_obra numeric NOT NULL DEFAULT 0,
    materiales numeric NOT NULL DEFAULT 0,
    repuestos numeric NOT NULL DEFAULT 0,
    subtotal numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: facturas
-- -----------------------------------------------------
CREATE TABLE public.facturas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_factura text NOT NULL,
    nombre_factura text NOT NULL,
    taller_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    orden_id uuid,
    estado public.estado_factura NOT NULL DEFAULT 'pendiente',
    fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento date,
    subtotal numeric NOT NULL DEFAULT 0,
    impuestos numeric NOT NULL DEFAULT 0,
    descuento numeric DEFAULT 0,
    total numeric NOT NULL DEFAULT 0,
    metodo_pago public.metodo_pago,
    tipo_tarjeta text,
    referencia_pago text,
    fecha_pago date,
    monto_pagado numeric DEFAULT 0,
    nota_pago text,
    notas text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: inventario
-- -----------------------------------------------------
CREATE TABLE public.inventario (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    categoria_id uuid,
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    precio_compra numeric NOT NULL DEFAULT 0,
    precio_venta numeric NOT NULL DEFAULT 0,
    stock_actual integer NOT NULL DEFAULT 0,
    stock_minimo integer NOT NULL DEFAULT 0,
    proveedor text,
    ubicacion_almacen text,
    fecha_ingreso date NOT NULL DEFAULT CURRENT_DATE,
    estado public.estado_inventario NOT NULL DEFAULT 'activo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: equipo
-- -----------------------------------------------------
CREATE TABLE public.equipo (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    cargo_id uuid NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    telefono text NOT NULL,
    direccion text NOT NULL,
    fecha_nacimiento date,
    documento_identidad text,
    cargo text,
    fecha_contratacion date NOT NULL DEFAULT CURRENT_DATE,
    salario numeric NOT NULL DEFAULT 0,
    frecuencia_pago text NOT NULL DEFAULT 'mensual',
    estado text NOT NULL DEFAULT 'activo',
    genero text,
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- -----------------------------------------------------
-- Table: paquetes_servicios
-- -----------------------------------------------------
CREATE TABLE public.paquetes_servicios (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    precio numeric NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: paquete_servicio_items
-- -----------------------------------------------------
CREATE TABLE public.paquete_servicio_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    paquete_id uuid NOT NULL,
    servicio_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: hojas_ingreso
-- -----------------------------------------------------
CREATE TABLE public.hojas_ingreso (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    vehiculo_id uuid NOT NULL,
    nivel_gasolina text NOT NULL DEFAULT '1/4',
    interiores jsonb NOT NULL DEFAULT '{}',
    exteriores jsonb NOT NULL DEFAULT '{}',
    coqueta jsonb NOT NULL DEFAULT '{}',
    motor jsonb NOT NULL DEFAULT '{}',
    firma_cliente text,
    firma_encargado text,
    comentarios text,
    imagenes_carroceria text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: siniestros
-- -----------------------------------------------------
CREATE TABLE public.siniestros (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    vehiculo_id uuid NOT NULL,
    numero_siniestro text NOT NULL,
    descripcion text NOT NULL,
    fecha_siniestro date NOT NULL,
    monto_estimado numeric NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'pendiente',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flotas
-- -----------------------------------------------------
CREATE TABLE public.flotas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    numero_flota text NOT NULL,
    nombre_flota text NOT NULL,
    razon_social text NOT NULL,
    numero_rtn text NOT NULL,
    tipo_flota public.tipo_flota NOT NULL,
    categoria_vehiculos text[] DEFAULT ARRAY[]::text[],
    rubro_empresa text NOT NULL,
    direccion_fisica text NOT NULL,
    telefono_contacto text NOT NULL,
    correo_contacto text NOT NULL,
    sitio_web text,
    direccion_google_maps text,
    direccion_escrita text,
    direccion_parqueo text,
    direccion_google_maps_parqueo text,
    horarios_atencion text,
    logo_url text,
    cantidad_vehiculos integer NOT NULL DEFAULT 0,
    estado public.estado_flota NOT NULL DEFAULT 'activa',
    fecha_registro timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_vehiculos
-- -----------------------------------------------------
CREATE TABLE public.flota_vehiculos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    marca text NOT NULL,
    modelo text NOT NULL,
    anio integer NOT NULL,
    placa text NOT NULL,
    color text NOT NULL,
    vin text NOT NULL,
    tipo_vehiculo text NOT NULL,
    estado text NOT NULL DEFAULT 'activo',
    kilometraje integer NOT NULL DEFAULT 0,
    fecha_adquisicion date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_conductores
-- -----------------------------------------------------
CREATE TABLE public.flota_conductores (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    documento_identidad text NOT NULL,
    licencia text NOT NULL,
    telefono text NOT NULL,
    email text,
    estado text NOT NULL DEFAULT 'activo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_departamentos
-- -----------------------------------------------------
CREATE TABLE public.flota_departamentos (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    nombre_departamento text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_jefe
-- -----------------------------------------------------
CREATE TABLE public.flota_jefe (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    nombre text NOT NULL,
    telefono text NOT NULL,
    correo text NOT NULL,
    cargo_posicion text NOT NULL,
    horarios_trabajo text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_datos_bancarios
-- -----------------------------------------------------
CREATE TABLE public.flota_datos_bancarios (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    entidad_bancaria text NOT NULL,
    cuenta_bancaria text NOT NULL,
    tipo_cuenta text NOT NULL,
    moneda text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_datos_negociacion
-- -----------------------------------------------------
CREATE TABLE public.flota_datos_negociacion (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    descuento_mano_obra numeric NOT NULL DEFAULT 0,
    descuento_repuestos numeric NOT NULL DEFAULT 0,
    tipo_contrato public.tipo_contrato NOT NULL,
    tiempo_credito integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_tarifas_servicio
-- -----------------------------------------------------
CREATE TABLE public.flota_tarifas_servicio (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    servicio_id uuid NOT NULL,
    tarifa numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_terminos_politicas
-- -----------------------------------------------------
CREATE TABLE public.flota_terminos_politicas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    nombre text NOT NULL,
    documento_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_propietarios
-- -----------------------------------------------------
CREATE TABLE public.flota_propietarios (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    documento_identidad text NOT NULL,
    telefono text NOT NULL,
    email text,
    porcentaje_participacion numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_comunicacion_interna
-- -----------------------------------------------------
CREATE TABLE public.flota_comunicacion_interna (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    tipo public.tipo_comunicacion_interna NOT NULL,
    nombre text NOT NULL,
    telefono text NOT NULL,
    correo text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: flota_comunicacion_externa
-- -----------------------------------------------------
CREATE TABLE public.flota_comunicacion_externa (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    flota_id uuid NOT NULL,
    tipo public.tipo_comunicacion_externa NOT NULL,
    nombre text NOT NULL,
    telefono text NOT NULL,
    correo text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: taller_aseguradoras (Relación muchos a muchos)
-- -----------------------------------------------------
CREATE TABLE public.taller_aseguradoras (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    aseguradora_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: solicitudes_afiliacion
-- -----------------------------------------------------
CREATE TABLE public.solicitudes_afiliacion (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    taller_id uuid NOT NULL,
    aseguradora_id uuid NOT NULL,
    estado public.estado_solicitud_afiliacion NOT NULL DEFAULT 'pendiente',
    mensaje text,
    respuesta text,
    fecha_solicitud timestamp with time zone NOT NULL DEFAULT now(),
    fecha_respuesta timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: mensajes
-- -----------------------------------------------------
CREATE TABLE public.mensajes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    aseguradora_id uuid NOT NULL,
    taller_id uuid NOT NULL,
    sender_type text NOT NULL,
    contenido text NOT NULL,
    leido boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: taller_empleados
-- -----------------------------------------------------
CREATE TABLE public.taller_empleados (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    taller_id uuid NOT NULL,
    nombre text NOT NULL,
    apellidos text NOT NULL,
    email text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: especialidades_taller
-- -----------------------------------------------------
CREATE TABLE public.especialidades_taller (
    id serial PRIMARY KEY,
    nombre text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: tipos_operacion
-- -----------------------------------------------------
CREATE TABLE public.tipos_operacion (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- Table: profiles
-- -----------------------------------------------------
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
STABLE
SECURITY DEFINER
SET search_path = 'public'
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

-- Function: get_aseguradora_id_for_user
CREATE OR REPLACE FUNCTION public.get_aseguradora_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.aseguradoras WHERE user_id = _user_id LIMIT 1;
$$;

-- Function: generate_numero_factura
CREATE OR REPLACE FUNCTION public.generate_numero_factura()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Function: generate_codigo_cotizacion
CREATE OR REPLACE FUNCTION public.generate_codigo_cotizacion()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
SET search_path = 'public'
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

-- Function: set_trial_dates (trigger function)
CREATE OR REPLACE FUNCTION public.set_trial_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
SET search_path = 'public'
AS $$
BEGIN
  UPDATE talleres
  SET estado_suscripcion = 'expirado'
  WHERE estado_suscripcion = 'prueba'
    AND fecha_fin_prueba < now()
    AND fecha_fin_prueba IS NOT NULL;
END;
$$;

-- Function: update_updated_at_column (trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: approve_taller
CREATE OR REPLACE FUNCTION public.approve_taller(taller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Function: reject_taller
CREATE OR REPLACE FUNCTION public.reject_taller(taller_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Function: handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- =====================================================
-- END OF SCHEMA
-- =====================================================
