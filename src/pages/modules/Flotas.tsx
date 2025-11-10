import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Building2, Users, Phone, X, CreditCard, FileText, Scale, Upload, Truck, UserCircle, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type TipoFlota = "propia" | "alquilada" | "mixta";
type EstadoFlota = "activa" | "en_renovacion" | "inactiva";
type TipoComunicacionInterna = "gerencia" | "ventas" | "produccion" | "suministro";
type TipoComunicacionExterna = "aseguradora" | "arrendadora" | "taller_externo";

interface Propietario {
  id?: string;
  nombre_propietario: string;
  telefono: string;
  correo: string;
  razon_social: string;
  rtn: string;
  cantidad_vehiculos: number;
}

interface JefeFlota {
  nombre: string;
  telefono: string;
  correo: string;
  cargo_posicion: string;
  horarios_trabajo: string;
}

interface ContactoComunicacion {
  id?: string;
  nombre: string;
  correo: string;
  celular: string;
  whatsapp: string;
  telefono_fijo: string;
}

interface ComunicacionInterna {
  gerencia: ContactoComunicacion[];
  ventas: ContactoComunicacion[];
  produccion: ContactoComunicacion[];
  suministro: ContactoComunicacion[];
}

interface ComunicacionExterna {
  aseguradora: ContactoComunicacion[];
  arrendadora: ContactoComunicacion[];
  taller_externo: ContactoComunicacion[];
}

interface Departamento {
  id?: string;
  nombre_departamento: string;
  comunicacion_interna: ComunicacionInterna;
  comunicacion_externa: ComunicacionExterna;
}

interface DatosBancarios {
  entidad_bancaria: string;
  cuenta_bancaria: string;
  tipo_cuenta: string;
  moneda: string;
}

interface TarifaServicio {
  categoria_servicio_id: string;
  categoria_nombre?: string;
  tarifa: number;
}

interface DatosNegociacion {
  tipo_contrato: "arrendamiento" | "propiedad" | "subcontratacion";
  fecha_inicio: string;
  duracion_contrato: string;
  tarifa_precios: number;
  tarifa_descuento: number;
  descuento_pronto_pago: number;
  credito_autorizado_por: string;
  dias_credito_autorizado: number;
  porcentaje_cobro_mora: number;
  tarifas_servicio: TarifaServicio[];
}

interface TerminosPoliticas {
  politicas_uso_vehiculos: string[];
  politicas_combustible: string[];
  seguros_covertura: string[];
  politicas_renovacion: string[];
  politicas_condiciones_uso: string[];
}

interface VehiculoFlota {
  numero_unidad: string;
  marca_modelo: string;
  numero_placa: string;
  numero_vin: string;
  anio_fabricacion: number;
  kilometraje_actual: number;
  estado_vehiculo: string;
  fecha_ultimo_mantenimiento?: string;
  proximo_mantenimiento_programado?: string;
  historial_reparaciones?: string;
  conductores_asignados?: string;
  permiso_explotacion_unidad?: string;
  fecha_autorizacion_explotacion?: string;
  fecha_vencimiento_explotacion?: string;
  permiso_circulacion?: string;
  fecha_autorizacion_circulacion?: string;
  fecha_vencimiento_circulacion?: string;
  permiso_publicidad?: string;
  fecha_autorizacion_publicidad?: string;
  fecha_vencimiento_publicidad?: string;
  permisos_especiales?: string;
  fecha_autorizacion_especiales?: string;
  fecha_vencimiento_especiales?: string;
}

interface Conductor {
  id?: string;
  nombre: string;
  apellido: string;
  cedula_identidad: string;
  fecha_nacimiento: string;
  direccion: string;
  telefono: string;
  correo?: string;
  estado_civil?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  numero_licencia: string;
  tipo_licencia: string;
  fecha_emision_licencia: string;
  fecha_vencimiento_licencia: string;
  restricciones_licencia?: string;
  fecha_ingreso: string;
}

interface Flota {
  id?: string;
  numero_flota: string;
  fecha_registro: string;
  nombre_flota: string;
  logo_url: string;
  tipo_flota: TipoFlota;
  razon_social: string;
  numero_rtn: string;
  cantidad_vehiculos: number;
  categoria_vehiculos: string[];
  estado: EstadoFlota;
  rubro_empresa: string;
  direccion_fisica: string;
  telefono_contacto: string;
  correo_contacto: string;
  sitio_web: string;
  direccion_google_maps: string;
  direccion_escrita: string;
  direccion_parqueo: string;
  direccion_google_maps_parqueo: string;
  horarios_atencion: string;
  taller_id: string;
  propietarios?: Propietario[];
  jefe_flota?: JefeFlota;
  departamentos?: Departamento[];
  datos_bancarios?: DatosBancarios;
  datos_negociacion?: DatosNegociacion;
  terminos_politicas?: TerminosPoliticas;
  vehiculos?: VehiculoFlota[];
  conductores?: Conductor[];
}

const initialFormData: Flota = {
  numero_flota: "",
  fecha_registro: new Date().toISOString().split('T')[0],
  nombre_flota: "",
  logo_url: "",
  tipo_flota: "propia",
  razon_social: "",
  numero_rtn: "",
  cantidad_vehiculos: 0,
  categoria_vehiculos: [],
  estado: "activa",
  rubro_empresa: "",
  direccion_fisica: "",
  telefono_contacto: "",
  correo_contacto: "",
  sitio_web: "",
  direccion_google_maps: "",
  direccion_escrita: "",
  direccion_parqueo: "",
  direccion_google_maps_parqueo: "",
  horarios_atencion: "",
  taller_id: "",
  propietarios: [],
  jefe_flota: {
    nombre: "",
    telefono: "",
    correo: "",
    cargo_posicion: "",
    horarios_trabajo: "",
  },
  departamentos: [],
  datos_bancarios: {
    entidad_bancaria: "",
    cuenta_bancaria: "",
    tipo_cuenta: "",
    moneda: "HNL",
  },
  datos_negociacion: {
    tipo_contrato: "propiedad",
    fecha_inicio: new Date().toISOString().split('T')[0],
    duracion_contrato: "",
    tarifa_precios: 0,
    tarifa_descuento: 0,
    descuento_pronto_pago: 0,
    credito_autorizado_por: "",
    dias_credito_autorizado: 0,
    porcentaje_cobro_mora: 0,
    tarifas_servicio: [],
  },
  terminos_politicas: {
    politicas_uso_vehiculos: [],
    politicas_combustible: [],
    seguros_covertura: [],
    politicas_renovacion: [],
    politicas_condiciones_uso: [],
  },
  vehiculos: [],
  conductores: [],
};

