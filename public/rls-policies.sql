-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- WORKSHOP MANAGEMENT SYSTEM
-- Generated: 2026-03-08
-- =====================================================

-- All 52 tables have RLS enabled with policies for:
-- - Super admins (full access)
-- - Taller employees (access to their taller's data)
-- - Aseguradoras (access to affiliated talleres' data)
-- - Flotas (access to their own fleet data)
-- - Users (access to their own data)

-- =====================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- (Used to prevent infinite recursion in RLS policies)
-- =====================================================
-- has_role(_role app_role, _user_id uuid) -> boolean
-- is_taller_member(_user_id uuid, _taller_id uuid) -> boolean
-- is_flota_owner(_user_id uuid, _flota_id uuid) -> boolean
-- get_aseguradora_id_for_user(_user_id uuid) -> uuid
-- get_flota_id_for_user(p_user_id uuid) -> uuid

-- =====================================================
-- TABLE: aseguradora_contactos
-- =====================================================
CREATE POLICY "Aseguradoras can manage their own contacts" ON public.aseguradora_contactos FOR ALL USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid())) WITH CHECK (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));
CREATE POLICY "Super admins can manage all contacts" ON public.aseguradora_contactos FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- =====================================================
-- TABLE: aseguradoras
-- =====================================================
CREATE POLICY "Aseguradoras can update own data" ON public.aseguradoras FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Aseguradoras can view own data" ON public.aseguradoras FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admin full access to aseguradoras" ON public.aseguradoras FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Super admins can manage aseguradoras" ON public.aseguradoras FOR ALL USING (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Super admins can view all aseguradoras" ON public.aseguradoras FOR SELECT USING (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Talleres can view aseguradoras" ON public.aseguradoras FOR SELECT TO authenticated USING (has_role('taller'::app_role, auth.uid()) OR has_role('admin_taller'::app_role, auth.uid()));
CREATE POLICY "Talleres can view assigned aseguradoras" ON public.aseguradoras FOR SELECT USING (has_role('admin_taller'::app_role, auth.uid()) AND EXISTS (SELECT 1 FROM taller_aseguradoras ta JOIN talleres t ON ta.taller_id = t.id WHERE ta.aseguradora_id = aseguradoras.id AND t.user_id = auth.uid()));
CREATE POLICY "Users can update their own aseguradora" ON public.aseguradoras FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own aseguradora" ON public.aseguradoras FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: cargos_administrativos
-- =====================================================
CREATE POLICY "Authenticated users can view cargos administrativos" ON public.cargos_administrativos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage cargos administrativos" ON public.cargos_administrativos FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- =====================================================
-- TABLE: catalogo_tareas
-- =====================================================
CREATE POLICY "Super admins can manage all catalogo_tareas" ON public.catalogo_tareas FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create catalogo_tareas for their taller" ON public.catalogo_tareas FOR INSERT WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's catalogo_tareas" ON public.catalogo_tareas FOR DELETE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's catalogo_tareas" ON public.catalogo_tareas FOR UPDATE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's catalogo_tareas" ON public.catalogo_tareas FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: categorias_servicio
-- =====================================================
CREATE POLICY "Authenticated users can view categorias" ON public.categorias_servicio FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage categorias" ON public.categorias_servicio FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- =====================================================
-- TABLE: citas
-- =====================================================
CREATE POLICY "Super admins can manage all citas" ON public.citas FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create citas for their taller" ON public.citas FOR INSERT TO authenticated WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's citas" ON public.citas FOR DELETE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's citas" ON public.citas FOR UPDATE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's citas" ON public.citas FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: clientes
-- =====================================================
CREATE POLICY "Aseguradoras can view clients from affiliated talleres" ON public.clientes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM taller_aseguradoras ta JOIN aseguradoras a ON a.id = ta.aseguradora_id WHERE ta.taller_id = clientes.taller_id AND a.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all clients" ON public.clientes FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their taller's clients" ON public.clientes FOR ALL USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())) WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's clients" ON public.clientes FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Users can view their own client info" ON public.clientes FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: convenios_afiliacion
-- =====================================================
CREATE POLICY "Aseguradoras can delete convenios of pending solicitudes" ON public.convenios_afiliacion FOR DELETE USING (EXISTS (SELECT 1 FROM solicitudes_afiliacion sa WHERE sa.id = convenios_afiliacion.solicitud_id AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid()) AND sa.estado = 'pendiente'));
CREATE POLICY "Aseguradoras can manage their convenios" ON public.convenios_afiliacion FOR ALL USING (EXISTS (SELECT 1 FROM solicitudes_afiliacion sa WHERE sa.id = convenios_afiliacion.solicitud_id AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM solicitudes_afiliacion sa WHERE sa.id = convenios_afiliacion.solicitud_id AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid())));
CREATE POLICY "Super admins can manage all convenios" ON public.convenios_afiliacion FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Talleres can view convenios for their solicitudes" ON public.convenios_afiliacion FOR SELECT USING (EXISTS (SELECT 1 FROM solicitudes_afiliacion sa WHERE sa.id = convenios_afiliacion.solicitud_id AND sa.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: cotizacion_partes
-- =====================================================
CREATE POLICY "Aseguradoras can view cotizacion partes" ON public.cotizacion_partes FOR SELECT TO authenticated USING (cotizacion_id IN (SELECT id FROM cotizaciones WHERE has_role('aseguradora'::app_role, auth.uid())));
CREATE POLICY "Super admins can manage all cotizacion partes" ON public.cotizacion_partes FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their cotizacion partes" ON public.cotizacion_partes FOR ALL TO authenticated USING (cotizacion_id IN (SELECT id FROM cotizaciones WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (cotizacion_id IN (SELECT id FROM cotizaciones WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Taller employees can view their cotizacion partes" ON public.cotizacion_partes FOR SELECT TO authenticated USING (cotizacion_id IN (SELECT id FROM cotizaciones WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: cotizaciones
-- =====================================================
CREATE POLICY "Aseguradoras can view cotizaciones" ON public.cotizaciones FOR SELECT TO authenticated USING (has_role('aseguradora'::app_role, auth.uid()));
CREATE POLICY "Super admins can manage all cotizaciones" ON public.cotizaciones FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create cotizaciones for their taller" ON public.cotizaciones FOR INSERT TO authenticated WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's cotizaciones" ON public.cotizaciones FOR DELETE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's cotizaciones" ON public.cotizaciones FOR UPDATE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's cotizaciones" ON public.cotizaciones FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: equipo
-- =====================================================
CREATE POLICY "Super admins can manage all equipo" ON public.equipo FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create equipo for their taller" ON public.equipo FOR INSERT TO authenticated WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's equipo" ON public.equipo FOR DELETE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's equipo" ON public.equipo FOR UPDATE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's equipo" ON public.equipo FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: especialidades_taller
-- =====================================================
CREATE POLICY "Authenticated users can view especialidades" ON public.especialidades_taller FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage especialidades" ON public.especialidades_taller FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- =====================================================
-- TABLE: facturas
-- =====================================================
CREATE POLICY "Super admins can manage all facturas" ON public.facturas FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create facturas for their taller" ON public.facturas FOR INSERT WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's facturas" ON public.facturas FOR DELETE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's facturas" ON public.facturas FOR UPDATE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's facturas" ON public.facturas FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: fase_flujos
-- =====================================================
CREATE POLICY "Super admins can manage all fase_flujos" ON public.fase_flujos FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their taller's fase_flujos" ON public.fase_flujos FOR ALL USING (fase_id IN (SELECT tf.id FROM tarea_fases tf JOIN catalogo_tareas ct ON ct.id = tf.tarea_id WHERE ct.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (fase_id IN (SELECT tf.id FROM tarea_fases tf JOIN catalogo_tareas ct ON ct.id = tf.tarea_id WHERE ct.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: fase_materiales
-- =====================================================
CREATE POLICY "Super admins can manage all fase_materiales" ON public.fase_materiales FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their taller's fase_materiales" ON public.fase_materiales FOR ALL USING (fase_id IN (SELECT tf.id FROM tarea_fases tf JOIN catalogo_tareas ct ON ct.id = tf.tarea_id WHERE ct.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (fase_id IN (SELECT tf.id FROM tarea_fases tf JOIN catalogo_tareas ct ON ct.id = tf.tarea_id WHERE ct.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_comunicacion_externa
-- =====================================================
CREATE POLICY "Flota users can manage their own comunicacion externa" ON public.flota_comunicacion_externa FOR ALL USING (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid())) WITH CHECK (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all comunicacion externa" ON public.flota_comunicacion_externa FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage comunicacion externa" ON public.flota_comunicacion_externa FOR ALL USING (departamento_id IN (SELECT id FROM flota_departamentos WHERE flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())))) WITH CHECK (departamento_id IN (SELECT id FROM flota_departamentos WHERE flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))));
CREATE POLICY "Taller employees can view comunicacion externa" ON public.flota_comunicacion_externa FOR SELECT USING (departamento_id IN (SELECT id FROM flota_departamentos WHERE flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))));

