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
      estado_vehiculo: "activo" | "en_servicio" | "entregado" | "inactivo"
      taller_status: "pendiente" | "aprobado" | "rechazado"
      tipo_cliente: "individual" | "empresa" | "flota"
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
      estado_vehiculo: ["activo", "en_servicio", "entregado", "inactivo"],
      taller_status: ["pendiente", "aprobado", "rechazado"],
      tipo_cliente: ["individual", "empresa", "flota"],
    },
  },
} as const
