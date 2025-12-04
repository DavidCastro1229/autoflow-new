-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Sistema de Gestión de Talleres
-- Generated: 2024-12-04
-- =====================================================

-- =====================================================
-- TABLE: aseguradoras
-- =====================================================
ALTER TABLE public.aseguradoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can update own data"
ON public.aseguradoras
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Aseguradoras can view own data"
ON public.aseguradoras
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admin full access to aseguradoras"
ON public.aseguradoras
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Talleres can view aseguradoras"
ON public.aseguradoras
FOR SELECT
TO authenticated
USING (has_role('taller'::app_role, auth.uid()) OR has_role('admin_taller'::app_role, auth.uid()));

CREATE POLICY "Talleres can view assigned aseguradoras"
ON public.aseguradoras
FOR SELECT
TO public
USING (
  has_role('admin_taller'::app_role, auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM taller_aseguradoras ta
    JOIN talleres t ON ta.taller_id = t.id
    WHERE ta.aseguradora_id = aseguradoras.id AND t.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: cargos_administrativos
-- =====================================================
ALTER TABLE public.cargos_administrativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cargos administrativos"
ON public.cargos_administrativos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage cargos administrativos"
ON public.cargos_administrativos
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- =====================================================
-- TABLE: categorias_servicio
-- =====================================================
ALTER TABLE public.categorias_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categorias"
ON public.categorias_servicio
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage categorias"
ON public.categorias_servicio
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- =====================================================
-- TABLE: citas
-- =====================================================
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all citas"
ON public.citas
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create citas for their taller"
ON public.citas
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's citas"
ON public.citas
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's citas"
ON public.citas
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's citas"
ON public.citas
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: clientes
-- =====================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can view clients from affiliated talleres"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM taller_aseguradoras ta
    JOIN aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = clientes.taller_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all clients"
ON public.clientes
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their taller's clients"
ON public.clientes
FOR ALL
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's clients"
ON public.clientes
FOR SELECT
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own client info"
ON public.clientes
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: cotizacion_partes
-- =====================================================
ALTER TABLE public.cotizacion_partes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can view cotizacion partes"
ON public.cotizacion_partes
FOR SELECT
TO authenticated
USING (
  cotizacion_id IN (
    SELECT cotizaciones.id FROM cotizaciones
    WHERE has_role('aseguradora'::app_role, auth.uid())
  )
);

CREATE POLICY "Super admins can manage all cotizacion partes"
ON public.cotizacion_partes
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their cotizacion partes"
ON public.cotizacion_partes
FOR ALL
TO authenticated
USING (
  cotizacion_id IN (
    SELECT cotizaciones.id FROM cotizaciones
    WHERE cotizaciones.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  cotizacion_id IN (
    SELECT cotizaciones.id FROM cotizaciones
    WHERE cotizaciones.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Taller employees can view their cotizacion partes"
ON public.cotizacion_partes
FOR SELECT
TO authenticated
USING (
  cotizacion_id IN (
    SELECT cotizaciones.id FROM cotizaciones
    WHERE cotizaciones.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: cotizaciones
-- =====================================================
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can view cotizaciones"
ON public.cotizaciones
FOR SELECT
TO authenticated
USING (has_role('aseguradora'::app_role, auth.uid()));

CREATE POLICY "Super admins can manage all cotizaciones"
ON public.cotizaciones
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create cotizaciones for their taller"
ON public.cotizaciones
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's cotizaciones"
ON public.cotizaciones
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's cotizaciones"
ON public.cotizaciones
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's cotizaciones"
ON public.cotizaciones
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: equipo
-- =====================================================
ALTER TABLE public.equipo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all equipo"
ON public.equipo
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create equipo for their taller"
ON public.equipo
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's equipo"
ON public.equipo
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's equipo"
ON public.equipo
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's equipo"
ON public.equipo
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: especialidades_taller
-- =====================================================
ALTER TABLE public.especialidades_taller ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view especialidades"
ON public.especialidades_taller
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage especialidades"
ON public.especialidades_taller
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- =====================================================
-- TABLE: facturas
-- =====================================================
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all facturas"
ON public.facturas
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create facturas for their taller"
ON public.facturas
FOR INSERT
TO public
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's facturas"
ON public.facturas
FOR DELETE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's facturas"
ON public.facturas
FOR UPDATE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's facturas"
ON public.facturas
FOR SELECT
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: flota_comunicacion_externa
-- =====================================================
ALTER TABLE public.flota_comunicacion_externa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all comunicacion externa"
ON public.flota_comunicacion_externa
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage comunicacion externa"
ON public.flota_comunicacion_externa
FOR ALL
TO public
USING (
  departamento_id IN (
    SELECT flota_departamentos.id FROM flota_departamentos
    WHERE flota_departamentos.flota_id IN (
      SELECT flotas.id FROM flotas
      WHERE flotas.taller_id IN (
        SELECT user_roles.taller_id FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  departamento_id IN (
    SELECT flota_departamentos.id FROM flota_departamentos
    WHERE flota_departamentos.flota_id IN (
      SELECT flotas.id FROM flotas
      WHERE flotas.taller_id IN (
        SELECT user_roles.taller_id FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Taller employees can view comunicacion externa"
ON public.flota_comunicacion_externa
FOR SELECT
TO public
USING (
  departamento_id IN (
    SELECT flota_departamentos.id FROM flota_departamentos
    WHERE flota_departamentos.flota_id IN (
      SELECT flotas.id FROM flotas
      WHERE flotas.taller_id IN (
        SELECT user_roles.taller_id FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- TABLE: flota_comunicacion_interna
-- =====================================================
ALTER TABLE public.flota_comunicacion_interna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all comunicacion interna"
ON public.flota_comunicacion_interna
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage comunicacion interna"
ON public.flota_comunicacion_interna
FOR ALL
TO public
USING (
  departamento_id IN (
    SELECT flota_departamentos.id FROM flota_departamentos
    WHERE flota_departamentos.flota_id IN (
      SELECT flotas.id FROM flotas
      WHERE flotas.taller_id IN (
        SELECT user_roles.taller_id FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  departamento_id IN (
    SELECT flota_departamentos.id FROM flota_departamentos
    WHERE flota_departamentos.flota_id IN (
      SELECT flotas.id FROM flotas
      WHERE flotas.taller_id IN (
        SELECT user_roles.taller_id FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Taller employees can view comunicacion interna"
ON public.flota_comunicacion_interna
FOR SELECT
TO public
USING (
  departamento_id IN (
    SELECT flota_departamentos.id FROM flota_departamentos
    WHERE flota_departamentos.flota_id IN (
      SELECT flotas.id FROM flotas
      WHERE flotas.taller_id IN (
        SELECT user_roles.taller_id FROM user_roles
        WHERE user_roles.user_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- TABLE: flota_conductores
-- =====================================================
ALTER TABLE public.flota_conductores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all conductores"
ON public.flota_conductores
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage conductores"
ON public.flota_conductores
FOR ALL
TO authenticated
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_datos_bancarios
-- =====================================================
ALTER TABLE public.flota_datos_bancarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all datos bancarios"
ON public.flota_datos_bancarios
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage datos bancarios"
ON public.flota_datos_bancarios
FOR ALL
TO authenticated
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_datos_negociacion
-- =====================================================
ALTER TABLE public.flota_datos_negociacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all datos negociacion"
ON public.flota_datos_negociacion
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage datos negociacion"
ON public.flota_datos_negociacion
FOR ALL
TO authenticated
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_departamentos
-- =====================================================
ALTER TABLE public.flota_departamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all departamentos"
ON public.flota_departamentos
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage departamentos"
ON public.flota_departamentos
FOR ALL
TO public
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Taller employees can view departamentos"
ON public.flota_departamentos
FOR SELECT
TO public
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_jefe
-- =====================================================
ALTER TABLE public.flota_jefe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all jefe"
ON public.flota_jefe
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage jefe"
ON public.flota_jefe
FOR ALL
TO public
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Taller employees can view jefe"
ON public.flota_jefe
FOR SELECT
TO public
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_propietarios
-- =====================================================
ALTER TABLE public.flota_propietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all propietarios"
ON public.flota_propietarios
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage propietarios"
ON public.flota_propietarios
FOR ALL
TO public
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Taller employees can view propietarios"
ON public.flota_propietarios
FOR SELECT
TO public
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_tarifas_servicio
-- =====================================================
ALTER TABLE public.flota_tarifas_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all tarifas servicio"
ON public.flota_tarifas_servicio
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage tarifas servicio"
ON public.flota_tarifas_servicio
FOR ALL
TO authenticated
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_terminos_politicas
-- =====================================================
ALTER TABLE public.flota_terminos_politicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all terminos politicas"
ON public.flota_terminos_politicas
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage terminos politicas"
ON public.flota_terminos_politicas
FOR ALL
TO authenticated
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flota_vehiculos
-- =====================================================
ALTER TABLE public.flota_vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all vehiculos"
ON public.flota_vehiculos
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage vehiculos"
ON public.flota_vehiculos
FOR ALL
TO authenticated
USING (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  flota_id IN (
    SELECT flotas.id FROM flotas
    WHERE flotas.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: flotas
-- =====================================================
ALTER TABLE public.flotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all flotas"
ON public.flotas
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create flotas"
ON public.flotas
FOR INSERT
TO public
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's flotas"
ON public.flotas
FOR DELETE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's flotas"
ON public.flotas
FOR UPDATE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's flotas"
ON public.flotas
FOR SELECT
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: hojas_ingreso
-- =====================================================
ALTER TABLE public.hojas_ingreso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can view hojas ingreso from affiliated talleres"
ON public.hojas_ingreso
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM taller_aseguradoras ta
    JOIN aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = hojas_ingreso.taller_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all hojas ingreso"
ON public.hojas_ingreso
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create hojas ingreso"
ON public.hojas_ingreso
FOR INSERT
TO public
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's hojas ingreso"
ON public.hojas_ingreso
FOR DELETE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's hojas ingreso"
ON public.hojas_ingreso
FOR UPDATE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's hojas ingreso"
ON public.hojas_ingreso
FOR SELECT
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: inventario
-- =====================================================
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all inventario"
ON public.inventario
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create inventario for their taller"
ON public.inventario
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's inventario"
ON public.inventario
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's inventario"
ON public.inventario
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's inventario"
ON public.inventario
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: mensajes
-- =====================================================
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can send messages to their talleres"
ON public.mensajes
FOR INSERT
TO authenticated
WITH CHECK (
  aseguradora_id = get_aseguradora_id_for_user(auth.uid()) AND sender_type = 'aseguradora'
);

CREATE POLICY "Aseguradoras can view messages with their talleres"
ON public.mensajes
FOR SELECT
TO authenticated
USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));

CREATE POLICY "Super admins can manage all mensajes"
ON public.mensajes
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Talleres can send messages to their aseguradoras"
ON public.mensajes
FOR INSERT
TO public
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  ) AND sender_type = 'taller'
);

CREATE POLICY "Talleres can view messages with their aseguradoras"
ON public.mensajes
FOR SELECT
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their received messages"
ON public.mensajes
FOR UPDATE
TO public
USING (
  (sender_type = 'taller' AND aseguradora_id IN (
    SELECT aseguradoras.id FROM aseguradoras
    WHERE aseguradoras.user_id = auth.uid()
  )) OR
  (sender_type = 'aseguradora' AND taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  ))
);

-- =====================================================
-- TABLE: ordenes
-- =====================================================
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all ordenes"
ON public.ordenes
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create ordenes for their taller"
ON public.ordenes
FOR INSERT
TO public
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's ordenes"
ON public.ordenes
FOR DELETE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's ordenes"
ON public.ordenes
FOR UPDATE
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's ordenes"
ON public.ordenes
FOR SELECT
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: paquete_servicio_items
-- =====================================================
ALTER TABLE public.paquete_servicio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all paquete items"
ON public.paquete_servicio_items
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create paquete items"
ON public.paquete_servicio_items
FOR INSERT
TO authenticated
WITH CHECK (
  paquete_id IN (
    SELECT paquetes_servicios.id FROM paquetes_servicios
    WHERE paquetes_servicios.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Taller employees can delete paquete items"
ON public.paquete_servicio_items
FOR DELETE
TO authenticated
USING (
  paquete_id IN (
    SELECT paquetes_servicios.id FROM paquetes_servicios
    WHERE paquetes_servicios.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Taller employees can view their taller's paquete items"
ON public.paquete_servicio_items
FOR SELECT
TO authenticated
USING (
  paquete_id IN (
    SELECT paquetes_servicios.id FROM paquetes_servicios
    WHERE paquetes_servicios.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: paquetes_servicios
-- =====================================================
ALTER TABLE public.paquetes_servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all paquetes"
ON public.paquetes_servicios
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create paquetes for their taller"
ON public.paquetes_servicios
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's paquetes"
ON public.paquetes_servicios
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's paquetes"
ON public.paquetes_servicios
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's paquetes"
ON public.paquetes_servicios
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: profiles
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO public
USING (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO public
USING (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO public
USING (auth.uid() = id);

-- =====================================================
-- TABLE: servicios
-- =====================================================
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all servicios"
ON public.servicios
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can create servicios for their taller"
ON public.servicios
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can delete their taller's servicios"
ON public.servicios
FOR DELETE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can update their taller's servicios"
ON public.servicios
FOR UPDATE
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's servicios"
ON public.servicios
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: siniestros
-- =====================================================
ALTER TABLE public.siniestros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can view their talleres' siniestros"
ON public.siniestros
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM taller_aseguradoras ta
    JOIN aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = siniestros.taller_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all siniestros"
ON public.siniestros
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their taller's siniestros"
ON public.siniestros
FOR ALL
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: solicitudes_afiliacion
-- =====================================================
ALTER TABLE public.solicitudes_afiliacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can update their solicitudes"
ON public.solicitudes_afiliacion
FOR UPDATE
TO authenticated
USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));

CREATE POLICY "Aseguradoras can view their solicitudes"
ON public.solicitudes_afiliacion
FOR SELECT
TO authenticated
USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));

CREATE POLICY "Super admins can manage all solicitudes"
ON public.solicitudes_afiliacion
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Talleres can create solicitudes"
ON public.solicitudes_afiliacion
FOR INSERT
TO authenticated
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Talleres can view their own solicitudes"
ON public.solicitudes_afiliacion
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: taller_aseguradoras
-- =====================================================
ALTER TABLE public.taller_aseguradoras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can create affiliations when approving"
ON public.taller_aseguradoras
FOR INSERT
TO authenticated
WITH CHECK (
  aseguradora_id = get_aseguradora_id_for_user(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM solicitudes_afiliacion sa
    WHERE sa.taller_id = taller_aseguradoras.taller_id
      AND sa.aseguradora_id = taller_aseguradoras.aseguradora_id
      AND sa.estado = 'pendiente'::estado_solicitud_afiliacion
  )
);

CREATE POLICY "Aseguradoras can view their talleres"
ON public.taller_aseguradoras
FOR SELECT
TO authenticated
USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));

CREATE POLICY "Super admins can manage taller_aseguradoras"
ON public.taller_aseguradoras
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Talleres can view their aseguradoras"
ON public.taller_aseguradoras
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM talleres t
    WHERE t.id = taller_aseguradoras.taller_id AND t.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: taller_empleados
-- =====================================================
ALTER TABLE public.taller_empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view from same taller"
ON public.taller_empleados
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all employees"
ON public.taller_empleados
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Users can view their own employee info"
ON public.taller_empleados
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users with taller can manage employees"
ON public.taller_empleados
FOR ALL
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- TABLE: talleres
-- =====================================================
ALTER TABLE public.talleres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin taller can view own taller"
ON public.talleres
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Aseguradoras can view talleres with solicitudes"
ON public.talleres
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_afiliacion sa
    WHERE sa.taller_id = talleres.id
      AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid())
  )
);

CREATE POLICY "Super admins can update talleres status"
ON public.talleres
FOR UPDATE
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Super admins can view all talleres"
ON public.talleres
FOR SELECT
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Users can update their own taller"
ON public.talleres
FOR UPDATE
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own taller"
ON public.talleres
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: tecnico_horarios
-- =====================================================
ALTER TABLE public.tecnico_horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all horarios"
ON public.tecnico_horarios
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage horarios"
ON public.tecnico_horarios
FOR ALL
TO public
USING (
  tecnico_id IN (
    SELECT t.id FROM tecnicos t
    WHERE t.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  tecnico_id IN (
    SELECT t.id FROM tecnicos t
    WHERE t.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Taller employees can view horarios"
ON public.tecnico_horarios
FOR SELECT
TO public
USING (
  tecnico_id IN (
    SELECT t.id FROM tecnicos t
    WHERE t.taller_id IN (
      SELECT user_roles.taller_id FROM user_roles
      WHERE user_roles.user_id = auth.uid()
    )
  )
);

-- =====================================================
-- TABLE: tecnicos
-- =====================================================
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all tecnicos"
ON public.tecnicos
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their taller's tecnicos"
ON public.tecnicos
FOR ALL
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's tecnicos"
ON public.tecnicos
FOR SELECT
TO authenticated
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Tecnicos can view their own info"
ON public.tecnicos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: tipos_operacion
-- =====================================================
ALTER TABLE public.tipos_operacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin taller puede gestionar tipos de operación"
ON public.tipos_operacion
FOR ALL
TO public
USING (has_role('admin_taller'::app_role, auth.uid()))
WITH CHECK (has_role('admin_taller'::app_role, auth.uid()));

CREATE POLICY "Super admins pueden gestionar tipos de operación"
ON public.tipos_operacion
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Usuarios autenticados pueden ver tipos de operación"
ON public.tipos_operacion
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- TABLE: user_roles
-- =====================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: vehiculos
-- =====================================================
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aseguradoras can view vehicles from affiliated talleres"
ON public.vehiculos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM taller_aseguradoras ta
    JOIN aseguradoras a ON a.id = ta.aseguradora_id
    WHERE ta.taller_id = vehiculos.taller_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all vehicles"
ON public.vehiculos
FOR ALL
TO public
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

CREATE POLICY "Taller employees can manage their taller's vehicles"
ON public.vehiculos
FOR ALL
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
)
WITH CHECK (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

CREATE POLICY "Taller employees can view their taller's vehicles"
ON public.vehiculos
FOR SELECT
TO public
USING (
  taller_id IN (
    SELECT user_roles.taller_id FROM user_roles
    WHERE user_roles.user_id = auth.uid()
  )
);

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================