-- =====================================================
-- TABLE: flota_comunicacion_interna
-- =====================================================
CREATE POLICY "Flota users can manage their own comunicacion interna" ON public.flota_comunicacion_interna FOR ALL USING (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid())) WITH CHECK (departamento_id IN (SELECT fd.id FROM flota_departamentos fd JOIN flotas f ON f.id = fd.flota_id WHERE f.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all comunicacion interna" ON public.flota_comunicacion_interna FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage comunicacion interna" ON public.flota_comunicacion_interna FOR ALL USING (departamento_id IN (SELECT id FROM flota_departamentos WHERE flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())))) WITH CHECK (departamento_id IN (SELECT id FROM flota_departamentos WHERE flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))));
CREATE POLICY "Taller employees can view comunicacion interna" ON public.flota_comunicacion_interna FOR SELECT USING (departamento_id IN (SELECT id FROM flota_departamentos WHERE flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))));

-- =====================================================
-- TABLE: flota_conductores
-- =====================================================
CREATE POLICY "Flota users can manage their own conductores" ON public.flota_conductores FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all conductores" ON public.flota_conductores FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage conductores" ON public.flota_conductores FOR ALL TO authenticated USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_datos_bancarios
-- =====================================================
CREATE POLICY "Flota users can manage their own datos bancarios" ON public.flota_datos_bancarios FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all datos bancarios" ON public.flota_datos_bancarios FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage datos bancarios" ON public.flota_datos_bancarios FOR ALL TO authenticated USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_datos_negociacion
-- =====================================================
CREATE POLICY "Flota users can manage their own datos negociacion" ON public.flota_datos_negociacion FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all datos negociacion" ON public.flota_datos_negociacion FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage datos negociacion" ON public.flota_datos_negociacion FOR ALL TO authenticated USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_departamentos
-- =====================================================
CREATE POLICY "Flota users can manage their own departamentos" ON public.flota_departamentos FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all departamentos" ON public.flota_departamentos FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage departamentos" ON public.flota_departamentos FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Taller employees can view departamentos" ON public.flota_departamentos FOR SELECT USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_jefe
-- =====================================================
CREATE POLICY "Flota users can manage their own jefe" ON public.flota_jefe FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all jefe" ON public.flota_jefe FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage jefe" ON public.flota_jefe FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Taller employees can view jefe" ON public.flota_jefe FOR SELECT USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_propietarios
-- =====================================================
CREATE POLICY "Flota users can manage their own propietarios" ON public.flota_propietarios FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all propietarios" ON public.flota_propietarios FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage propietarios" ON public.flota_propietarios FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Taller employees can view propietarios" ON public.flota_propietarios FOR SELECT USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_taller_solicitudes
-- (Uses SECURITY DEFINER functions to prevent recursion)
-- =====================================================
CREATE POLICY "fts_select" ON public.flota_taller_solicitudes FOR SELECT TO authenticated USING (is_flota_owner(auth.uid(), flota_id) OR is_taller_member(auth.uid(), taller_id) OR has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "fts_insert" ON public.flota_taller_solicitudes FOR INSERT TO authenticated WITH CHECK (is_flota_owner(auth.uid(), flota_id));
CREATE POLICY "fts_update" ON public.flota_taller_solicitudes FOR UPDATE TO authenticated USING (is_taller_member(auth.uid(), taller_id) OR has_role('super_admin'::app_role, auth.uid())) WITH CHECK (is_taller_member(auth.uid(), taller_id) OR has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "fts_delete" ON public.flota_taller_solicitudes FOR DELETE TO authenticated USING (is_flota_owner(auth.uid(), flota_id) AND status = 'pendiente');

-- =====================================================
-- TABLE: flota_tarifas_servicio
-- =====================================================
CREATE POLICY "Flota users can manage their own tarifas" ON public.flota_tarifas_servicio FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all tarifas servicio" ON public.flota_tarifas_servicio FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage tarifas servicio" ON public.flota_tarifas_servicio FOR ALL TO authenticated USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_terminos_politicas
-- =====================================================
CREATE POLICY "Flota users can manage their own terminos" ON public.flota_terminos_politicas FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all terminos politicas" ON public.flota_terminos_politicas FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage terminos politicas" ON public.flota_terminos_politicas FOR ALL TO authenticated USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flota_vehiculos
-- =====================================================
CREATE POLICY "Flota users can manage their own vehiculos" ON public.flota_vehiculos FOR ALL USING (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid())) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all vehiculos" ON public.flota_vehiculos FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage vehiculos" ON public.flota_vehiculos FOR ALL TO authenticated USING (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (flota_id IN (SELECT id FROM flotas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: flotas
-- =====================================================
CREATE POLICY "Flota users can update their own flota" ON public.flotas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Flota users can view their own flota" ON public.flotas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage all flotas" ON public.flotas FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create flotas" ON public.flotas FOR INSERT WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's flotas" ON public.flotas FOR DELETE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's flotas" ON public.flotas FOR UPDATE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's flotas" ON public.flotas FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller users can view flotas with solicitudes" ON public.flotas FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM flota_taller_solicitudes fts JOIN user_roles ur ON ur.taller_id = fts.taller_id AND ur.user_id = auth.uid() WHERE fts.flota_id = flotas.id AND ur.role IN ('taller', 'admin_taller')));

-- =====================================================
-- TABLE: hojas_ingreso
-- =====================================================
CREATE POLICY "Aseguradoras can view hojas ingreso from affiliated talleres" ON public.hojas_ingreso FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM taller_aseguradoras ta JOIN aseguradoras a ON a.id = ta.aseguradora_id WHERE ta.taller_id = hojas_ingreso.taller_id AND a.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all hojas ingreso" ON public.hojas_ingreso FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create hojas ingreso" ON public.hojas_ingreso FOR INSERT WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's hojas ingreso" ON public.hojas_ingreso FOR DELETE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's hojas ingreso" ON public.hojas_ingreso FOR UPDATE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's hojas ingreso" ON public.hojas_ingreso FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: inventario
-- =====================================================
CREATE POLICY "Super admins can manage all inventario" ON public.inventario FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create inventario for their taller" ON public.inventario FOR INSERT TO authenticated WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's inventario" ON public.inventario FOR DELETE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's inventario" ON public.inventario FOR UPDATE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's inventario" ON public.inventario FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: mensajes
-- =====================================================
CREATE POLICY "Aseguradoras can send messages to their talleres" ON public.mensajes FOR INSERT TO authenticated WITH CHECK (aseguradora_id = get_aseguradora_id_for_user(auth.uid()) AND sender_type = 'aseguradora');
CREATE POLICY "Aseguradoras can view messages with their talleres" ON public.mensajes FOR SELECT TO authenticated USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));
CREATE POLICY "Super admins can manage all mensajes" ON public.mensajes FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Talleres can send messages to their aseguradoras" ON public.mensajes FOR INSERT WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()) AND sender_type = 'taller');
CREATE POLICY "Talleres can view messages with their aseguradoras" ON public.mensajes FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their received messages" ON public.mensajes FOR UPDATE USING ((sender_type = 'taller' AND aseguradora_id IN (SELECT id FROM aseguradoras WHERE user_id = auth.uid())) OR (sender_type = 'aseguradora' AND taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: orden_proceso_historial
-- =====================================================
CREATE POLICY "Users can delete order history for their taller" ON public.orden_proceso_historial FOR DELETE USING (EXISTS (SELECT 1 FROM ordenes o JOIN user_roles ur ON o.taller_id = ur.taller_id WHERE o.id = orden_proceso_historial.orden_id AND ur.user_id = auth.uid()));
CREATE POLICY "Users can insert order history for their taller" ON public.orden_proceso_historial FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM ordenes o JOIN user_roles ur ON o.taller_id = ur.taller_id WHERE o.id = orden_proceso_historial.orden_id AND ur.user_id = auth.uid()));
CREATE POLICY "Users can update order history for their taller" ON public.orden_proceso_historial FOR UPDATE USING (EXISTS (SELECT 1 FROM ordenes o JOIN user_roles ur ON o.taller_id = ur.taller_id WHERE o.id = orden_proceso_historial.orden_id AND ur.user_id = auth.uid()));
CREATE POLICY "Users can view order history from their taller" ON public.orden_proceso_historial FOR SELECT USING (EXISTS (SELECT 1 FROM ordenes o JOIN user_roles ur ON o.taller_id = ur.taller_id WHERE o.id = orden_proceso_historial.orden_id AND ur.user_id = auth.uid()));

