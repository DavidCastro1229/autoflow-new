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
      ordenes: {
        Row: {
          cliente_id: string
          costo_estimado: number | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_orden"]
          fecha_entrega: string | null
          fecha_ingreso: string
          id: string
          observaciones: string | null
          prioridad: Database["public"]["Enums"]["prioridad_orden"]
          taller_id: string
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
          fecha_entrega?: string | null
          fecha_ingreso?: string
          id?: string
          observaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_orden"]
          taller_id: string
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
          fecha_entrega?: string | null
          fecha_ingreso?: string
          id?: string
          observaciones?: string | null
          prioridad?: Database["public"]["Enums"]["prioridad_orden"]
          taller_id?: string
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
          id: string
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
          id?: string
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
          id?: string
          nombre_contacto?: string
          nombre_taller?: string
          status?: Database["public"]["Enums"]["taller_status"]
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tecnicos: {
        Row: {
          apellido: string
          area: Database["public"]["Enums"]["area_tecnico"]
          certificaciones: string | null
          created_at: string
          direccion: string
          email: string
          especialidad_id: number
          experiencia: string
          habilidades: string | null
          id: string
          nombre: string
          taller_id: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido: string
          area?: Database["public"]["Enums"]["area_tecnico"]
          certificaciones?: string | null
          created_at?: string
          direccion: string
          email: string
          especialidad_id: number
          experiencia: string
          habilidades?: string | null
          id?: string
          nombre: string
          taller_id: string
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido?: string
          area?: Database["public"]["Enums"]["area_tecnico"]
          certificaciones?: string | null
          created_at?: string
          direccion?: string
          email?: string
          especialidad_id?: number
          experiencia?: string
          habilidades?: string | null
          id?: string
          nombre?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_taller: { Args: { taller_id_param: string }; Returns: undefined }
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
      estado_flota: "activa" | "en_renovacion" | "inactiva"
      estado_orden:
        | "pendiente"
        | "en_proceso"
        | "completada"
        | "entregada"
        | "cancelada"
      estado_vehiculo: "activo" | "en_servicio" | "entregado" | "inactivo"
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
      estado_flota: ["activa", "en_renovacion", "inactiva"],
      estado_orden: [
        "pendiente",
        "en_proceso",
        "completada",
        "entregada",
        "cancelada",
      ],
      estado_vehiculo: ["activo", "en_servicio", "entregado", "inactivo"],
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
    },
  },
} as const
