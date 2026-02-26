import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Loader2, Clock } from "lucide-react";
import { PAISES_AMERICA } from "@/lib/countries";
import HorariosAtencionSelector, {
  type HorariosMap,
  parseHorarios,
  stringifyHorarios,
} from "@/components/flotas/HorariosAtencionSelector";

export default function FlotaDatosGenerales() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horarios, setHorarios] = useState<HorariosMap>(() => parseHorarios(null));
  const [formData, setFormData] = useState({
    nombre_flota: "",
    razon_social: "",
    numero_rtn: "",
    tipo_flota: "propia",
    rubro_empresa: "",
    cantidad_vehiculos: 0,
    categoria_vehiculos: [] as string[],
    estado_flota: "activa",
    direccion_fisica: "",
    telefono_contacto: "",
    correo_contacto: "",
    sitio_web: "",
    direccion_google_maps: "",
    direccion_escrita: "",
    direccion_parqueo: "",
    direccion_google_maps_parqueo: "",
    nombre_contacto: "",
    apellido_contacto: "",
    ciudad: "",
    pais: "",
    codigo_postal: "",
  });

  useEffect(() => {
    if (flotaId) fetchFlota();
  }, [flotaId]);

  const fetchFlota = async () => {
    try {
      const { data, error } = await supabase
        .from("flotas")
        .select("*")
        .eq("id", flotaId)
        .single();
      if (error) throw error;
      if (data) {
        setFormData({
          nombre_flota: data.nombre_flota || "",
          razon_social: data.razon_social || "",
          numero_rtn: data.numero_rtn || "",
          tipo_flota: data.tipo_flota || "propia",
          rubro_empresa: data.rubro_empresa || "",
          cantidad_vehiculos: data.cantidad_vehiculos || 0,
          categoria_vehiculos: data.categoria_vehiculos || [],
          estado_flota: data.estado || "activa",
          direccion_fisica: data.direccion_fisica || "",
          telefono_contacto: data.telefono_contacto || "",
          correo_contacto: data.correo_contacto || "",
          sitio_web: data.sitio_web || "",
          direccion_google_maps: data.direccion_google_maps || "",
          direccion_escrita: data.direccion_escrita || "",
          direccion_parqueo: data.direccion_parqueo || "",
          direccion_google_maps_parqueo: data.direccion_google_maps_parqueo || "",
          nombre_contacto: (data as any).nombre_contacto || "",
          apellido_contacto: (data as any).apellido_contacto || "",
          ciudad: (data as any).ciudad || "",
          pais: (data as any).pais || "",
          codigo_postal: (data as any).codigo_postal || "",
        });
        setHorarios(parseHorarios(data.horarios_atencion));
      }
    } catch (error) {
      console.error("Error fetching flota:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!flotaId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("flotas")
        .update({
          nombre_flota: formData.nombre_flota,
          razon_social: formData.razon_social,
          numero_rtn: formData.numero_rtn,
          tipo_flota: formData.tipo_flota as "propia" | "alquilada" | "mixta",
          rubro_empresa: formData.rubro_empresa,
          cantidad_vehiculos: formData.cantidad_vehiculos,
          categoria_vehiculos: formData.categoria_vehiculos,
          direccion_fisica: formData.direccion_fisica,
          telefono_contacto: formData.telefono_contacto,
          correo_contacto: formData.correo_contacto,
          sitio_web: formData.sitio_web,
          direccion_google_maps: formData.direccion_google_maps,
          direccion_escrita: formData.direccion_escrita,
          direccion_parqueo: formData.direccion_parqueo,
          direccion_google_maps_parqueo: formData.direccion_google_maps_parqueo,
          horarios_atencion: stringifyHorarios(horarios),
          pais: formData.pais,
        } as any)
        .eq("id", flotaId);
      if (error) throw error;
      toast({ title: "Guardado", description: "Datos generales actualizados correctamente" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Datos Generales
          </h1>
          <p className="text-muted-foreground mt-1">Información general de tu flota</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Empresa</CardTitle>
            <CardDescription>Datos básicos de la flota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Flota</Label>
              <Input value={formData.nombre_flota} onChange={(e) => setFormData(p => ({ ...p, nombre_flota: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Razón Social</Label>
              <Input value={formData.razon_social} onChange={(e) => setFormData(p => ({ ...p, razon_social: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>RTN</Label>
              <Input value={formData.numero_rtn} onChange={(e) => setFormData(p => ({ ...p, numero_rtn: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Rubro de la Empresa</Label>
              <Input value={formData.rubro_empresa} onChange={(e) => setFormData(p => ({ ...p, rubro_empresa: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Flota</Label>
              <Select value={formData.tipo_flota} onValueChange={(v) => setFormData(p => ({ ...p, tipo_flota: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="propia">Propia</SelectItem>
                  <SelectItem value="alquilada">Alquilada</SelectItem>
                  <SelectItem value="mixta">Mixta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad de Vehículos</Label>
              <Input type="number" value={formData.cantidad_vehiculos} onChange={(e) => setFormData(p => ({ ...p, cantidad_vehiculos: parseInt(e.target.value) || 0 }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación y Contacto</CardTitle>
            <CardDescription>Datos de dirección y comunicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dirección Física</Label>
              <Input value={formData.direccion_fisica} onChange={(e) => setFormData(p => ({ ...p, direccion_fisica: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input value={formData.ciudad} onChange={(e) => setFormData(p => ({ ...p, ciudad: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={formData.pais} onValueChange={(v) => setFormData(p => ({ ...p, pais: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {PAISES_AMERICA.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Código Postal</Label>
              <Input value={formData.codigo_postal} onChange={(e) => setFormData(p => ({ ...p, codigo_postal: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono de Contacto</Label>
              <Input value={formData.telefono_contacto} onChange={(e) => setFormData(p => ({ ...p, telefono_contacto: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Correo de Contacto</Label>
              <Input value={formData.correo_contacto} onChange={(e) => setFormData(p => ({ ...p, correo_contacto: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sitio Web</Label>
              <Input value={formData.sitio_web || ""} onChange={(e) => setFormData(p => ({ ...p, sitio_web: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horarios de Atención
          </CardTitle>
          <CardDescription>Configura los horarios de atención de tu flota</CardDescription>
        </CardHeader>
        <CardContent>
          <HorariosAtencionSelector value={horarios} onChange={setHorarios} />
        </CardContent>
      </Card>
    </div>
  );
}