-- =====================================================
-- TABLE: ordenes
-- =====================================================
CREATE POLICY "Super admins can manage all ordenes" ON public.ordenes FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create ordenes for their taller" ON public.ordenes FOR INSERT WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's ordenes" ON public.ordenes FOR DELETE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's ordenes" ON public.ordenes FOR UPDATE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's ordenes" ON public.ordenes FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: paquete_servicio_items
-- =====================================================
CREATE POLICY "Super admins can manage all paquete items" ON public.paquete_servicio_items FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create paquete items" ON public.paquete_servicio_items FOR INSERT TO authenticated WITH CHECK (paquete_id IN (SELECT id FROM paquetes_servicios WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Taller employees can delete paquete items" ON public.paquete_servicio_items FOR DELETE TO authenticated USING (paquete_id IN (SELECT id FROM paquetes_servicios WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Taller employees can view their taller's paquete items" ON public.paquete_servicio_items FOR SELECT TO authenticated USING (paquete_id IN (SELECT id FROM paquetes_servicios WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: paquetes_servicios
-- =====================================================
CREATE POLICY "Super admins can manage all paquetes" ON public.paquetes_servicios FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create paquetes for their taller" ON public.paquetes_servicios FOR INSERT TO authenticated WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's paquetes" ON public.paquetes_servicios FOR DELETE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's paquetes" ON public.paquetes_servicios FOR UPDATE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's paquetes" ON public.paquetes_servicios FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: plantilla_fase_flujos
-- =====================================================
CREATE POLICY "Users can delete flows from their phase templates" ON public.plantilla_fase_flujos FOR DELETE USING (EXISTS (SELECT 1 FROM plantillas_fases pf WHERE pf.id = plantilla_fase_flujos.plantilla_fase_id AND pf.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert flows to their phase templates" ON public.plantilla_fase_flujos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM plantillas_fases pf WHERE pf.id = plantilla_fase_flujos.plantilla_fase_id AND pf.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Users can view flows of their phase templates" ON public.plantilla_fase_flujos FOR SELECT USING (EXISTS (SELECT 1 FROM plantillas_fases pf WHERE pf.id = plantilla_fase_flujos.plantilla_fase_id AND pf.taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: plantilla_fase_materiales
-- =====================================================
CREATE POLICY "Users can delete template materials" ON public.plantilla_fase_materiales FOR DELETE TO authenticated USING (true);
CREATE POLICY "Users can insert template materials" ON public.plantilla_fase_materiales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update template materials" ON public.plantilla_fase_materiales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can view template materials" ON public.plantilla_fase_materiales FOR SELECT TO authenticated USING (true);

-- =====================================================
-- TABLE: plantillas_fases
-- =====================================================
CREATE POLICY "Users can delete plantillas_fases" ON public.plantillas_fases FOR DELETE USING (true);
CREATE POLICY "Users can insert plantillas_fases" ON public.plantillas_fases FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update plantillas_fases" ON public.plantillas_fases FOR UPDATE USING (true);
CREATE POLICY "Users can view their taller plantillas_fases" ON public.plantillas_fases FOR SELECT USING (true);

-- =====================================================
-- TABLE: plantillas_flujos
-- =====================================================
CREATE POLICY "Users can delete plantillas_flujos" ON public.plantillas_flujos FOR DELETE USING (true);
CREATE POLICY "Users can insert plantillas_flujos" ON public.plantillas_flujos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update plantillas_flujos" ON public.plantillas_flujos FOR UPDATE USING (true);
CREATE POLICY "Users can view their taller plantillas_flujos" ON public.plantillas_flujos FOR SELECT USING (true);

-- =====================================================
-- TABLE: profiles
-- =====================================================
CREATE POLICY "Super admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- =====================================================
-- TABLE: servicios
-- =====================================================
CREATE POLICY "Super admins can manage all servicios" ON public.servicios FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can create servicios for their taller" ON public.servicios FOR INSERT TO authenticated WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can delete their taller's servicios" ON public.servicios FOR DELETE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can update their taller's servicios" ON public.servicios FOR UPDATE TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's servicios" ON public.servicios FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: siniestros
-- =====================================================
CREATE POLICY "Aseguradoras can view their talleres' siniestros" ON public.siniestros FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM taller_aseguradoras ta JOIN aseguradoras a ON a.id = ta.aseguradora_id WHERE ta.taller_id = siniestros.taller_id AND a.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all siniestros" ON public.siniestros FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their taller's siniestros" ON public.siniestros FOR ALL TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())) WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: solicitudes_afiliacion
-- =====================================================
CREATE POLICY "Aseguradoras can create solicitudes" ON public.solicitudes_afiliacion FOR INSERT WITH CHECK (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));
CREATE POLICY "Aseguradoras can delete pending solicitudes" ON public.solicitudes_afiliacion FOR DELETE USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()) AND estado = 'pendiente');
CREATE POLICY "Aseguradoras can update their solicitudes" ON public.solicitudes_afiliacion FOR UPDATE TO authenticated USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));
CREATE POLICY "Aseguradoras can view their solicitudes" ON public.solicitudes_afiliacion FOR SELECT TO authenticated USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));
CREATE POLICY "Super admins can manage all solicitudes" ON public.solicitudes_afiliacion FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Talleres can update their solicitudes" ON public.solicitudes_afiliacion FOR UPDATE USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Talleres can view their own solicitudes" ON public.solicitudes_afiliacion FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: taller_aseguradoras
-- =====================================================
CREATE POLICY "Aseguradoras can create affiliations when approving" ON public.taller_aseguradoras FOR INSERT TO authenticated WITH CHECK (aseguradora_id = get_aseguradora_id_for_user(auth.uid()) AND EXISTS (SELECT 1 FROM solicitudes_afiliacion sa WHERE sa.taller_id = taller_aseguradoras.taller_id AND sa.aseguradora_id = taller_aseguradoras.aseguradora_id AND sa.estado = 'pendiente'));
CREATE POLICY "Aseguradoras can view their talleres" ON public.taller_aseguradoras FOR SELECT TO authenticated USING (aseguradora_id = get_aseguradora_id_for_user(auth.uid()));
CREATE POLICY "Super admins can manage taller_aseguradoras" ON public.taller_aseguradoras FOR ALL USING (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Talleres can create affiliations when accepting" ON public.taller_aseguradoras FOR INSERT WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()) AND EXISTS (SELECT 1 FROM solicitudes_afiliacion sa WHERE sa.taller_id = taller_aseguradoras.taller_id AND sa.aseguradora_id = taller_aseguradoras.aseguradora_id AND sa.estado = 'pendiente'));
CREATE POLICY "Talleres can view their aseguradoras" ON public.taller_aseguradoras FOR SELECT USING (EXISTS (SELECT 1 FROM talleres t WHERE t.id = taller_aseguradoras.taller_id AND t.user_id = auth.uid()));

-- =====================================================
-- TABLE: taller_empleados
-- =====================================================
CREATE POLICY "Employees can view from same taller" ON public.taller_empleados FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Super admins can manage all employees" ON public.taller_empleados FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Users can view their own employee info" ON public.taller_empleados FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users with taller can manage employees" ON public.taller_empleados FOR ALL TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())) WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));

-- =====================================================
-- TABLE: talleres
-- =====================================================
CREATE POLICY "Admin taller can view own taller" ON public.talleres FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Aseguradoras can view approved talleres" ON public.talleres FOR SELECT USING (status = 'aprobado' AND has_role('aseguradora'::app_role, auth.uid()));
CREATE POLICY "Aseguradoras can view talleres with solicitudes" ON public.talleres FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM solicitudes_afiliacion sa WHERE sa.taller_id = talleres.id AND sa.aseguradora_id = get_aseguradora_id_for_user(auth.uid())));
CREATE POLICY "Flota users can view approved talleres" ON public.talleres FOR SELECT TO authenticated USING (status = 'aprobado' AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'flota'));
CREATE POLICY "Super admins can update talleres status" ON public.talleres FOR UPDATE TO authenticated USING (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Super admins can view all talleres" ON public.talleres FOR SELECT TO authenticated USING (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Users can update their own taller" ON public.talleres FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own taller" ON public.talleres FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: tarea_fases
-- =====================================================
CREATE POLICY "Super admins can manage all tarea_fases" ON public.tarea_fases FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their taller's tarea_fases" ON public.tarea_fases FOR ALL USING (tarea_id IN (SELECT id FROM catalogo_tareas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (tarea_id IN (SELECT id FROM catalogo_tareas WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: tecnico_horarios
-- =====================================================
CREATE POLICY "Super admins can manage all horarios" ON public.tecnico_horarios FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage horarios" ON public.tecnico_horarios FOR ALL USING (tecnico_id IN (SELECT id FROM tecnicos WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()))) WITH CHECK (tecnico_id IN (SELECT id FROM tecnicos WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));
CREATE POLICY "Taller employees can view horarios" ON public.tecnico_horarios FOR SELECT USING (tecnico_id IN (SELECT id FROM tecnicos WHERE taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())));