export default function Flotas() {
  const { tallerId } = useUserRole();
  const { toast } = useToast();
  const [flotas, setFlotas] = useState<Flota[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Flota>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoriaInput, setCategoriaInput] = useState("");
  const [categoriasServicio, setCategoriasServicio] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [excelVehiculos, setExcelVehiculos] = useState<VehiculoFlota[]>([]);
  const [excelError, setExcelError] = useState<string>("");
  const [conductorDialogOpen, setConductorDialogOpen] = useState(false);
  const [conductorFormData, setConductorFormData] = useState<Conductor | null>(null);
  const [editingConductorId, setEditingConductorId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [politicasFiles, setPoliticasFiles] = useState<Record<keyof TerminosPoliticas, File[]>>({
    politicas_uso_vehiculos: [],
    politicas_combustible: [],
    seguros_covertura: [],
    politicas_renovacion: [],
    politicas_condiciones_uso: [],
  });
  const [tempConductores, setTempConductores] = useState<Conductor[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedFlota, setSelectedFlota] = useState<Flota | null>(null);

  useEffect(() => {
    if (tallerId) {
      fetchFlotas();
      fetchCategoriasServicio();
    }
  }, [tallerId]);

  const fetchCategoriasServicio = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_servicio")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      setCategoriasServicio(data || []);
    } catch (error) {
      console.error("Error fetching categorias servicio:", error);
    }
  };

  const fetchFlotas = async () => {
    try {
      const { data, error } = await supabase
        .from("flotas")
        .select("*")
        .eq("taller_id", tallerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlotas(data || []);
    } catch (error) {
      console.error("Error fetching flotas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las flotas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tallerId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el taller",
        variant: "destructive",
      });
      return;
    }

    try {
      let logoUrl = formData.logo_url;

      // Upload logo if a new file was selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('flota-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('flota-logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Separate flota data from related entities that go in separate tables
      const { 
        vehiculos, 
        conductores, 
        propietarios, 
        jefe_flota, 
        departamentos, 
        datos_bancarios, 
        datos_negociacion, 
        terminos_politicas,
        ...flotaMainData 
      } = formData;
      
      const flotaData = {
        ...flotaMainData,
        logo_url: logoUrl,
        taller_id: tallerId,
      };

      let flotaId: string;

      if (editingId) {
        const { error } = await supabase
          .from("flotas")
          .update(flotaData)
          .eq("id", editingId);

        if (error) throw error;
        flotaId = editingId;
      } else {
        const { data, error } = await supabase
          .from("flotas")
          .insert([flotaData])
          .select()
          .single();

        if (error) throw error;
        flotaId = data.id;
        
        // Generate automatic numero_flota with format FLOT-year-month-consecutive
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const consecutive = flotaId.substring(0, 8); // Use first 8 chars of UUID
        const numeroFlota = `FLOT-${year}-${month}-${consecutive}`;
        
        // Update flota with generated numero
        await supabase
          .from("flotas")
          .update({ numero_flota: numeroFlota })
          .eq("id", flotaId);
      }

      // Save propietarios if tipo_flota is mixta
      if (formData.tipo_flota === "mixta" && formData.propietarios && formData.propietarios.length > 0) {
        if (editingId) {
          await supabase.from("flota_propietarios").delete().eq("flota_id", flotaId);
        }
        
        const propietariosData = formData.propietarios.map(p => ({
          flota_id: flotaId,
          ...p,
        }));

        const { error: propError } = await supabase
          .from("flota_propietarios")
          .insert(propietariosData);

        if (propError) throw propError;
      }

      // Save jefe de flota
      if (formData.jefe_flota) {
        if (editingId) {
          await supabase.from("flota_jefe").delete().eq("flota_id", flotaId);
        }

        const { error: jefeError } = await supabase
          .from("flota_jefe")
          .insert([{
            flota_id: flotaId,
            ...formData.jefe_flota,
          }]);

        if (jefeError) throw jefeError;
      }

      // Save departamentos with comunicacion
      if (formData.departamentos && formData.departamentos.length > 0) {
        if (editingId) {
          await supabase.from("flota_departamentos").delete().eq("flota_id", flotaId);
        }

        for (const dept of formData.departamentos) {
          const { data: deptData, error: deptError } = await supabase
            .from("flota_departamentos")
            .insert([{
              flota_id: flotaId,
              nombre_departamento: dept.nombre_departamento,
            }])
            .select()
            .single();

          if (deptError) throw deptError;

          // Save comunicacion interna
          const comunicacionInternaData: any[] = [];
          Object.entries(dept.comunicacion_interna).forEach(([tipo, contactos]) => {
            contactos.forEach(contacto => {
              comunicacionInternaData.push({
                departamento_id: deptData.id,
                tipo: tipo as TipoComunicacionInterna,
                ...contacto,
              });
            });
          });

          if (comunicacionInternaData.length > 0) {
            const { error: intError } = await supabase
              .from("flota_comunicacion_interna")
              .insert(comunicacionInternaData);
            if (intError) throw intError;
          }

          // Save comunicacion externa
          const comunicacionExternaData: any[] = [];
          Object.entries(dept.comunicacion_externa).forEach(([tipo, contactos]) => {
            contactos.forEach(contacto => {
              comunicacionExternaData.push({
                departamento_id: deptData.id,
                tipo: tipo as TipoComunicacionExterna,
                ...contacto,
              });
            });
          });

          if (comunicacionExternaData.length > 0) {
            const { error: extError } = await supabase
              .from("flota_comunicacion_externa")
              .insert(comunicacionExternaData);
            if (extError) throw extError;
          }
        }
      }

      // Save datos bancarios
      if (formData.datos_bancarios) {
        if (editingId) {
          await supabase.from("flota_datos_bancarios").delete().eq("flota_id", flotaId);
        }

        const { error: bancError } = await supabase
          .from("flota_datos_bancarios")
          .insert([{
            flota_id: flotaId,
            ...formData.datos_bancarios,
          }]);

        if (bancError) throw bancError;
      }

      // Save datos negociacion
      if (formData.datos_negociacion) {
        if (editingId) {
          await supabase.from("flota_datos_negociacion").delete().eq("flota_id", flotaId);
        }

        const { error: negError } = await supabase
          .from("flota_datos_negociacion")
          .insert([{
            flota_id: flotaId,
            tipo_contrato: formData.datos_negociacion.tipo_contrato,
            fecha_inicio: formData.datos_negociacion.fecha_inicio,
            duracion_contrato: formData.datos_negociacion.duracion_contrato,
            tarifa_precios: formData.datos_negociacion.tarifa_precios,
            tarifa_descuento: formData.datos_negociacion.tarifa_descuento,
            descuento_pronto_pago: formData.datos_negociacion.descuento_pronto_pago,
            credito_autorizado_por: formData.datos_negociacion.credito_autorizado_por,
            dias_credito_autorizado: formData.datos_negociacion.dias_credito_autorizado,
            porcentaje_cobro_mora: formData.datos_negociacion.porcentaje_cobro_mora,
          }]);

        if (negError) throw negError;

        // Save tarifas servicio
        if (formData.datos_negociacion.tarifas_servicio.length > 0) {
          if (editingId) {
            await supabase.from("flota_tarifas_servicio").delete().eq("flota_id", flotaId);
          }

          const tarifasData = formData.datos_negociacion.tarifas_servicio.map(t => ({
            flota_id: flotaId,
            categoria_servicio_id: t.categoria_servicio_id,
            tarifa: t.tarifa,
          }));

          const { error: tarifasError } = await supabase
            .from("flota_tarifas_servicio")
            .insert(tarifasData);

          if (tarifasError) throw tarifasError;
        }
      }

      // Upload politicas files
      const uploadedPoliticas: TerminosPoliticas = {
        politicas_uso_vehiculos: [...(formData.terminos_politicas?.politicas_uso_vehiculos || [])],
        politicas_combustible: [...(formData.terminos_politicas?.politicas_combustible || [])],
        seguros_covertura: [...(formData.terminos_politicas?.seguros_covertura || [])],
        politicas_renovacion: [...(formData.terminos_politicas?.politicas_renovacion || [])],
        politicas_condiciones_uso: [...(formData.terminos_politicas?.politicas_condiciones_uso || [])],
      };

      for (const [tipo, files] of Object.entries(politicasFiles) as [keyof TerminosPoliticas, File[]][]) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${flotaId}/${tipo}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('flota-politicas')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('flota-politicas')
            .getPublicUrl(fileName);

          uploadedPoliticas[tipo].push(publicUrl);
        }
      }

      // Save terminos y politicas
      if (editingId) {
        await supabase.from("flota_terminos_politicas").delete().eq("flota_id", flotaId);
      }

      const { error: termError } = await supabase
        .from("flota_terminos_politicas")
        .insert([{
          flota_id: flotaId,
          ...uploadedPoliticas,
        }]);

      if (termError) throw termError;

      // Save vehiculos inventario if Excel data exists
      if (excelVehiculos.length > 0) {
        await saveVehiculosInventario(flotaId);
      }

      // Save temp conductores (exclude temp ID)
      if (tempConductores.length > 0) {
        const conductoresData = tempConductores.map(({ id, ...c }) => ({
          flota_id: flotaId,
          ...c,
        }));

        const { error: condError } = await supabase
          .from("flota_conductores")
          .insert(conductoresData);

        if (condError) throw condError;
      }

      toast({
        title: "Éxito",
        description: `Flota ${editingId ? "actualizada" : "creada"} correctamente`,
      });

      setDialogOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
      setLogoFile(null);
      setPoliticasFiles({
        politicas_uso_vehiculos: [],
        politicas_combustible: [],
        seguros_covertura: [],
        politicas_renovacion: [],
        politicas_condiciones_uso: [],
      });
      setTempConductores([]);
      setExcelVehiculos([]);
      fetchFlotas();
    } catch (error) {
      console.error("Error saving flota:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la flota",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (flota: Flota) => {
    try {
      // Load all related data
      const [
        conductoresRes,
        propietariosRes,
        jefeRes,
        departamentosRes,
        bancarioRes,
        negociacionRes,
        terminosRes,
        vehiculosRes,
        tarifasRes
      ] = await Promise.all([
        supabase.from("flota_conductores").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_propietarios").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_jefe").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_departamentos").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_datos_bancarios").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_datos_negociacion").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_terminos_politicas").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_vehiculos").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_tarifas_servicio").select("*, categorias_servicio(nombre)").eq("flota_id", flota.id!)
      ]);

      // Load departamentos with their comunicacion interna y externa
      const departamentosWithComunicacion = await Promise.all(
        (departamentosRes.data || []).map(async (dept) => {
          const [internaRes, externaRes] = await Promise.all([
            supabase.from("flota_comunicacion_interna").select("*").eq("departamento_id", dept.id),
            supabase.from("flota_comunicacion_externa").select("*").eq("departamento_id", dept.id)
          ]);

          const comunicacionInterna: ComunicacionInterna = {
            gerencia: internaRes.data?.filter(c => c.tipo === 'gerencia') || [],
            ventas: internaRes.data?.filter(c => c.tipo === 'ventas') || [],
            produccion: internaRes.data?.filter(c => c.tipo === 'produccion') || [],
            suministro: internaRes.data?.filter(c => c.tipo === 'suministro') || [],
          };

          const comunicacionExterna: ComunicacionExterna = {
            aseguradora: externaRes.data?.filter(c => c.tipo === 'aseguradora') || [],
            arrendadora: externaRes.data?.filter(c => c.tipo === 'arrendadora') || [],
            taller_externo: externaRes.data?.filter(c => c.tipo === 'taller_externo') || [],
          };

          return {
            ...dept,
            comunicacion_interna: comunicacionInterna,
            comunicacion_externa: comunicacionExterna,
          };
        })
      );

      // Build datos_negociacion with tarifas
      const datosNegociacion = negociacionRes.data ? {
        ...negociacionRes.data,
        tarifas_servicio: (tarifasRes.data || []).map(t => ({
          categoria_servicio_id: t.categoria_servicio_id,
          categoria_nombre: t.categorias_servicio?.nombre,
          tarifa: t.tarifa
        }))
      } : undefined;

      setFormData({
        ...flota,
        conductores: conductoresRes.data || [],
        propietarios: propietariosRes.data || [],
        jefe_flota: jefeRes.data || undefined,
        departamentos: departamentosWithComunicacion || [],
        datos_bancarios: bancarioRes.data || undefined,
        datos_negociacion: datosNegociacion,
        terminos_politicas: terminosRes.data || undefined,
        vehiculos: vehiculosRes.data || [],
      });
      
      setEditingId(flota.id!);
      setLogoFile(null);
      setTempConductores([]);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error loading flota data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la flota",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (flota: Flota) => {
    try {
      // Load all related data for viewing
      const [
        conductoresRes,
        propietariosRes,
        jefeRes,
        departamentosRes,
        bancarioRes,
        negociacionRes,
        terminosRes,
        vehiculosRes,
        tarifasRes
      ] = await Promise.all([
        supabase.from("flota_conductores").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_propietarios").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_jefe").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_departamentos").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_datos_bancarios").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_datos_negociacion").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_terminos_politicas").select("*").eq("flota_id", flota.id!).single(),
        supabase.from("flota_vehiculos").select("*").eq("flota_id", flota.id!),
        supabase.from("flota_tarifas_servicio").select("*, categorias_servicio(nombre)").eq("flota_id", flota.id!)
      ]);

      const departamentosWithComunicacion = await Promise.all(
        (departamentosRes.data || []).map(async (dept) => {
          const [internaRes, externaRes] = await Promise.all([
            supabase.from("flota_comunicacion_interna").select("*").eq("departamento_id", dept.id),
            supabase.from("flota_comunicacion_externa").select("*").eq("departamento_id", dept.id)
          ]);

          const comunicacionInterna: ComunicacionInterna = {
            gerencia: internaRes.data?.filter(c => c.tipo === 'gerencia') || [],
            ventas: internaRes.data?.filter(c => c.tipo === 'ventas') || [],
            produccion: internaRes.data?.filter(c => c.tipo === 'produccion') || [],
            suministro: internaRes.data?.filter(c => c.tipo === 'suministro') || [],
          };

          const comunicacionExterna: ComunicacionExterna = {
            aseguradora: externaRes.data?.filter(c => c.tipo === 'aseguradora') || [],
            arrendadora: externaRes.data?.filter(c => c.tipo === 'arrendadora') || [],
            taller_externo: externaRes.data?.filter(c => c.tipo === 'taller_externo') || [],
          };

          return {
            ...dept,
            comunicacion_interna: comunicacionInterna,
            comunicacion_externa: comunicacionExterna,
          };
        })
      );

      const datosNegociacion = negociacionRes.data ? {
        ...negociacionRes.data,
        tarifas_servicio: (tarifasRes.data || []).map(t => ({
          categoria_servicio_id: t.categoria_servicio_id,
          categoria_nombre: t.categorias_servicio?.nombre,
          tarifa: t.tarifa
        }))
      } : undefined;

      setSelectedFlota({
        ...flota,
        conductores: conductoresRes.data || [],
        propietarios: propietariosRes.data || [],
        jefe_flota: jefeRes.data || undefined,
        departamentos: departamentosWithComunicacion || [],
        datos_bancarios: bancarioRes.data || undefined,
        datos_negociacion: datosNegociacion,
        terminos_politicas: terminosRes.data || undefined,
        vehiculos: vehiculosRes.data || [],
      });
      
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error loading flota details:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la flota",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta flota?")) return;

    try {
      const { error } = await supabase.from("flotas").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Flota eliminada correctamente",
      });
      fetchFlotas();
    } catch (error) {
      console.error("Error deleting flota:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la flota",
        variant: "destructive",
      });
    }
  };

  const addPropietario = () => {
    setFormData({
      ...formData,
      propietarios: [
        ...(formData.propietarios || []),
        {
          nombre_propietario: "",
          telefono: "",
          correo: "",
          razon_social: "",
          rtn: "",
          cantidad_vehiculos: 0,
        },
      ],
    });
  };

  const removePropietario = (index: number) => {
    setFormData({
      ...formData,
      propietarios: formData.propietarios?.filter((_, i) => i !== index),
    });
  };

  const updatePropietario = (index: number, field: keyof Propietario, value: any) => {
    const newPropietarios = [...(formData.propietarios || [])];
    newPropietarios[index] = { ...newPropietarios[index], [field]: value };
    setFormData({ ...formData, propietarios: newPropietarios });
  };

  const addDepartamento = () => {
    setFormData({
      ...formData,
      departamentos: [
        ...(formData.departamentos || []),
        {
          nombre_departamento: "",
          comunicacion_interna: {
            gerencia: [],
            ventas: [],
            produccion: [],
            suministro: [],
          },
          comunicacion_externa: {
            aseguradora: [],
            arrendadora: [],
            taller_externo: [],
          },
        },
      ],
    });
  };

  const removeDepartamento = (index: number) => {
    setFormData({
      ...formData,
      departamentos: formData.departamentos?.filter((_, i) => i !== index),
    });
  };

  const updateDepartamentoNombre = (index: number, value: string) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    newDepartamentos[index] = { ...newDepartamentos[index], nombre_departamento: value };
    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const addContacto = (deptIndex: number, tipo: "interna" | "externa", categoria: string) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    const dept = newDepartamentos[deptIndex];
    
    const newContacto: ContactoComunicacion = {
      nombre: "",
      correo: "",
      celular: "",
      whatsapp: "",
      telefono_fijo: "",
    };

    if (tipo === "interna") {
      dept.comunicacion_interna[categoria as keyof ComunicacionInterna].push(newContacto);
    } else {
      dept.comunicacion_externa[categoria as keyof ComunicacionExterna].push(newContacto);
    }

    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const removeContacto = (deptIndex: number, tipo: "interna" | "externa", categoria: string, contactoIndex: number) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    const dept = newDepartamentos[deptIndex];

    if (tipo === "interna") {
      dept.comunicacion_interna[categoria as keyof ComunicacionInterna] = 
        dept.comunicacion_interna[categoria as keyof ComunicacionInterna].filter((_, i) => i !== contactoIndex);
    } else {
      dept.comunicacion_externa[categoria as keyof ComunicacionExterna] = 
        dept.comunicacion_externa[categoria as keyof ComunicacionExterna].filter((_, i) => i !== contactoIndex);
    }

    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const updateContacto = (
    deptIndex: number,
    tipo: "interna" | "externa",
    categoria: string,
    contactoIndex: number,
    field: keyof ContactoComunicacion,
    value: string
  ) => {
    const newDepartamentos = [...(formData.departamentos || [])];
    const dept = newDepartamentos[deptIndex];

    if (tipo === "interna") {
      const contactos = [...dept.comunicacion_interna[categoria as keyof ComunicacionInterna]];
      contactos[contactoIndex] = { ...contactos[contactoIndex], [field]: value };
      dept.comunicacion_interna[categoria as keyof ComunicacionInterna] = contactos;
    } else {
      const contactos = [...dept.comunicacion_externa[categoria as keyof ComunicacionExterna]];
      contactos[contactoIndex] = { ...contactos[contactoIndex], [field]: value };
      dept.comunicacion_externa[categoria as keyof ComunicacionExterna] = contactos;
    }

    setFormData({ ...formData, departamentos: newDepartamentos });
  };

  const addCategoria = () => {
    if (categoriaInput.trim()) {
      setFormData({
        ...formData,
        categoria_vehiculos: [...formData.categoria_vehiculos, categoriaInput.trim()],
      });
      setCategoriaInput("");
    }
  };

  const removeCategoria = (index: number) => {
    setFormData({
      ...formData,
      categoria_vehiculos: formData.categoria_vehiculos.filter((_, i) => i !== index),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: keyof TerminosPoliticas) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setPoliticasFiles(prev => ({
      ...prev,
      [tipo]: [...prev[tipo], ...newFiles],
    }));

    toast({
      title: "Archivos seleccionados",
      description: `${newFiles.length} archivo(s) seleccionado(s). Se subirán al guardar la flota.`,
    });
  };

  const removeFile = (tipo: keyof TerminosPoliticas, index: number) => {
    // Remove from uploaded files
    if (formData.terminos_politicas?.[tipo]?.[index]) {
      setFormData({
        ...formData,
        terminos_politicas: {
          ...formData.terminos_politicas!,
          [tipo]: formData.terminos_politicas?.[tipo].filter((_, i) => i !== index) || [],
        },
      });
    } else {
      // Remove from pending files
      setPoliticasFiles(prev => ({
        ...prev,
        [tipo]: prev[tipo].filter((_, i) => i !== (index - (formData.terminos_politicas?.[tipo]?.length || 0))),
      }));
    }
  };

  const updateTarifaServicio = (categoriaId: string, tarifa: number) => {
    const tarifas = formData.datos_negociacion?.tarifas_servicio || [];
    const existingIndex = tarifas.findIndex(t => t.categoria_servicio_id === categoriaId);
    
    if (existingIndex >= 0) {
      tarifas[existingIndex].tarifa = tarifa;
    } else {
      tarifas.push({
        categoria_servicio_id: categoriaId,
        tarifa,
      });
    }

    setFormData({
      ...formData,
      datos_negociacion: {
        ...formData.datos_negociacion!,
        tarifas_servicio: tarifas,
      },
    });
  };

const EXPECTED_EXCEL_HEADERS = [
  "numero de unidad",
  "marca y modelo",
  "numero de placa",
  "numero de vin",
  "ano de fabricacion",
  "kilometraje actual",
  "estado del vehiculo",
  "fecha de ultimo mantenimiento",
  "proximo mantenimiento programado",
  "historial de reparaciones",
  "conductores asignados",
  "permiso de explotacion de unidad",
  "fecha autorizacion de explotacion de unidad",
  "fecha vencimiento de explotacion de unidad",
  "permiso de circulacion",
  "fecha autorizacion de circulacion",
  "fecha vencimiento de circulacion",
  "permiso de publicidad",
  "fecha autorizacion de publicidad",
  "fecha vencimiento de publicidad",
  "permisos especiales",
  "fecha autorizacion especiales",
  "fecha vencimiento especiales"
];

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          setExcelError("El archivo está vacío");
          setExcelVehiculos([]);
          return;
        }

        const headers = jsonData[0] as string[];
        
        // Validar headers
        const isValid = EXPECTED_EXCEL_HEADERS.every((expected, index) => {
          return headers[index] === expected;
        });

        if (!isValid || headers.length !== EXPECTED_EXCEL_HEADERS.length) {
          setExcelError("La estructura del archivo no es correcta. Asegúrese de que las columnas coincidan exactamente con la estructura requerida.");
          setExcelVehiculos([]);
          return;
        }

        // Procesar datos
        const vehiculos: VehiculoFlota[] = jsonData.slice(1).map((row: any) => ({
          numero_unidad: row[0]?.toString() || "",
          marca_modelo: row[1]?.toString() || "",
          numero_placa: row[2]?.toString() || "",
          numero_vin: row[3]?.toString() || "",
          anio_fabricacion: parseInt(row[4]) || 0,
          kilometraje_actual: parseInt(row[5]) || 0,
          estado_vehiculo: row[6]?.toString() || "",
          fecha_ultimo_mantenimiento: row[7] ? new Date(row[7]).toISOString().split('T')[0] : undefined,
          proximo_mantenimiento_programado: row[8] ? new Date(row[8]).toISOString().split('T')[0] : undefined,
          historial_reparaciones: row[9]?.toString() || "",
          conductores_asignados: row[10]?.toString() || "",
          permiso_explotacion_unidad: row[11]?.toString() || "",
          fecha_autorizacion_explotacion: row[12] ? new Date(row[12]).toISOString().split('T')[0] : undefined,
          fecha_vencimiento_explotacion: row[13] ? new Date(row[13]).toISOString().split('T')[0] : undefined,
          permiso_circulacion: row[14]?.toString() || "",
          fecha_autorizacion_circulacion: row[15] ? new Date(row[15]).toISOString().split('T')[0] : undefined,
          fecha_vencimiento_circulacion: row[16] ? new Date(row[16]).toISOString().split('T')[0] : undefined,
          permiso_publicidad: row[17]?.toString() || "",
          fecha_autorizacion_publicidad: row[18] ? new Date(row[18]).toISOString().split('T')[0] : undefined,
          fecha_vencimiento_publicidad: row[19] ? new Date(row[19]).toISOString().split('T')[0] : undefined,
          permisos_especiales: row[20]?.toString() || "",
          fecha_autorizacion_especiales: row[21] ? new Date(row[21]).toISOString().split('T')[0] : undefined,
          fecha_vencimiento_especiales: row[22] ? new Date(row[22]).toISOString().split('T')[0] : undefined,
        }));

        setExcelVehiculos(vehiculos);
        setExcelError("");
        
        toast({
          title: "Éxito",
          description: `${vehiculos.length} vehículos cargados correctamente`,
        });
      } catch (error) {
        console.error("Error processing Excel:", error);
        setExcelError("Error al procesar el archivo. Verifique que sea un archivo Excel válido.");
        setExcelVehiculos([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const saveVehiculosInventario = async (flotaId: string) => {
    if (excelVehiculos.length === 0) return;

    try {
      // Delete existing vehiculos
      await supabase.from("flota_vehiculos").delete().eq("flota_id", flotaId);

      // Insert new vehiculos
      const vehiculosData = excelVehiculos.map(v => ({
        flota_id: flotaId,
        ...v,
      }));

      const { error } = await supabase
        .from("flota_vehiculos")
        .insert(vehiculosData);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Inventario de vehículos guardado correctamente",
      });
    } catch (error) {
      console.error("Error saving vehiculos:", error);
      throw error;
    }
  };

  const addConductor = () => {
    setConductorFormData({
      nombre: "",
      apellido: "",
      cedula_identidad: "",
      fecha_nacimiento: "",
      direccion: "",
      telefono: "",
      correo: "",
      estado_civil: "",
      contacto_emergencia_nombre: "",
      contacto_emergencia_telefono: "",
      numero_licencia: "",
      tipo_licencia: "",
      fecha_emision_licencia: "",
      fecha_vencimiento_licencia: "",
      restricciones_licencia: "",
      fecha_ingreso: new Date().toISOString().split('T')[0],
    });
    setEditingConductorId(null);
    setConductorDialogOpen(true);
  };

  const handleConductorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conductorFormData) return;

    // If flota already exists, save to database
    if (formData.id) {
      try {
        const conductorData = {
          flota_id: formData.id,
          ...conductorFormData,
        };

        if (editingConductorId) {
          const { error } = await supabase
            .from("flota_conductores")
            .update(conductorData)
            .eq("id", editingConductorId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("flota_conductores")
            .insert([conductorData]);

          if (error) throw error;
        }

        toast({
          title: "Éxito",
          description: `Conductor ${editingConductorId ? "actualizado" : "creado"} correctamente`,
        });

        // Reload conductores
        const { data } = await supabase
          .from("flota_conductores")
          .select("*")
          .eq("flota_id", formData.id);
        
        setFormData({ ...formData, conductores: data || [] });
      } catch (error) {
        console.error("Error saving conductor:", error);
        toast({
          title: "Error",
          description: "No se pudo guardar el conductor",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Store in temp state until flota is created
      if (editingConductorId) {
        setTempConductores(prev => 
          prev.map(c => c.id === editingConductorId ? { ...conductorFormData, id: editingConductorId } : c)
        );
      } else {
        setTempConductores(prev => [...prev, { ...conductorFormData, id: Date.now().toString() }]);
      }

      toast({
        title: "Éxito",
        description: `Conductor ${editingConductorId ? "actualizado" : "agregado"}. Se guardará al crear la flota.`,
      });
    }

    setConductorDialogOpen(false);
    setConductorFormData(null);
    setEditingConductorId(null);
  };

  const deleteConductor = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este conductor?")) return;

    // Check if it's a temp conductor
    const isTempConductor = tempConductores.some(c => c.id === id);
    
    if (isTempConductor) {
      setTempConductores(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Éxito",
        description: "Conductor eliminado",
      });
      return;
    }

    // Otherwise delete from database
    try {
      const { error } = await supabase
        .from("flota_conductores")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Conductor eliminado correctamente",
      });

      // Reload conductores
      const { data } = await supabase
        .from("flota_conductores")
        .select("*")
        .eq("flota_id", formData.id!);
      
      setFormData({ ...formData, conductores: data || [] });
    } catch (error) {
      console.error("Error deleting conductor:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el conductor",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flotas</h1>
          <p className="text-muted-foreground">Gestión de flotas vehiculares</p>
        </div>
        <Button onClick={() => { setFormData(initialFormData); setEditingId(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Flota
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Flotas</CardTitle>
          <CardDescription>Administra todas las flotas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Razón Social</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flotas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay flotas registradas
                  </TableCell>
                </TableRow>
              ) : (
                flotas.map((flota) => (
                  <TableRow key={flota.id}>
                    <TableCell className="font-medium">{flota.numero_flota}</TableCell>
                    <TableCell>{flota.nombre_flota}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{flota.tipo_flota}</Badge>
                    </TableCell>
                    <TableCell>{flota.razon_social}</TableCell>
                    <TableCell>{flota.cantidad_vehiculos}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          flota.estado === "activa"
                            ? "default"
                            : flota.estado === "en_renovacion"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {flota.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(flota)} title="Ver detalles">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(flota)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(flota.id!)} title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nueva"} Flota</DialogTitle>
            <DialogDescription>
              Complete la información de la flota en las siguientes secciones
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="generales" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="generales">
                  <Building2 className="mr-2 h-4 w-4" />
                  Datos Generales
                </TabsTrigger>
                <TabsTrigger value="jefe">
                  <Users className="mr-2 h-4 w-4" />
                  Jefe de Flota
                </TabsTrigger>
                <TabsTrigger value="comunicacion">
                  <Phone className="mr-2 h-4 w-4" />
                  Comunicación
                </TabsTrigger>
                <TabsTrigger value="bancarios">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Datos Bancarios
                </TabsTrigger>
                <TabsTrigger value="negociacion">
                  <Scale className="mr-2 h-4 w-4" />
                  Negociación
                </TabsTrigger>
                <TabsTrigger value="terminos">
                  <FileText className="mr-2 h-4 w-4" />
                  Términos
                </TabsTrigger>
                <TabsTrigger value="inventario">
                  <Truck className="mr-2 h-4 w-4" />
                  Inventario
                </TabsTrigger>
                <TabsTrigger value="conductores">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Conductores
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generales" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_flota">Número de Flota</Label>
                    <Input
                      id="numero_flota"
                      value={editingId ? formData.numero_flota : "Se generará automáticamente"}
                      disabled
                      className="bg-muted"
                    />
                    {!editingId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Formato: FLOT-año-mes-consecutivo
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="fecha_registro">Fecha de Registro *</Label>
                    <Input
                      id="fecha_registro"
                      type="date"
                      required
                      value={formData.fecha_registro}
                      onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombre_flota">Nombre de la Flota *</Label>
                    <Input
                      id="nombre_flota"
                      required
                      value={formData.nombre_flota}
                      onChange={(e) => setFormData({ ...formData, nombre_flota: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo">Logo de la Flota</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setLogoFile(file);
                      }}
                    />
                    {(logoFile || formData.logo_url) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {logoFile ? `Archivo seleccionado: ${logoFile.name}` : "Logo actual guardado"}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="tipo_flota">Tipo de Flota *</Label>
                    <Select
                      value={formData.tipo_flota}
                      onValueChange={(value: TipoFlota) => setFormData({ ...formData, tipo_flota: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="propia">Propia</SelectItem>
                        <SelectItem value="alquilada">Alquilada</SelectItem>
                        <SelectItem value="mixta">Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="razon_social">Razón Social *</Label>
                    <Input
                      id="razon_social"
                      required
                      value={formData.razon_social}
                      onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero_rtn">Número RTN *</Label>
                    <Input
                      id="numero_rtn"
                      required
                      value={formData.numero_rtn}
                      onChange={(e) => setFormData({ ...formData, numero_rtn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cantidad_vehiculos">Cantidad de Vehículos *</Label>
                    <Input
                      id="cantidad_vehiculos"
                      type="number"
                      required
                      value={formData.cantidad_vehiculos}
                      onChange={(e) => setFormData({ ...formData, cantidad_vehiculos: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rubro_empresa">Rubro de la Empresa *</Label>
                    <Input
                      id="rubro_empresa"
                      required
                      value={formData.rubro_empresa}
                      onChange={(e) => setFormData({ ...formData, rubro_empresa: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value: EstadoFlota) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="en_renovacion">En Renovación</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Categorías de Vehículos</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Ej: Camiones, Motocicletas"
                      value={categoriaInput}
                      onChange={(e) => setCategoriaInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategoria())}
                    />
                    <Button type="button" onClick={addCategoria}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.categoria_vehiculos.map((cat, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        {cat}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeCategoria(idx)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Información de Contacto</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="direccion_fisica">Dirección Física *</Label>
                      <Input
                        id="direccion_fisica"
                        required
                        value={formData.direccion_fisica}
                        onChange={(e) => setFormData({ ...formData, direccion_fisica: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono_contacto">Teléfono de Contacto *</Label>
                      <Input
                        id="telefono_contacto"
                        required
                        value={formData.telefono_contacto}
                        onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="correo_contacto">Correo Electrónico *</Label>
                      <Input
                        id="correo_contacto"
                        type="email"
                        required
                        value={formData.correo_contacto}
                        onChange={(e) => setFormData({ ...formData, correo_contacto: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sitio_web">Sitio Web</Label>
                      <Input
                        id="sitio_web"
                        value={formData.sitio_web}
                        onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_google_maps">Dirección Google Maps</Label>
                      <Input
                        id="direccion_google_maps"
                        value={formData.direccion_google_maps}
                        onChange={(e) => setFormData({ ...formData, direccion_google_maps: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_escrita">Dirección Escrita</Label>
                      <Input
                        id="direccion_escrita"
                        value={formData.direccion_escrita}
                        onChange={(e) => setFormData({ ...formData, direccion_escrita: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_parqueo">Dirección de Parqueo</Label>
                      <Input
                        id="direccion_parqueo"
                        value={formData.direccion_parqueo}
                        onChange={(e) => setFormData({ ...formData, direccion_parqueo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="direccion_google_maps_parqueo">Google Maps Parqueo</Label>
                      <Input
                        id="direccion_google_maps_parqueo"
                        value={formData.direccion_google_maps_parqueo}
                        onChange={(e) => setFormData({ ...formData, direccion_google_maps_parqueo: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="horarios_atencion">Horarios de Atención</Label>
                      <Textarea
                        id="horarios_atencion"
                        value={formData.horarios_atencion}
                        onChange={(e) => setFormData({ ...formData, horarios_atencion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {formData.tipo_flota === "mixta" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Propietarios (Flota Mixta)</h4>
                        <Button type="button" size="sm" onClick={addPropietario}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Propietario
                        </Button>
                      </div>
                      {formData.propietarios?.map((prop, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h5 className="font-medium">Propietario {idx + 1}</h5>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removePropietario(idx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nombre</Label>
                                <Input
                                  value={prop.nombre_propietario}
                                  onChange={(e) => updatePropietario(idx, "nombre_propietario", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Teléfono</Label>
                                <Input
                                  value={prop.telefono}
                                  onChange={(e) => updatePropietario(idx, "telefono", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Correo</Label>
                                <Input
                                  type="email"
                                  value={prop.correo}
                                  onChange={(e) => updatePropietario(idx, "correo", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Razón Social</Label>
                                <Input
                                  value={prop.razon_social}
                                  onChange={(e) => updatePropietario(idx, "razon_social", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>RTN</Label>
                                <Input
                                  value={prop.rtn}
                                  onChange={(e) => updatePropietario(idx, "rtn", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label>Cantidad de Vehículos</Label>
                                <Input
                                  type="number"
                                  value={prop.cantidad_vehiculos}
                                  onChange={(e) => updatePropietario(idx, "cantidad_vehiculos", parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="jefe" className="space-y-4">
                <h4 className="font-semibold">Información del Jefe de Flota</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jefe_nombre">Nombre *</Label>
                    <Input
                      id="jefe_nombre"
                      required
                      value={formData.jefe_flota?.nombre || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, nombre: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="jefe_telefono">Teléfono *</Label>
                    <Input
                      id="jefe_telefono"
                      required
                      value={formData.jefe_flota?.telefono || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, telefono: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="jefe_correo">Correo *</Label>
                    <Input
                      id="jefe_correo"
                      type="email"
                      required
                      value={formData.jefe_flota?.correo || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, correo: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="jefe_cargo">Cargo/Posición *</Label>
                    <Input
                      id="jefe_cargo"
                      required
                      value={formData.jefe_flota?.cargo_posicion || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, cargo_posicion: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="jefe_horarios">Horarios de Trabajo *</Label>
                    <Textarea
                      id="jefe_horarios"
                      required
                      value={formData.jefe_flota?.horarios_trabajo || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jefe_flota: { ...formData.jefe_flota!, horarios_trabajo: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comunicacion" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Departamentos de Comunicación</h4>
                  <Button type="button" size="sm" onClick={addDepartamento}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Departamento
                  </Button>
                </div>

                {formData.departamentos?.map((dept, deptIdx) => (
                  <Card key={deptIdx}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <Input
                          placeholder="Nombre del Departamento"
                          value={dept.nombre_departamento}
                          onChange={(e) => updateDepartamentoNombre(deptIdx, e.target.value)}
                          className="max-w-sm"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDepartamento(deptIdx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Separator />

                      <div>
                        <h5 className="font-medium mb-2">Comunicación Interna</h5>
                        {(["gerencia", "ventas", "produccion", "suministro"] as const).map((tipo) => (
                          <div key={tipo} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="capitalize">{tipo}</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addContacto(deptIdx, "interna", tipo)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            </div>
                            {dept.comunicacion_interna[tipo].map((contacto, contactoIdx) => (
                              <Card key={contactoIdx} className="p-4 mb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium">Contacto {contactoIdx + 1}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeContacto(deptIdx, "interna", tipo, contactoIdx)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Nombre"
                                    value={contacto.nombre}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "nombre", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Correo"
                                    value={contacto.correo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "correo", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Celular"
                                    value={contacto.celular}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "celular", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="WhatsApp"
                                    value={contacto.whatsapp}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "whatsapp", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Teléfono Fijo"
                                    value={contacto.telefono_fijo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "interna", tipo, contactoIdx, "telefono_fijo", e.target.value)
                                    }
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div>
                        <h5 className="font-medium mb-2">Comunicación Externa</h5>
                        {(["aseguradora", "arrendadora", "taller_externo"] as const).map((tipo) => (
                          <div key={tipo} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="capitalize">{tipo.replace("_", " ")}</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addContacto(deptIdx, "externa", tipo)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar
                              </Button>
                            </div>
                            {dept.comunicacion_externa[tipo].map((contacto, contactoIdx) => (
                              <Card key={contactoIdx} className="p-4 mb-2">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium">Contacto {contactoIdx + 1}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeContacto(deptIdx, "externa", tipo, contactoIdx)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Nombre"
                                    value={contacto.nombre}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "nombre", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Correo"
                                    value={contacto.correo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "correo", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Celular"
                                    value={contacto.celular}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "celular", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="WhatsApp"
                                    value={contacto.whatsapp}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "whatsapp", e.target.value)
                                    }
                                  />
                                  <Input
                                    placeholder="Teléfono Fijo"
                                    value={contacto.telefono_fijo}
                                    onChange={(e) =>
                                      updateContacto(deptIdx, "externa", tipo, contactoIdx, "telefono_fijo", e.target.value)
                                    }
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="bancarios" className="space-y-4">
                <h4 className="font-semibold">Datos Bancarios</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entidad_bancaria">Entidad Bancaria *</Label>
                    <Input
                      id="entidad_bancaria"
                      required
                      value={formData.datos_bancarios?.entidad_bancaria || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datos_bancarios: { ...formData.datos_bancarios!, entidad_bancaria: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cuenta_bancaria">Cuenta Bancaria *</Label>
                    <Input
                      id="cuenta_bancaria"
                      required
                      value={formData.datos_bancarios?.cuenta_bancaria || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datos_bancarios: { ...formData.datos_bancarios!, cuenta_bancaria: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo_cuenta">Tipo de Cuenta *</Label>
                    <Select
                      value={formData.datos_bancarios?.tipo_cuenta || ""}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          datos_bancarios: { ...formData.datos_bancarios!, tipo_cuenta: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ahorro">Ahorro</SelectItem>
                        <SelectItem value="corriente">Corriente</SelectItem>
                        <SelectItem value="nomina">Nómina</SelectItem>
                        <SelectItem value="empresarial">Empresarial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="moneda">Moneda *</Label>
                    <Select
                      value={formData.datos_bancarios?.moneda || "HNL"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          datos_bancarios: { ...formData.datos_bancarios!, moneda: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HNL">HNL - Lempira Hondureño</SelectItem>
                        <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                        <SelectItem value="GTQ">GTQ - Quetzal Guatemalteco</SelectItem>
                        <SelectItem value="NIO">NIO - Córdoba Nicaragüense</SelectItem>
                        <SelectItem value="CRC">CRC - Colón Costarricense</SelectItem>
                        <SelectItem value="PAB">PAB - Balboa Panameño</SelectItem>
                        <SelectItem value="CAD">CAD - Dólar Canadiense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="negociacion" className="space-y-4">
                <h4 className="font-semibold">Datos de Negociación</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
                    <Select
                      value={formData.datos_negociacion?.tipo_contrato || "propiedad"}
                      onValueChange={(value: "arrendamiento" | "propiedad" | "subcontratacion") =>
                        setFormData({
                          ...formData,
                          datos_negociacion: { ...formData.datos_negociacion!, tipo_contrato: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arrendamiento">Arrendamiento</SelectItem>
                        <SelectItem value="propiedad">Propiedad</SelectItem>
                        <SelectItem value="subcontratacion">Subcontratación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      required
                      value={formData.datos_negociacion?.fecha_inicio || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datos_negociacion: { ...formData.datos_negociacion!, fecha_inicio: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="duracion_contrato">Duración del Contrato *</Label>
                    <Input
                      id="duracion_contrato"
                      placeholder="Ej: 12 meses"
                      required
                      value={formData.datos_negociacion?.duracion_contrato || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          datos_negociacion: { ...formData.datos_negociacion!, duracion_contrato: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h5 className="font-medium mb-4">Condiciones de Negociación</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tarifa_precios">Tarifa de Precios</Label>
                      <Input
                        id="tarifa_precios"
                        type="number"
                        step="0.01"
                        value={formData.datos_negociacion?.tarifa_precios || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            datos_negociacion: { ...formData.datos_negociacion!, tarifa_precios: parseFloat(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="tarifa_descuento">Tarifa de Descuento (%)</Label>
                      <Input
                        id="tarifa_descuento"
                        type="number"
                        step="0.01"
                        value={formData.datos_negociacion?.tarifa_descuento || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            datos_negociacion: { ...formData.datos_negociacion!, tarifa_descuento: parseFloat(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="descuento_pronto_pago">Descuento de Pronto Pago (%)</Label>
                      <Input
                        id="descuento_pronto_pago"
                        type="number"
                        step="0.01"
                        value={formData.datos_negociacion?.descuento_pronto_pago || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            datos_negociacion: { ...formData.datos_negociacion!, descuento_pronto_pago: parseFloat(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="credito_autorizado_por">Crédito Autorizado Por</Label>
                      <Input
                        id="credito_autorizado_por"
                        value={formData.datos_negociacion?.credito_autorizado_por || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            datos_negociacion: { ...formData.datos_negociacion!, credito_autorizado_por: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="dias_credito_autorizado">Días de Crédito Autorizado</Label>
                      <Input
                        id="dias_credito_autorizado"
                        type="number"
                        value={formData.datos_negociacion?.dias_credito_autorizado || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            datos_negociacion: { ...formData.datos_negociacion!, dias_credito_autorizado: parseInt(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="porcentaje_cobro_mora">Porcentaje de Cobro por Mora (%)</Label>
                      <Input
                        id="porcentaje_cobro_mora"
                        type="number"
                        step="0.01"
                        value={formData.datos_negociacion?.porcentaje_cobro_mora || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            datos_negociacion: { ...formData.datos_negociacion!, porcentaje_cobro_mora: parseFloat(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h5 className="font-medium mb-4">Tarifas de Servicios</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {categoriasServicio.map((categoria) => {
                      const tarifa = formData.datos_negociacion?.tarifas_servicio.find(
                        t => t.categoria_servicio_id === categoria.id
                      );
                      return (
                        <div key={categoria.id}>
                          <Label>{categoria.nombre}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={tarifa?.tarifa || 0}
                            onChange={(e) => updateTarifaServicio(categoria.id, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="terminos" className="space-y-4">
                <h4 className="font-semibold">Términos y Políticas</h4>
                <p className="text-sm text-muted-foreground">
                  Suba archivos PDF para cada tipo de política
                </p>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="politicas_uso">Políticas de Uso de Vehículos</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="politicas_uso"
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, "politicas_uso_vehiculos")}
                      />
                      <Upload className="h-4 w-4" />
                    </div>
                    {formData.terminos_politicas?.politicas_uso_vehiculos?.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Archivo guardado {idx + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_uso_vehiculos", idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {politicasFiles.politicas_uso_vehiculos?.map((file, idx) => (
                      <div key={`pending-${idx}`} className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{file.name}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_uso_vehiculos", (formData.terminos_politicas?.politicas_uso_vehiculos?.length || 0) + idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="politicas_combustible">Políticas de Combustible</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="politicas_combustible"
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, "politicas_combustible")}
                      />
                      <Upload className="h-4 w-4" />
                    </div>
                    {formData.terminos_politicas?.politicas_combustible?.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Archivo guardado {idx + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_combustible", idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {politicasFiles.politicas_combustible?.map((file, idx) => (
                      <div key={`pending-${idx}`} className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{file.name}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_combustible", (formData.terminos_politicas?.politicas_combustible?.length || 0) + idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="seguros_covertura">Seguros y Cobertura</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="seguros_covertura"
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, "seguros_covertura")}
                      />
                      <Upload className="h-4 w-4" />
                    </div>
                    {formData.terminos_politicas?.seguros_covertura?.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Archivo guardado {idx + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("seguros_covertura", idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {politicasFiles.seguros_covertura?.map((file, idx) => (
                      <div key={`pending-${idx}`} className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{file.name}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("seguros_covertura", (formData.terminos_politicas?.seguros_covertura?.length || 0) + idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="politicas_renovacion">Políticas de Renovación de Vehículos</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="politicas_renovacion"
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, "politicas_renovacion")}
                      />
                      <Upload className="h-4 w-4" />
                    </div>
                    {formData.terminos_politicas?.politicas_renovacion?.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Archivo guardado {idx + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_renovacion", idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {politicasFiles.politicas_renovacion?.map((file, idx) => (
                      <div key={`pending-${idx}`} className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{file.name}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_renovacion", (formData.terminos_politicas?.politicas_renovacion?.length || 0) + idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="politicas_condiciones">Políticas de Condiciones de Uso</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="politicas_condiciones"
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, "politicas_condiciones_uso")}
                      />
                      <Upload className="h-4 w-4" />
                    </div>
                    {formData.terminos_politicas?.politicas_condiciones_uso?.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">Archivo guardado {idx + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_condiciones_uso", idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {politicasFiles.politicas_condiciones_uso?.map((file, idx) => (
                      <div key={`pending-${idx}`} className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{file.name}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("politicas_condiciones_uso", (formData.terminos_politicas?.politicas_condiciones_uso?.length || 0) + idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventario" className="space-y-4">
                <h4 className="font-semibold">Inventario de Unidades de la Flota</h4>
                <p className="text-sm text-muted-foreground">
                  Suba un archivo Excel con el inventario de vehículos. La estructura debe coincidir exactamente con las columnas requeridas.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="excel_vehiculos">Archivo Excel de Inventario</Label>
                    <Input
                      id="excel_vehiculos"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="mt-2"
                    />
                  </div>

                  {excelError && (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                      <p className="text-sm text-destructive font-medium">{excelError}</p>
                    </div>
                  )}

                  {excelVehiculos.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {excelVehiculos.length} vehículos cargados. Haga clic en "Guardar" para almacenar el inventario.
                      </p>
                      <div className="border rounded-lg overflow-auto max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Número</TableHead>
                              <TableHead>Marca y Modelo</TableHead>
                              <TableHead>Placa</TableHead>
                              <TableHead>VIN</TableHead>
                              <TableHead>Año</TableHead>
                              <TableHead>Kilometraje</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Último Mant.</TableHead>
                              <TableHead>Próximo Mant.</TableHead>
                              <TableHead>Hist. Reparaciones</TableHead>
                              <TableHead>Conductores</TableHead>
                              <TableHead>Perm. Explotación</TableHead>
                              <TableHead>F. Aut. Explotación</TableHead>
                              <TableHead>F. Venc. Explotación</TableHead>
                              <TableHead>Perm. Circulación</TableHead>
                              <TableHead>F. Aut. Circulación</TableHead>
                              <TableHead>F. Venc. Circulación</TableHead>
                              <TableHead>Perm. Publicidad</TableHead>
                              <TableHead>F. Aut. Publicidad</TableHead>
                              <TableHead>F. Venc. Publicidad</TableHead>
                              <TableHead>Perm. Especiales</TableHead>
                              <TableHead>F. Aut. Especiales</TableHead>
                              <TableHead>F. Venc. Especiales</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {excelVehiculos.map((vehiculo, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{vehiculo.numero_unidad}</TableCell>
                                <TableCell>{vehiculo.marca_modelo}</TableCell>
                                <TableCell>{vehiculo.numero_placa}</TableCell>
                                <TableCell>{vehiculo.numero_vin}</TableCell>
                                <TableCell>{vehiculo.anio_fabricacion}</TableCell>
                                <TableCell>{vehiculo.kilometraje_actual}</TableCell>
                                <TableCell>{vehiculo.estado_vehiculo}</TableCell>
                                <TableCell>{vehiculo.fecha_ultimo_mantenimiento}</TableCell>
                                <TableCell>{vehiculo.proximo_mantenimiento_programado}</TableCell>
                                <TableCell>{vehiculo.historial_reparaciones}</TableCell>
                                <TableCell>{vehiculo.conductores_asignados}</TableCell>
                                <TableCell>{vehiculo.permiso_explotacion_unidad}</TableCell>
                                <TableCell>{vehiculo.fecha_autorizacion_explotacion}</TableCell>
                                <TableCell>{vehiculo.fecha_vencimiento_explotacion}</TableCell>
                                <TableCell>{vehiculo.permiso_circulacion}</TableCell>
                                <TableCell>{vehiculo.fecha_autorizacion_circulacion}</TableCell>
                                <TableCell>{vehiculo.fecha_vencimiento_circulacion}</TableCell>
                                <TableCell>{vehiculo.permiso_publicidad}</TableCell>
                                <TableCell>{vehiculo.fecha_autorizacion_publicidad}</TableCell>
                                <TableCell>{vehiculo.fecha_vencimiento_publicidad}</TableCell>
                                <TableCell>{vehiculo.permisos_especiales}</TableCell>
                                <TableCell>{vehiculo.fecha_autorizacion_especiales}</TableCell>
                                <TableCell>{vehiculo.fecha_vencimiento_especiales}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded-lg">
                    <h5 className="font-medium mb-2">Estructura Requerida del Excel:</h5>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>1. numero de unidad</p>
                      <p>2. marca y modelo</p>
                      <p>3. numero de placa</p>
                      <p>4. numero de vin</p>
                      <p>5. ano de fabricacion</p>
                      <p>6. kilometraje actual</p>
                      <p>7. estado del vehiculo</p>
                      <p>8. fecha de ultimo mantenimiento</p>
                      <p>9. proximo mantenimiento programado</p>
                      <p>10. historial de reparaciones</p>
                      <p>11. conductores asignados</p>
                      <p>12. permiso de explotacion de unidad</p>
                      <p>13. fecha autorizacion de explotacion de unidad</p>
                      <p>14. fecha vencimiento de explotacion de unidad</p>
                      <p>15. permiso de circulacion</p>
                      <p>16. fecha autorizacion de circulacion</p>
                      <p>17. fecha vencimiento de circulacion</p>
                      <p>18. permiso de publicidad</p>
                      <p>19. fecha autorizacion de publicidad</p>
                      <p>20. fecha vencimiento de publicidad</p>
                      <p>21. permisos especiales</p>
                      <p>22. fecha autorizacion especiales</p>
                      <p>23. fecha vencimiento especiales</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="conductores" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Conductores de la Flota</h4>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addConductor}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Conductor
                  </Button>
                </div>

                {((formData.conductores && formData.conductores.length > 0) || tempConductores.length > 0) && (
                  <div className="border rounded-lg overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cédula</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Licencia</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.conductores?.map((conductor) => (
                          <TableRow key={conductor.id}>
                            <TableCell>{`${conductor.nombre} ${conductor.apellido}`}</TableCell>
                            <TableCell>{conductor.cedula_identidad}</TableCell>
                            <TableCell>{conductor.telefono}</TableCell>
                            <TableCell>{conductor.numero_licencia}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setConductorFormData(conductor);
                                    setEditingConductorId(conductor.id!);
                                    setConductorDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteConductor(conductor.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {tempConductores.map((conductor) => (
                          <TableRow key={conductor.id}>
                            <TableCell>
                              {`${conductor.nombre} ${conductor.apellido}`}
                              <Badge variant="outline" className="ml-2">Pendiente</Badge>
                            </TableCell>
                            <TableCell>{conductor.cedula_identidad}</TableCell>
                            <TableCell>{conductor.telefono}</TableCell>
                            <TableCell>{conductor.numero_licencia}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setConductorFormData(conductor);
                                    setEditingConductorId(conductor.id!);
                                    setConductorDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteConductor(conductor.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingId ? "Actualizar" : "Crear"} Flota</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={conductorDialogOpen} onOpenChange={setConductorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConductorId ? "Editar" : "Nuevo"} Conductor</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConductorSubmit}>
            <Tabs defaultValue="generales" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generales">Datos Generales</TabsTrigger>
                <TabsTrigger value="licencia">Licencia</TabsTrigger>
              </TabsList>

              <TabsContent value="generales" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      required
                      value={conductorFormData?.nombre || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Apellido *</Label>
                    <Input
                      required
                      value={conductorFormData?.apellido || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, apellido: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Cédula de Identidad *</Label>
                    <Input
                      required
                      value={conductorFormData?.cedula_identidad || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, cedula_identidad: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha de Nacimiento *</Label>
                    <Input
                      type="date"
                      required
                      value={conductorFormData?.fecha_nacimiento || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Dirección *</Label>
                    <Input
                      required
                      value={conductorFormData?.direccion || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, direccion: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Teléfono *</Label>
                    <Input
                      required
                      value={conductorFormData?.telefono || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Correo</Label>
                    <Input
                      type="email"
                      value={conductorFormData?.correo || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, correo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Estado Civil</Label>
                    <Select
                      value={conductorFormData?.estado_civil || ""}
                      onValueChange={(value) => setConductorFormData({ ...conductorFormData!, estado_civil: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero</SelectItem>
                        <SelectItem value="casado">Casado</SelectItem>
                        <SelectItem value="divorciado">Divorciado</SelectItem>
                        <SelectItem value="viudo">Viudo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contacto de Emergencia</Label>
                    <Input
                      value={conductorFormData?.contacto_emergencia_nombre || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, contacto_emergencia_nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Teléfono de Emergencia</Label>
                    <Input
                      value={conductorFormData?.contacto_emergencia_telefono || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, contacto_emergencia_telefono: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="licencia" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número de Licencia *</Label>
                    <Input
                      required
                      value={conductorFormData?.numero_licencia || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, numero_licencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Tipo de Licencia *</Label>
                    <Input
                      required
                      value={conductorFormData?.tipo_licencia || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, tipo_licencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha de Emisión *</Label>
                    <Input
                      type="date"
                      required
                      value={conductorFormData?.fecha_emision_licencia || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, fecha_emision_licencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha de Vencimiento *</Label>
                    <Input
                      type="date"
                      required
                      value={conductorFormData?.fecha_vencimiento_licencia || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, fecha_vencimiento_licencia: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Restricciones</Label>
                    <Textarea
                      value={conductorFormData?.restricciones_licencia || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, restricciones_licencia: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="desempeno" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha de Ingreso *</Label>
                    <Input
                      type="date"
                      required
                      value={conductorFormData?.fecha_ingreso || ""}
                      onChange={(e) => setConductorFormData({ ...conductorFormData!, fecha_ingreso: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setConductorDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingConductorId ? "Actualizar" : "Crear"} Conductor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalle de Flota Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Flota: {selectedFlota?.nombre_flota}</DialogTitle>
            <DialogDescription>
              Información completa de la flota {selectedFlota?.numero_flota}
            </DialogDescription>
          </DialogHeader>

          {selectedFlota && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="contactos">Contactos</TabsTrigger>
                <TabsTrigger value="financiero">Financiero</TabsTrigger>
                <TabsTrigger value="operativo">Operativo</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Número de Flota</p>
                      <p className="text-base font-semibold">{selectedFlota.numero_flota}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                      <p className="text-base">{selectedFlota.nombre_flota}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                      <Badge variant="outline">{selectedFlota.tipo_flota}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Badge variant={selectedFlota.estado === 'activa' ? 'default' : 'secondary'}>
                        {selectedFlota.estado}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
                      <p className="text-base">{selectedFlota.razon_social}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">RTN</p>
                      <p className="text-base">{selectedFlota.numero_rtn}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cantidad de Vehículos</p>
                      <p className="text-base font-semibold">{selectedFlota.cantidad_vehiculos}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rubro Empresa</p>
                      <p className="text-base">{selectedFlota.rubro_empresa}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                      <p className="text-base">{selectedFlota.direccion_fisica}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                      <p className="text-base">{selectedFlota.telefono_contacto}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Correo</p>
                      <p className="text-base">{selectedFlota.correo_contacto}</p>
                    </div>
                    {selectedFlota.sitio_web && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Sitio Web</p>
                        <a href={selectedFlota.sitio_web} target="_blank" rel="noopener noreferrer" className="text-base text-primary hover:underline">
                          {selectedFlota.sitio_web}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedFlota.propietarios && selectedFlota.propietarios.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Propietarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedFlota.propietarios.map((prop, idx) => (
                          <div key={idx} className="border-b pb-3 last:border-0">
                            <p className="font-semibold">{prop.nombre_propietario}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <p><span className="text-muted-foreground">RTN:</span> {prop.rtn}</p>
                              <p><span className="text-muted-foreground">Teléfono:</span> {prop.telefono}</p>
                              <p><span className="text-muted-foreground">Correo:</span> {prop.correo}</p>
                              <p><span className="text-muted-foreground">Vehículos:</span> {prop.cantidad_vehiculos}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="contactos" className="space-y-6">
                {selectedFlota.jefe_flota && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Jefe de Flota</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                        <p className="text-base font-semibold">{selectedFlota.jefe_flota.nombre}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cargo</p>
                        <p className="text-base">{selectedFlota.jefe_flota.cargo_posicion}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                        <p className="text-base">{selectedFlota.jefe_flota.telefono}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Correo</p>
                        <p className="text-base">{selectedFlota.jefe_flota.correo}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Horarios de Trabajo</p>
                        <p className="text-base">{selectedFlota.jefe_flota.horarios_trabajo}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedFlota.departamentos && selectedFlota.departamentos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Departamentos y Comunicación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {selectedFlota.departamentos.map((dept, idx) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <h4 className="font-semibold text-lg mb-4">{dept.nombre_departamento}</h4>
                            
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-medium text-sm text-muted-foreground mb-2">Comunicación Interna</h5>
                                {Object.entries(dept.comunicacion_interna).map(([tipo, contactos]) => 
                                  contactos.length > 0 && (
                                    <div key={tipo} className="ml-4 mb-2">
                                      <p className="text-sm font-medium capitalize">{tipo}</p>
                                      {contactos.map((c: any, cidx: number) => (
                                        <p key={cidx} className="text-sm text-muted-foreground">
                                          {c.nombre} - {c.telefono}
                                        </p>
                                      ))}
                                    </div>
                                  )
                                )}
                              </div>

                              <div>
                                <h5 className="font-medium text-sm text-muted-foreground mb-2">Comunicación Externa</h5>
                                {Object.entries(dept.comunicacion_externa).map(([tipo, contactos]) => 
                                  contactos.length > 0 && (
                                    <div key={tipo} className="ml-4 mb-2">
                                      <p className="text-sm font-medium capitalize">{tipo.replace('_', ' ')}</p>
                                      {contactos.map((c: any, cidx: number) => (
                                        <p key={cidx} className="text-sm text-muted-foreground">
                                          {c.nombre} - {c.telefono}
                                        </p>
                                      ))}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="financiero" className="space-y-6">
                {selectedFlota.datos_bancarios && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Datos Bancarios</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Entidad Bancaria</p>
                        <p className="text-base font-semibold">{selectedFlota.datos_bancarios.entidad_bancaria}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Cuenta</p>
                        <p className="text-base">{selectedFlota.datos_bancarios.cuenta_bancaria}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo de Cuenta</p>
                        <Badge>{selectedFlota.datos_bancarios.tipo_cuenta}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Moneda</p>
                        <Badge variant="outline">{selectedFlota.datos_bancarios.moneda}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedFlota.datos_negociacion && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Datos de Negociación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tipo de Contrato</p>
                          <Badge>{selectedFlota.datos_negociacion.tipo_contrato}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                          <p className="text-base">{new Date(selectedFlota.datos_negociacion.fecha_inicio).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Duración</p>
                          <p className="text-base">{selectedFlota.datos_negociacion.duracion_contrato}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Días de Crédito</p>
                          <p className="text-base font-semibold">{selectedFlota.datos_negociacion.dias_credito_autorizado} días</p>
                        </div>
                      </div>

                      {selectedFlota.datos_negociacion.tarifas_servicio && selectedFlota.datos_negociacion.tarifas_servicio.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Tarifas de Servicio</h5>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Servicio</TableHead>
                                  <TableHead className="text-right">Tarifa</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedFlota.datos_negociacion.tarifas_servicio.map((tarifa, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{tarifa.categoria_nombre}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                      ${tarifa.tarifa.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="operativo" className="space-y-6">
                {selectedFlota.vehiculos && selectedFlota.vehiculos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Vehículos ({selectedFlota.vehiculos.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Unidad</TableHead>
                              <TableHead>Marca/Modelo</TableHead>
                              <TableHead>Placa</TableHead>
                              <TableHead>VIN</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Kilometraje</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFlota.vehiculos.map((vehiculo: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{vehiculo.numero_unidad}</TableCell>
                                <TableCell>{vehiculo.marca_modelo}</TableCell>
                                <TableCell>{vehiculo.numero_placa}</TableCell>
                                <TableCell className="text-xs">{vehiculo.numero_vin}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{vehiculo.estado_vehiculo}</Badge>
                                </TableCell>
                                <TableCell>{vehiculo.kilometraje_actual.toLocaleString()} km</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedFlota.conductores && selectedFlota.conductores.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Conductores ({selectedFlota.conductores.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedFlota.conductores.map((conductor: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-base">
                                  {conductor.nombre} {conductor.apellido}
                                </p>
                                <p className="text-sm text-muted-foreground">Cédula: {conductor.cedula_identidad}</p>
                              </div>
                              <Badge variant="outline">{conductor.tipo_licencia}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Teléfono</p>
                                <p className="font-medium">{conductor.telefono}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Licencia</p>
                                <p className="font-medium">{conductor.numero_licencia}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Vence</p>
                                <p className="font-medium">{new Date(conductor.fecha_vencimiento_licencia).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
