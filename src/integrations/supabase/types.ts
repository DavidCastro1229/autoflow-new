export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aseguradoras: {
        Row: {
          apellido_contacto: string
          ciudad: string
          codigo_postal: string
          created_at: string
          descripcion: string | null
          direccion: string
          email: string
          estado: string
          id: string
          nombre_aseguradora: string
          nombre_contacto: string
          rfc: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido_contacto: string
          ciudad: string
          codigo_postal: string
          created_at?: string
          descripcion?: string | null
          direccion: string
          email: string
          estado: string
          id?: string
          nombre_aseguradora: string
          nombre_contacto: string
          rfc: string
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido_contacto?: string
          ciudad?: string
          codigo_postal?: string
          created_at?: string
          descripcion?: string | null
          direccion?: string
          email?: string
          estado?: string
          id?: string
          nombre_aseguradora?: string
          nombre_contacto?: string
          rfc?: string
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cargos_administrativos: {
        Row: {
          activo: boolean
          color: string
          created_at: string
          emoji: string
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalogo_tareas: {
        Row: {
          categorias: string[]
          codigo_tarea: string
          condiciones_aplicacion: string[]
          created_at: string
          descripcion: string | null
          forma_pago: Database["public"]["Enums"]["forma_pago_tarea"] | null
          id: string
          medidas_seguridad: string | null
          nombre: string
          notas_internas: string | null
          numero_orden: number
          objetivo: string | null
          roles_preferentes: number[] | null
          taller_id: string
          tiempo_estimado: number | null
          tipo_tarea: string[]
          unidad_tiempo:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at: string
        }
        Insert: {
          categorias?: string[]
          codigo_tarea: string
          condiciones_aplicacion?: string[]
          created_at?: string
          descripcion?: string | null
          forma_pago?: Database["public"]["Enums"]["forma_pago_tarea"] | null
          id?: string
          medidas_seguridad?: string | null
          nombre: string
          notas_internas?: string | null
          numero_orden: number
          objetivo?: string | null
          roles_preferentes?: number[] | null
          taller_id: string
          tiempo_estimado?: number | null
          tipo_tarea?: string[]
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Update: {
          categorias?: string[]
          codigo_tarea?: string
          condiciones_aplicacion?: string[]
          created_at?: string
          descripcion?: string | null
          forma_pago?: Database["public"]["Enums"]["forma_pago_tarea"] | null
          id?: string
          medidas_seguridad?: string | null
          nombre?: string
          notas_internas?: string | null
          numero_orden?: number
          objetivo?: string | null
          roles_preferentes?: number[] | null
          taller_id?: string
          tiempo_estimado?: number | null
          tipo_tarea?: string[]
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_tareas_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_servicio: {
        Row: {
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      citas: {
        Row: {
          cliente_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_cita"]
          fecha: string
          hora_fin: string
          hora_inicio: string
          id: string
          nota: string | null
          servicio_id: string
          taller_id: string
          tecnico_id: string
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cita"]
          fecha: string
          hora_fin: string
          hora_inicio: string
          id?: string
          nota?: string | null
          servicio_id: string
          taller_id: string
          tecnico_id: string
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cita"]
          fecha?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          nota?: string | null
          servicio_id?: string
          taller_id?: string
          tecnico_id?: string
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "categorias_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          apellido: string
          created_at: string
          email: string
          id: string
          nombre: string
          nombre_empresa: string | null
          taller_id: string
          telefono: string
          tipo_cliente: Database["public"]["Enums"]["tipo_cliente"]
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido: string
          created_at?: string
          email: string
          id?: string
          nombre: string
          nombre_empresa?: string | null
          taller_id: string
          telefono: string
          tipo_cliente: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido?: string
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          nombre_empresa?: string | null
          taller_id?: string
          telefono?: string
          tipo_cliente?: Database["public"]["Enums"]["tipo_cliente"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizacion_partes: {
        Row: {
          cantidad: number
          categoria_id: string
          cotizacion_id: string
          created_at: string
          descripcion: string
          dias: number
          horas: number
          id: string
          mano_obra: number
          materiales: number
          operacion: Database["public"]["Enums"]["operacion_parte"]
          repuestos: number
          subtotal: number
          tipo_material: string
          tipo_reparacion: string
          updated_at: string
        }
        Insert: {
          cantidad?: number
          categoria_id: string
          cotizacion_id: string
          created_at?: string
          descripcion: string
          dias?: number
          horas?: number
          id?: string
          mano_obra?: number
          materiales?: number
          operacion: Database["public"]["Enums"]["operacion_parte"]
          repuestos?: number
          subtotal?: number
          tipo_material: string
          tipo_reparacion: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          categoria_id?: string
          cotizacion_id?: string
          created_at?: string
          descripcion?: string
          dias?: number
          horas?: number
          id?: string
          mano_obra?: number
          materiales?: number
          operacion?: Database["public"]["Enums"]["operacion_parte"]
          repuestos?: number
          subtotal?: number
          tipo_material?: string
          tipo_reparacion?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_partes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_partes_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          cliente_id: string
          codigo_cotizacion: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_cotizacion"]
          fecha: string
          id: string
          observaciones: string | null
          taller_id: string
          total: number
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          cliente_id: string
          codigo_cotizacion: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cotizacion"]
          fecha?: string
          id?: string
          observaciones?: string | null
          taller_id: string
          total?: number
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          cliente_id?: string
          codigo_cotizacion?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cotizacion"]
          fecha?: string
          id?: string
          observaciones?: string | null
          taller_id?: string
          total?: number
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipo: {
        Row: {
          apellido: string
          cargo: string | null
          cargo_id: string
          created_at: string | null
          direccion: string
          documento_identidad: string | null
          email: string
          estado: string
          fecha_contratacion: string
          fecha_nacimiento: string | null
          frecuencia_pago: string
          genero: string | null
          id: string
          nombre: string
          notas: string | null
          salario: number
          taller_id: string
          telefono: string
          updated_at: string | null
        }
        Insert: {
          apellido: string
          cargo?: string | null
          cargo_id: string
          created_at?: string | null
          direccion: string
          documento_identidad?: string | null
          email: string
          estado?: string
          fecha_contratacion?: string
          fecha_nacimiento?: string | null
          frecuencia_pago?: string
          genero?: string | null
          id?: string
          nombre: string
          notas?: string | null
          salario?: number
          taller_id: string
          telefono: string
          updated_at?: string | null
        }
        Update: {
          apellido?: string
          cargo?: string | null
          cargo_id?: string
          created_at?: string | null
          direccion?: string
          documento_identidad?: string | null
          email?: string
          estado?: string
          fecha_contratacion?: string
          fecha_nacimiento?: string | null
          frecuencia_pago?: string
          genero?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          salario?: number
          taller_id?: string
          telefono?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipo_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos_administrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidades_taller: {
        Row: {
          created_at: string
          id: number
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      facturas: {
        Row: {
          cliente_id: string
          created_at: string
          descuento: number | null
          estado: Database["public"]["Enums"]["estado_factura"]
          fecha_emision: string
          fecha_pago: string | null
          fecha_vencimiento: string | null
          id: string
          impuestos: number
          metodo_pago: Database["public"]["Enums"]["metodo_pago"] | null
          monto_pagado: number | null
          nombre_factura: string
          nota_pago: string | null
          notas: string | null
          numero_factura: string
          orden_id: string | null
          referencia_pago: string | null
          subtotal: number
          taller_id: string
          tipo_tarjeta: string | null
          total: number
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descuento?: number | null
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string | null
          id?: string
          impuestos?: number
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"] | null
          monto_pagado?: number | null
          nombre_factura: string
          nota_pago?: string | null
          notas?: string | null
          numero_factura: string
          orden_id?: string | null
          referencia_pago?: string | null
          subtotal?: number
          taller_id: string
          tipo_tarjeta?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descuento?: number | null
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_pago?: string | null
          fecha_vencimiento?: string | null
          id?: string
          impuestos?: number
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"] | null
          monto_pagado?: number | null
          nombre_factura?: string
          nota_pago?: string | null
          notas?: string | null
          numero_factura?: string
          orden_id?: string | null
          referencia_pago?: string | null
          subtotal?: number
          taller_id?: string
          tipo_tarjeta?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      fase_flujos: {
        Row: {
          color: string
          completado: boolean | null
          created_at: string
          fase_id: string
          id: string
          numero_orden: number
          tiempo_estimado: number | null
          titulo: string
          unidad_tiempo:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at: string
        }
        Insert: {
          color?: string
          completado?: boolean | null
          created_at?: string
          fase_id: string
          id?: string
          numero_orden: number
          tiempo_estimado?: number | null
          titulo: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Update: {
          color?: string
          completado?: boolean | null
          created_at?: string
          fase_id?: string
          id?: string
          numero_orden?: number
          tiempo_estimado?: number | null
          titulo?: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fase_flujos_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "tarea_fases"
            referencedColumns: ["id"]
          },
        ]
      }
      fase_materiales: {
        Row: {
          cantidad: number
          created_at: string
          fase_id: string
          id: string
          inventario_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          fase_id: string
          id?: string
          inventario_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          fase_id?: string
          id?: string
          inventario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fase_materiales_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "tarea_fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fase_materiales_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_comunicacion_externa: {
        Row: {
          celular: string | null
          correo: string
          created_at: string
          departamento_id: string
          id: string
          nombre: string
          telefono_fijo: string | null
          tipo: Database["public"]["Enums"]["tipo_comunicacion_externa"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          celular?: string | null
          correo: string
          created_at?: string
          departamento_id: string
          id?: string
          nombre: string
          telefono_fijo?: string | null
          tipo: Database["public"]["Enums"]["tipo_comunicacion_externa"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          celular?: string | null
          correo?: string
          created_at?: string
          departamento_id?: string
          id?: string
          nombre?: string
          telefono_fijo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_comunicacion_externa"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flota_comunicacion_externa_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "flota_departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_comunicacion_interna: {
        Row: {
          celular: string | null
          correo: string
          created_at: string
          departamento_id: string
          id: string
          nombre: string
          telefono_fijo: string | null
          tipo: Database["public"]["Enums"]["tipo_comunicacion_interna"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          celular?: string | null
          correo: string
          created_at?: string
          departamento_id: string
          id?: string
          nombre: string
          telefono_fijo?: string | null
          tipo: Database["public"]["Enums"]["tipo_comunicacion_interna"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          celular?: string | null
          correo?: string
          created_at?: string
          departamento_id?: string
          id?: string
          nombre?: string
          telefono_fijo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_comunicacion_interna"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flota_comunicacion_interna_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "flota_departamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_conductores: {
        Row: {
          apellido: string
          calificacion_desempeno: number | null
          cedula_identidad: string
          contacto_emergencia_nombre: string | null
          contacto_emergencia_telefono: string | null
          correo: string | null
          created_at: string
          direccion: string
          estado_civil: string | null
          fecha_emision_licencia: string
          fecha_ingreso: string
          fecha_nacimiento: string
          fecha_vencimiento_licencia: string
          flota_id: string
          historial_asignaciones: string | null
          id: string
          limite_diario_viaticos: number | null
          nombre: string
          notas_viaticos: string | null
          numero_licencia: string
          observaciones_desempeno: string | null
          restricciones_licencia: string | null
          telefono: string
          tipo_licencia: string
          updated_at: string
          vehiculo_asignado_actual: string | null
          viaticos_autorizados: number | null
        }
        Insert: {
          apellido: string
          calificacion_desempeno?: number | null
          cedula_identidad: string
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          correo?: string | null
          created_at?: string
          direccion: string
          estado_civil?: string | null
          fecha_emision_licencia: string
          fecha_ingreso: string
          fecha_nacimiento: string
          fecha_vencimiento_licencia: string
          flota_id: string
          historial_asignaciones?: string | null
          id?: string
          limite_diario_viaticos?: number | null
          nombre: string
          notas_viaticos?: string | null
          numero_licencia: string
          observaciones_desempeno?: string | null
          restricciones_licencia?: string | null
          telefono: string
          tipo_licencia: string
          updated_at?: string
          vehiculo_asignado_actual?: string | null
          viaticos_autorizados?: number | null
        }
        Update: {
          apellido?: string
          calificacion_desempeno?: number | null
          cedula_identidad?: string
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_telefono?: string | null
          correo?: string | null
          created_at?: string
          direccion?: string
          estado_civil?: string | null
          fecha_emision_licencia?: string
          fecha_ingreso?: string
          fecha_nacimiento?: string
          fecha_vencimiento_licencia?: string
          flota_id?: string
          historial_asignaciones?: string | null
          id?: string
          limite_diario_viaticos?: number | null
          nombre?: string
          notas_viaticos?: string | null
          numero_licencia?: string
          observaciones_desempeno?: string | null
          restricciones_licencia?: string | null
          telefono?: string
          tipo_licencia?: string
          updated_at?: string
          vehiculo_asignado_actual?: string | null
          viaticos_autorizados?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flota_conductores_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_datos_bancarios: {
        Row: {
          created_at: string
          cuenta_bancaria: string
          entidad_bancaria: string
          flota_id: string
          id: string
          moneda: string
          tipo_cuenta: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuenta_bancaria: string
          entidad_bancaria: string
          flota_id: string
          id?: string
          moneda: string
          tipo_cuenta: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuenta_bancaria?: string
          entidad_bancaria?: string
          flota_id?: string
          id?: string
          moneda?: string
          tipo_cuenta?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_datos_bancarios_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_datos_negociacion: {
        Row: {
          created_at: string
          credito_autorizado_por: string | null
          descuento_pronto_pago: number | null
          dias_credito_autorizado: number | null
          duracion_contrato: string
          fecha_inicio: string
          flota_id: string
          id: string
          porcentaje_cobro_mora: number | null
          tarifa_descuento: number | null
          tarifa_precios: number | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credito_autorizado_por?: string | null
          descuento_pronto_pago?: number | null
          dias_credito_autorizado?: number | null
          duracion_contrato: string
          fecha_inicio: string
          flota_id: string
          id?: string
          porcentaje_cobro_mora?: number | null
          tarifa_descuento?: number | null
          tarifa_precios?: number | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credito_autorizado_por?: string | null
          descuento_pronto_pago?: number | null
          dias_credito_autorizado?: number | null
          duracion_contrato?: string
          fecha_inicio?: string
          flota_id?: string
          id?: string
          porcentaje_cobro_mora?: number | null
          tarifa_descuento?: number | null
          tarifa_precios?: number | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_datos_negociacion_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_departamentos: {
        Row: {
          created_at: string
          flota_id: string
          id: string
          nombre_departamento: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flota_id: string
          id?: string
          nombre_departamento: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flota_id?: string
          id?: string
          nombre_departamento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_departamentos_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_jefe: {
        Row: {
          cargo_posicion: string
          correo: string
          created_at: string
          flota_id: string
          horarios_trabajo: string
          id: string
          nombre: string
          telefono: string
          updated_at: string
        }
        Insert: {
          cargo_posicion: string
          correo: string
          created_at?: string
          flota_id: string
          horarios_trabajo: string
          id?: string
          nombre: string
          telefono: string
          updated_at?: string
        }
        Update: {
          cargo_posicion?: string
          correo?: string
          created_at?: string
          flota_id?: string
          horarios_trabajo?: string
          id?: string
          nombre?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_jefe_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: true
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_propietarios: {
        Row: {
          cantidad_vehiculos: number
          correo: string
          created_at: string
          flota_id: string
          id: string
          nombre_propietario: string
          razon_social: string
          rtn: string
          telefono: string
          updated_at: string
        }
        Insert: {
          cantidad_vehiculos?: number
          correo: string
          created_at?: string
          flota_id: string
          id?: string
          nombre_propietario: string
          razon_social: string
          rtn: string
          telefono: string
          updated_at?: string
        }
        Update: {
          cantidad_vehiculos?: number
          correo?: string
          created_at?: string
          flota_id?: string
          id?: string
          nombre_propietario?: string
          razon_social?: string
          rtn?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_propietarios_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_tarifas_servicio: {
        Row: {
          categoria_servicio_id: string
          created_at: string
          flota_id: string
          id: string
          tarifa: number
          updated_at: string
        }
        Insert: {
          categoria_servicio_id: string
          created_at?: string
          flota_id: string
          id?: string
          tarifa?: number
          updated_at?: string
        }
        Update: {
          categoria_servicio_id?: string
          created_at?: string
          flota_id?: string
          id?: string
          tarifa?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_tarifas_servicio_categoria_servicio_id_fkey"
            columns: ["categoria_servicio_id"]
            isOneToOne: false
            referencedRelation: "categorias_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flota_tarifas_servicio_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_terminos_politicas: {
        Row: {
          created_at: string
          flota_id: string
          id: string
          politicas_combustible: string[] | null
          politicas_condiciones_uso: string[] | null
          politicas_renovacion: string[] | null
          politicas_uso_vehiculos: string[] | null
          seguros_covertura: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          flota_id: string
          id?: string
          politicas_combustible?: string[] | null
          politicas_condiciones_uso?: string[] | null
          politicas_renovacion?: string[] | null
          politicas_uso_vehiculos?: string[] | null
          seguros_covertura?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          flota_id?: string
          id?: string
          politicas_combustible?: string[] | null
          politicas_condiciones_uso?: string[] | null
          politicas_renovacion?: string[] | null
          politicas_uso_vehiculos?: string[] | null
          seguros_covertura?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_terminos_politicas_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flota_vehiculos: {
        Row: {
          anio_fabricacion: number
          conductores_asignados: string | null
          created_at: string
          estado_vehiculo: string
          fecha_autorizacion_circulacion: string | null
          fecha_autorizacion_especiales: string | null
          fecha_autorizacion_explotacion: string | null
          fecha_autorizacion_publicidad: string | null
          fecha_ultimo_mantenimiento: string | null
          fecha_vencimiento_circulacion: string | null
          fecha_vencimiento_especiales: string | null
          fecha_vencimiento_explotacion: string | null
          fecha_vencimiento_publicidad: string | null
          flota_id: string
          historial_reparaciones: string | null
          id: string
          kilometraje_actual: number
          marca_modelo: string
          numero_placa: string
          numero_unidad: string
          numero_vin: string
          permiso_circulacion: string | null
          permiso_explotacion_unidad: string | null
          permiso_publicidad: string | null
          permisos_especiales: string | null
          proximo_mantenimiento_programado: string | null
          updated_at: string
        }
        Insert: {
          anio_fabricacion: number
          conductores_asignados?: string | null
          created_at?: string
          estado_vehiculo: string
          fecha_autorizacion_circulacion?: string | null
          fecha_autorizacion_especiales?: string | null
          fecha_autorizacion_explotacion?: string | null
          fecha_autorizacion_publicidad?: string | null
          fecha_ultimo_mantenimiento?: string | null
          fecha_vencimiento_circulacion?: string | null
          fecha_vencimiento_especiales?: string | null
          fecha_vencimiento_explotacion?: string | null
          fecha_vencimiento_publicidad?: string | null
          flota_id: string
          historial_reparaciones?: string | null
          id?: string
          kilometraje_actual?: number
          marca_modelo: string
          numero_placa: string
          numero_unidad: string
          numero_vin: string
          permiso_circulacion?: string | null
          permiso_explotacion_unidad?: string | null
          permiso_publicidad?: string | null
          permisos_especiales?: string | null
          proximo_mantenimiento_programado?: string | null
          updated_at?: string
        }
        Update: {
          anio_fabricacion?: number
          conductores_asignados?: string | null
          created_at?: string
          estado_vehiculo?: string
          fecha_autorizacion_circulacion?: string | null
          fecha_autorizacion_especiales?: string | null
          fecha_autorizacion_explotacion?: string | null
          fecha_autorizacion_publicidad?: string | null
          fecha_ultimo_mantenimiento?: string | null
          fecha_vencimiento_circulacion?: string | null
          fecha_vencimiento_especiales?: string | null
          fecha_vencimiento_explotacion?: string | null
          fecha_vencimiento_publicidad?: string | null
          flota_id?: string
          historial_reparaciones?: string | null
          id?: string
          kilometraje_actual?: number
          marca_modelo?: string
          numero_placa?: string
          numero_unidad?: string
          numero_vin?: string
          permiso_circulacion?: string | null
          permiso_explotacion_unidad?: string | null
          permiso_publicidad?: string | null
          permisos_especiales?: string | null
          proximo_mantenimiento_programado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flota_vehiculos_flota_id_fkey"
            columns: ["flota_id"]
            isOneToOne: false
            referencedRelation: "flotas"
            referencedColumns: ["id"]
          },
        ]
      }
      flotas: {
        Row: {
          cantidad_vehiculos: number
          categoria_vehiculos: string[] | null
          correo_contacto: string
          created_at: string
          direccion_escrita: string | null
          direccion_fisica: string
          direccion_google_maps: string | null
          direccion_google_maps_parqueo: string | null
          direccion_parqueo: string | null
          estado: Database["public"]["Enums"]["estado_flota"]
          fecha_registro: string
          horarios_atencion: string | null
          id: string
          logo_url: string | null
          nombre_flota: string
          numero_flota: string
          numero_rtn: string
          razon_social: string
          rubro_empresa: string
          sitio_web: string | null
          taller_id: string
          telefono_contacto: string
          tipo_flota: Database["public"]["Enums"]["tipo_flota"]
          updated_at: string
        }
        Insert: {
          cantidad_vehiculos?: number
          categoria_vehiculos?: string[] | null
          correo_contacto: string
          created_at?: string
          direccion_escrita?: string | null
          direccion_fisica: string
          direccion_google_maps?: string | null
          direccion_google_maps_parqueo?: string | null
          direccion_parqueo?: string | null
          estado?: Database["public"]["Enums"]["estado_flota"]
          fecha_registro?: string
          horarios_atencion?: string | null
          id?: string
          logo_url?: string | null
          nombre_flota: string
          numero_flota: string
          numero_rtn: string
          razon_social: string
          rubro_empresa: string
          sitio_web?: string | null
          taller_id: string
          telefono_contacto: string
          tipo_flota: Database["public"]["Enums"]["tipo_flota"]
          updated_at?: string
        }
        Update: {
          cantidad_vehiculos?: number
          categoria_vehiculos?: string[] | null
          correo_contacto?: string
          created_at?: string
          direccion_escrita?: string | null
          direccion_fisica?: string
          direccion_google_maps?: string | null
          direccion_google_maps_parqueo?: string | null
          direccion_parqueo?: string | null
          estado?: Database["public"]["Enums"]["estado_flota"]
          fecha_registro?: string
          horarios_atencion?: string | null
          id?: string
          logo_url?: string | null
          nombre_flota?: string
          numero_flota?: string
          numero_rtn?: string
          razon_social?: string
          rubro_empresa?: string
          sitio_web?: string | null
          taller_id?: string
          telefono_contacto?: string
          tipo_flota?: Database["public"]["Enums"]["tipo_flota"]
          updated_at?: string
        }
        Relationships: []
      }
      hojas_ingreso: {
        Row: {
          comentarios: string | null
          coqueta: Json
          created_at: string
          exteriores: Json
          firma_cliente: string | null
          firma_encargado: string | null
          id: string
          imagenes_carroceria: string[] | null
          interiores: Json
          motor: Json
          nivel_gasolina: string
          taller_id: string
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          comentarios?: string | null
          coqueta?: Json
          created_at?: string
          exteriores?: Json
          firma_cliente?: string | null
          firma_encargado?: string | null
          id?: string
          imagenes_carroceria?: string[] | null
          interiores?: Json
          motor?: Json
          nivel_gasolina?: string
          taller_id: string
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          comentarios?: string | null
          coqueta?: Json
          created_at?: string
          exteriores?: Json
          firma_cliente?: string | null
          firma_encargado?: string | null
          id?: string
          imagenes_carroceria?: string[] | null
          interiores?: Json
          motor?: Json
          nivel_gasolina?: string
          taller_id?: string
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hojas_ingreso_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hojas_ingreso_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          categoria_id: string | null
          codigo: string
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_inventario"]
          fecha_ingreso: string
          id: string
          nombre: string
          precio_compra: number
          precio_venta: number
          proveedor: string | null
          stock_actual: number
          stock_minimo: number
          taller_id: string
          ubicacion_almacen: string | null
          updated_at: string
        }
        Insert: {
          categoria_id?: string | null
          codigo: string
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_inventario"]
          fecha_ingreso?: string
          id?: string
          nombre: string
          precio_compra?: number
          precio_venta?: number
          proveedor?: string | null
          stock_actual?: number
          stock_minimo?: number
          taller_id: string
          ubicacion_almacen?: string | null
          updated_at?: string
        }
        Update: {
          categoria_id?: string | null
          codigo?: string
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_inventario"]
          fecha_ingreso?: string
          id?: string
          nombre?: string
          precio_compra?: number
          precio_venta?: number
          proveedor?: string | null
          stock_actual?: number
          stock_minimo?: number
          taller_id?: string
          ubicacion_almacen?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          aseguradora_id: string
          contenido: string
          created_at: string
          id: string
          leido: boolean
          sender_type: string
          taller_id: string
          updated_at: string
        }
        Insert: {
          aseguradora_id: string
          contenido: string
          created_at?: string
          id?: string
          leido?: boolean
          sender_type: string
          taller_id: string
          updated_at?: string
        }
        Update: {
          aseguradora_id?: string
          contenido?: string
          created_at?: string
          id?: string
          leido?: boolean
          sender_type?: string
          taller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_proceso_historial: {
        Row: {
          created_at: string
          fase_id: string
          fecha_entrada: string
          fecha_salida: string | null
          flujo_id: string | null
          id: string
          notas: string | null
          orden_id: string
        }
        Insert: {
          created_at?: string
          fase_id: string
          fecha_entrada?: string
          fecha_salida?: string | null
          flujo_id?: string | null
          id?: string
          notas?: string | null
          orden_id: string
        }
        Update: {
          created_at?: string
          fase_id?: string
          fecha_entrada?: string
          fecha_salida?: string | null
          flujo_id?: string | null
          id?: string
          notas?: string | null
          orden_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_proceso_historial_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "tarea_fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_proceso_historial_flujo_id_fkey"
            columns: ["flujo_id"]
            isOneToOne: false
            referencedRelation: "fase_flujos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_proceso_historial_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes: {
        Row: {
          cliente_id: string
          costo_estimado: number | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_orden"]
          fase_actual_id: string | null
          fecha_entrega: string | null
          fecha_ingreso: string
          flujo_actual_id: string | null
          id: string
          observaciones: string | null
          prioridad: Database["public"]["Enums"]["prioridad_orden"]
          taller_id: string
          tarea_id: string | null
          tecnico_id: string
          tipo_servicio_id: string
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          cliente_id: string
          costo_estimado?: number | null
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          fase_actual_id?: string | null
          fecha_entrega?: string | null
          fecha_ingreso?: string
          flujo_actual_id?: string | null
          id?: string
          observaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_orden"]
          taller_id: string
          tarea_id?: string | null
          tecnico_id: string
          tipo_servicio_id: string
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          cliente_id?: string
          costo_estimado?: number | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_orden"]
          fase_actual_id?: string | null
          fecha_entrega?: string | null
          fecha_ingreso?: string
          flujo_actual_id?: string | null
          id?: string
          observaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_orden"]
          taller_id?: string
          tarea_id?: string | null
          tecnico_id?: string
          tipo_servicio_id?: string
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_fase_actual_id_fkey"
            columns: ["fase_actual_id"]
            isOneToOne: false
            referencedRelation: "tarea_fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_flujo_actual_id_fkey"
            columns: ["flujo_actual_id"]
            isOneToOne: false
            referencedRelation: "fase_flujos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "catalogo_tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_tipo_servicio_id_fkey"
            columns: ["tipo_servicio_id"]
            isOneToOne: false
            referencedRelation: "tipos_operacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      paquete_servicio_items: {
        Row: {
          created_at: string
          id: string
          paquete_id: string
          servicio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          paquete_id: string
          servicio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          paquete_id?: string
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paquete_servicio_items_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes_servicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paquete_servicio_items_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      paquetes_servicios: {
        Row: {
          created_at: string
          descripcion: string | null
          descuento: number | null
          estado: boolean
          id: string
          nombre: string
          precio_total: number
          taller_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          descuento?: number | null
          estado?: boolean
          id?: string
          nombre: string
          precio_total?: number
          taller_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          descuento?: number | null
          estado?: boolean
          id?: string
          nombre?: string
          precio_total?: number
          taller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      plantilla_fase_flujos: {
        Row: {
          color: string
          created_at: string
          id: string
          numero_orden: number
          plantilla_fase_id: string
          tiempo_estimado: number | null
          titulo: string
          unidad_tiempo:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          numero_orden?: number
          plantilla_fase_id: string
          tiempo_estimado?: number | null
          titulo: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          numero_orden?: number
          plantilla_fase_id?: string
          tiempo_estimado?: number | null
          titulo?: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "plantilla_fase_flujos_plantilla_fase_id_fkey"
            columns: ["plantilla_fase_id"]
            isOneToOne: false
            referencedRelation: "plantillas_fases"
            referencedColumns: ["id"]
          },
        ]
      }
      plantilla_fase_materiales: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          inventario_id: string
          plantilla_fase_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          inventario_id: string
          plantilla_fase_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          inventario_id?: string
          plantilla_fase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plantilla_fase_materiales_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plantilla_fase_materiales_plantilla_fase_id_fkey"
            columns: ["plantilla_fase_id"]
            isOneToOne: false
            referencedRelation: "plantillas_fases"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_fases: {
        Row: {
          color: string
          created_at: string
          id: string
          mensaje_notificacion: string | null
          notificar: boolean | null
          taller_id: string
          tiempo_estimado: number | null
          titulo: string
          unidad_tiempo:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          mensaje_notificacion?: string | null
          notificar?: boolean | null
          taller_id: string
          tiempo_estimado?: number | null
          titulo: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          mensaje_notificacion?: string | null
          notificar?: boolean | null
          taller_id?: string
          tiempo_estimado?: number | null
          titulo?: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      plantillas_flujos: {
        Row: {
          color: string
          created_at: string
          id: string
          taller_id: string
          tiempo_estimado: number | null
          titulo: string
          unidad_tiempo:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          taller_id: string
          tiempo_estimado?: number | null
          titulo: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          taller_id?: string
          tiempo_estimado?: number | null
          titulo?: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido_contacto: string
          ciudad: string
          codigo_postal: string
          created_at: string
          descripcion: string | null
          direccion: string
          email: string
          estado: string
          id: string
          nombre_aseguradora: string | null
          nombre_contacto: string
          nombre_taller: string
          rfc: string | null
          telefono: string
          updated_at: string
        }
        Insert: {
          apellido_contacto: string
          ciudad: string
          codigo_postal: string
          created_at?: string
          descripcion?: string | null
          direccion: string
          email: string
          estado: string
          id: string
          nombre_aseguradora?: string | null
          nombre_contacto: string
          nombre_taller: string
          rfc?: string | null
          telefono: string
          updated_at?: string
        }
        Update: {
          apellido_contacto?: string
          ciudad?: string
          codigo_postal?: string
          created_at?: string
          descripcion?: string | null
          direccion?: string
          email?: string
          estado?: string
          id?: string
          nombre_aseguradora?: string | null
          nombre_contacto?: string
          nombre_taller?: string
          rfc?: string | null
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      servicios: {
        Row: {
          categoria_id: string
          created_at: string
          descripcion: string | null
          estado: boolean
          id: string
          materiales_requeridos: string[] | null
          nombre: string
          precio: number
          taller_id: string
          tiempo_estimado: Json
          updated_at: string
        }
        Insert: {
          categoria_id: string
          created_at?: string
          descripcion?: string | null
          estado?: boolean
          id?: string
          materiales_requeridos?: string[] | null
          nombre: string
          precio?: number
          taller_id: string
          tiempo_estimado?: Json
          updated_at?: string
        }
        Update: {
          categoria_id?: string
          created_at?: string
          descripcion?: string | null
          estado?: boolean
          id?: string
          materiales_requeridos?: string[] | null
          nombre?: string
          precio?: number
          taller_id?: string
          tiempo_estimado?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      siniestros: {
        Row: {
          created_at: string
          descripcion: string
          estado: string
          fecha_siniestro: string
          id: string
          monto_estimado: number
          numero_siniestro: string
          taller_id: string
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: string
          fecha_siniestro: string
          id?: string
          monto_estimado?: number
          numero_siniestro: string
          taller_id: string
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_siniestro?: string
          id?: string
          monto_estimado?: number
          numero_siniestro?: string
          taller_id?: string
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "siniestros_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siniestros_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_afiliacion: {
        Row: {
          aseguradora_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_solicitud_afiliacion"]
          fecha_respuesta: string | null
          fecha_solicitud: string
          id: string
          mensaje: string | null
          respuesta: string | null
          taller_id: string
          updated_at: string
        }
        Insert: {
          aseguradora_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_solicitud_afiliacion"]
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          id?: string
          mensaje?: string | null
          respuesta?: string | null
          taller_id: string
          updated_at?: string
        }
        Update: {
          aseguradora_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_solicitud_afiliacion"]
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          id?: string
          mensaje?: string | null
          respuesta?: string | null
          taller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_afiliacion_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_afiliacion_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      taller_aseguradoras: {
        Row: {
          aseguradora_id: string
          created_at: string
          id: string
          taller_id: string
        }
        Insert: {
          aseguradora_id: string
          created_at?: string
          id?: string
          taller_id: string
        }
        Update: {
          aseguradora_id?: string
          created_at?: string
          id?: string
          taller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taller_aseguradoras_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taller_aseguradoras_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      taller_empleados: {
        Row: {
          apellidos: string
          created_at: string
          email: string | null
          id: string
          nombre: string
          taller_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apellidos: string
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          taller_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apellidos?: string
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          taller_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taller_empleados_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      talleres: {
        Row: {
          apellido_contacto: string
          ciudad: string
          codigo_postal: string
          created_at: string
          descripcion: string | null
          direccion: string
          email: string
          estado: string
          estado_suscripcion:
            | Database["public"]["Enums"]["estado_suscripcion"]
            | null
          fecha_fin_prueba: string | null
          fecha_inicio_prueba: string | null
          id: string
          logo_url: string | null
          nombre_contacto: string
          nombre_taller: string
          status: Database["public"]["Enums"]["taller_status"]
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido_contacto: string
          ciudad: string
          codigo_postal: string
          created_at?: string
          descripcion?: string | null
          direccion: string
          email: string
          estado: string
          estado_suscripcion?:
            | Database["public"]["Enums"]["estado_suscripcion"]
            | null
          fecha_fin_prueba?: string | null
          fecha_inicio_prueba?: string | null
          id?: string
          logo_url?: string | null
          nombre_contacto: string
          nombre_taller: string
          status?: Database["public"]["Enums"]["taller_status"]
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido_contacto?: string
          ciudad?: string
          codigo_postal?: string
          created_at?: string
          descripcion?: string | null
          direccion?: string
          email?: string
          estado?: string
          estado_suscripcion?:
            | Database["public"]["Enums"]["estado_suscripcion"]
            | null
          fecha_fin_prueba?: string | null
          fecha_inicio_prueba?: string | null
          id?: string
          logo_url?: string | null
          nombre_contacto?: string
          nombre_taller?: string
          status?: Database["public"]["Enums"]["taller_status"]
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tarea_fases: {
        Row: {
          color: string
          created_at: string
          equipo_id: string | null
          id: string
          mensaje_notificacion: string | null
          notificar: boolean | null
          numero_orden: number
          tarea_id: string
          tecnico_id: string | null
          tiempo_estimado: number | null
          titulo: string
          unidad_tiempo:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          equipo_id?: string | null
          id?: string
          mensaje_notificacion?: string | null
          notificar?: boolean | null
          numero_orden: number
          tarea_id: string
          tecnico_id?: string | null
          tiempo_estimado?: number | null
          titulo: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          equipo_id?: string | null
          id?: string
          mensaje_notificacion?: string | null
          notificar?: boolean | null
          numero_orden?: number
          tarea_id?: string
          tecnico_id?: string | null
          tiempo_estimado?: number | null
          titulo?: string
          unidad_tiempo?:
            | Database["public"]["Enums"]["unidad_tiempo_tarea"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarea_fases_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarea_fases_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "catalogo_tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarea_fases_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      tecnico_horarios: {
        Row: {
          activo: boolean
          created_at: string
          dia_semana: string
          hora_fin: string
          hora_inicio: string
          id: string
          tecnico_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dia_semana: string
          hora_fin: string
          hora_inicio: string
          id?: string
          tecnico_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dia_semana?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          tecnico_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tecnico_horarios_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      tecnicos: {
        Row: {
          apellido: string
          area: Database["public"]["Enums"]["area_tecnico"]
          certificaciones: string | null
          codigo_empleado: string | null
          created_at: string
          direccion: string
          documento_identidad: string | null
          email: string
          especialidad_id: number
          estado: string | null
          experiencia: string
          fecha_contratacion: string | null
          fecha_nacimiento: string | null
          frecuencia_pago: string | null
          genero: string | null
          habilidades: string | null
          id: string
          nombre: string
          rtn: string | null
          salario: number | null
          taller_id: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido: string
          area?: Database["public"]["Enums"]["area_tecnico"]
          certificaciones?: string | null
          codigo_empleado?: string | null
          created_at?: string
          direccion: string
          documento_identidad?: string | null
          email: string
          especialidad_id: number
          estado?: string | null
          experiencia: string
          fecha_contratacion?: string | null
          fecha_nacimiento?: string | null
          frecuencia_pago?: string | null
          genero?: string | null
          habilidades?: string | null
          id?: string
          nombre: string
          rtn?: string | null
          salario?: number | null
          taller_id: string
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido?: string
          area?: Database["public"]["Enums"]["area_tecnico"]
          certificaciones?: string | null
          codigo_empleado?: string | null
          created_at?: string
          direccion?: string
          documento_identidad?: string | null
          email?: string
          especialidad_id?: number
          estado?: string | null
          experiencia?: string
          fecha_contratacion?: string | null
          fecha_nacimiento?: string | null
          frecuencia_pago?: string | null
          genero?: string | null
          habilidades?: string | null
          id?: string
          nombre?: string
          rtn?: string | null
          salario?: number | null
          taller_id?: string
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tecnicos_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades_taller"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tecnicos_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_operacion: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          taller_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          taller_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          taller_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos: {
        Row: {
          anio: number
          cliente_id: string
          color: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_vehiculo"]
          id: string
          kilometraje: number
          marca: string
          modelo: string
          placa: string
          taller_id: string
          updated_at: string
          vin: string
        }
        Insert: {
          anio: number
          cliente_id: string
          color: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_vehiculo"]
          id?: string
          kilometraje?: number
          marca: string
          modelo: string
          placa: string
          taller_id: string
          updated_at?: string
          vin: string
        }
        Update: {
          anio?: number
          cliente_id?: string
          color?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_vehiculo"]
          id?: string
          kilometraje?: number
          marca?: string
          modelo?: string
          placa?: string
          taller_id?: string
          updated_at?: string
          vin?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculos_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_taller: { Args: { taller_id_param: string }; Returns: undefined }
      generate_codigo_cotizacion: { Args: never; Returns: string }
      generate_codigo_producto: { Args: never; Returns: string }
      generate_codigo_tarea: { Args: { p_taller_id: string }; Returns: string }
      generate_numero_factura: { Args: never; Returns: string }
      get_aseguradora_id_for_user: {
        Args: { _user_id: string }
        Returns: string
      }
      get_next_numero_orden_tarea: {
        Args: { p_taller_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_trial_expired: { Args: { taller_id: string }; Returns: boolean }
      reject_taller: { Args: { taller_id_param: string }; Returns: undefined }
      update_expired_trials: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "taller"
        | "admin_taller"
        | "aseguradora"
        | "super_admin"
        | "cliente"
        | "tecnico"
      area_tecnico: "tecnico" | "tecnico_senior"
      estado_cita: "programada" | "confirmada" | "completada" | "cancelada"
      estado_cotizacion:
        | "pendiente"
        | "aprobada"
        | "rechazada"
        | "convertida_a_orden"
      estado_factura:
        | "pendiente"
        | "pagada"
        | "parcial"
        | "vencida"
        | "cancelada"
      estado_flota: "activa" | "en_renovacion" | "inactiva"
      estado_inventario: "activo" | "descontinuado" | "agotado"
      estado_orden: "pendiente" | "en_proceso" | "completada" | "cancelada"
      estado_solicitud_afiliacion: "pendiente" | "aprobada" | "rechazada"
      estado_suscripcion: "prueba" | "activo" | "expirado"
      estado_vehiculo: "activo" | "en_servicio" | "entregado" | "inactivo"
      forma_pago_tarea: "por_hora" | "salario_fijo" | "contrato_precio_fijo"
      metodo_pago:
        | "efectivo"
        | "tarjeta_credito"
        | "tarjeta_debito"
        | "transferencia"
        | "cheque"
        | "otro"
      operacion_parte: "corregir" | "reparar" | "cambiar"
      prioridad_orden: "baja" | "media" | "alta" | "urgente"
      taller_status: "pendiente" | "aprobado" | "rechazado"
      tipo_cliente: "individual" | "empresa" | "flota"
      tipo_comunicacion_externa:
        | "aseguradora"
        | "arrendadora"
        | "taller_externo"
      tipo_comunicacion_interna:
        | "gerencia"
        | "ventas"
        | "produccion"
        | "suministro"
      tipo_contrato: "arrendamiento" | "propiedad" | "subcontratacion"
      tipo_flota: "propia" | "alquilada" | "mixta"
      tipo_tarea: "administrativa" | "operativa"
      unidad_tiempo_tarea: "minutos" | "horas"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "taller",
        "admin_taller",
        "aseguradora",
        "super_admin",
        "cliente",
        "tecnico",
      ],
      area_tecnico: ["tecnico", "tecnico_senior"],
      estado_cita: ["programada", "confirmada", "completada", "cancelada"],
      estado_cotizacion: [
        "pendiente",
        "aprobada",
        "rechazada",
        "convertida_a_orden",
      ],
      estado_factura: [
        "pendiente",
        "pagada",
        "parcial",
        "vencida",
        "cancelada",
      ],
      estado_flota: ["activa", "en_renovacion", "inactiva"],
      estado_inventario: ["activo", "descontinuado", "agotado"],
      estado_orden: ["pendiente", "en_proceso", "completada", "cancelada"],
      estado_solicitud_afiliacion: ["pendiente", "aprobada", "rechazada"],
      estado_suscripcion: ["prueba", "activo", "expirado"],
      estado_vehiculo: ["activo", "en_servicio", "entregado", "inactivo"],
      forma_pago_tarea: ["por_hora", "salario_fijo", "contrato_precio_fijo"],
      metodo_pago: [
        "efectivo",
        "tarjeta_credito",
        "tarjeta_debito",
        "transferencia",
        "cheque",
        "otro",
      ],
      operacion_parte: ["corregir", "reparar", "cambiar"],
      prioridad_orden: ["baja", "media", "alta", "urgente"],
      taller_status: ["pendiente", "aprobado", "rechazado"],
      tipo_cliente: ["individual", "empresa", "flota"],
      tipo_comunicacion_externa: [
        "aseguradora",
        "arrendadora",
        "taller_externo",
      ],
      tipo_comunicacion_interna: [
        "gerencia",
        "ventas",
        "produccion",
        "suministro",
      ],
      tipo_contrato: ["arrendamiento", "propiedad", "subcontratacion"],
      tipo_flota: ["propia", "alquilada", "mixta"],
      tipo_tarea: ["administrativa", "operativa"],
      unidad_tiempo_tarea: ["minutos", "horas"],
    },
  },
} as const