-- =====================================================
-- TABLE: tecnicos
-- =====================================================
CREATE POLICY "Super admins can manage all tecnicos" ON public.tecnicos FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their taller's tecnicos" ON public.tecnicos FOR ALL TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())) WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's tecnicos" ON public.tecnicos FOR SELECT TO authenticated USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Tecnicos can view their own info" ON public.tecnicos FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: tipos_operacion
-- =====================================================
CREATE POLICY "Admin taller puede gestionar tipos de operación" ON public.tipos_operacion FOR ALL USING (has_role('admin_taller'::app_role, auth.uid())) WITH CHECK (has_role('admin_taller'::app_role, auth.uid()));
CREATE POLICY "Super admins pueden gestionar tipos de operación" ON public.tipos_operacion FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Usuarios autenticados pueden ver tipos de operación" ON public.tipos_operacion FOR SELECT TO authenticated USING (true);

-- =====================================================
-- TABLE: user_roles
-- =====================================================
CREATE POLICY "Super admins can manage user roles" ON public.user_roles FOR ALL TO authenticated USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "view_own_role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: vehiculos
-- =====================================================
CREATE POLICY "Aseguradoras can view vehicles from affiliated talleres" ON public.vehiculos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM taller_aseguradoras ta JOIN aseguradoras a ON a.id = ta.aseguradora_id WHERE ta.taller_id = vehiculos.taller_id AND a.user_id = auth.uid()));
CREATE POLICY "Super admins can manage all vehicles" ON public.vehiculos FOR ALL USING (has_role('super_admin'::app_role, auth.uid())) WITH CHECK (has_role('super_admin'::app_role, auth.uid()));
CREATE POLICY "Taller employees can manage their taller's vehicles" ON public.vehiculos FOR ALL USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid())) WITH CHECK (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
CREATE POLICY "Taller employees can view their taller's vehicles" ON public.vehiculos FOR SELECT USING (taller_id IN (SELECT taller_id FROM user_roles WHERE user_id = auth.uid()));
