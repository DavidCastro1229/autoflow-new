import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Save, Loader2 } from "lucide-react";

const CARGOS_JEFE = [
  "Gerente de Flota",
  "Director de Operaciones",
  "Jefe de Logística",
  "Coordinador de Transporte",
  "Supervisor de Flota",
  "Administrador de Flota",
  "Director de Transporte",
  "Jefe de Mantenimiento",
  "Gerente de Logística",
  "Encargado de Flota",
];

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return [`${h}:00`, `${h}:30`];
}).flat();

export default function FlotaJefe() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cargoMode, setCargoMode] = useState<"select" | "custom">("select");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("17:00");
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    cargo_posicion: "",
    horarios_trabajo: "",
  });

  useEffect(() => {
    if (flotaId) fetchJefe();
  }, [flotaId]);

  const fetchJefe = async () => {
    try {
      const { data, error } = await supabase
        .from("flota_jefe")
        .select("*")
        .eq("flota_id", flotaId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFormData({
          nombre: data.nombre,
          telefono: data.telefono,
          correo: data.correo,
          cargo_posicion: data.cargo_posicion,
          horarios_trabajo: data.horarios_trabajo,
        });
        // Determine cargo mode
        if (CARGOS_JEFE.includes(data.cargo_posicion)) {
          setCargoMode("select");
        } else {
          setCargoMode("custom");
        }
        // Parse horarios
        const match = data.horarios_trabajo?.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
        if (match) {
          setHoraInicio(match[1]);
          setHoraFin(match[2]);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!flotaId) return;
    setSaving(true);
    const horarios_trabajo = `${horaInicio} - ${horaFin}`;
    try {
      await supabase.from("flota_jefe").delete().eq("flota_id", flotaId);
      const { error } = await supabase.from("flota_jefe").insert([{
        flota_id: flotaId,
        ...formData,
        horarios_trabajo,
      }]);
      if (error) throw error;
      toast({ title: "Guardado", description: "Datos del jefe actualizados" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCircle className="h-8 w-8 text-primary" />
            Jefe de Flota
          </h1>
          <p className="text-muted-foreground mt-1">Información del responsable de la flota</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del Jefe de Flota</CardTitle>
          <CardDescription>Responsable principal de la operación de la flota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input value={formData.nombre} onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Cargo / Posición</Label>
            <div className="flex gap-2">
              <Select
                value={cargoMode === "select" && CARGOS_JEFE.includes(formData.cargo_posicion) ? formData.cargo_posicion : "__custom__"}
                onValueChange={(v) => {
                  if (v === "__custom__") {
                    setCargoMode("custom");
                    setFormData(p => ({ ...p, cargo_posicion: "" }));
                  } else {
                    setCargoMode("select");
                    setFormData(p => ({ ...p, cargo_posicion: v }));
                  }
                }}
              >
                <SelectTrigger className={cargoMode === "custom" ? "w-[200px]" : "w-full"}>
                  <SelectValue placeholder="Seleccionar cargo" />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS_JEFE.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">✏️ Ingresar manualmente</SelectItem>
                </SelectContent>
              </Select>
              {cargoMode === "custom" && (
                <Input
                  className="flex-1"
                  placeholder="Escribir cargo..."
                  value={formData.cargo_posicion}
                  onChange={(e) => setFormData(p => ({ ...p, cargo_posicion: e.target.value }))}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={formData.telefono} onChange={(e) => setFormData(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input value={formData.correo} onChange={(e) => setFormData(p => ({ ...p, correo: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Horarios de Trabajo</Label>
            <div className="flex items-center gap-3">
              <Select value={horaInicio} onValueChange={setHoraInicio}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORAS.map((hr) => (
                    <SelectItem key={hr} value={hr}>{hr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground font-medium">a</span>
              <Select value={horaFin} onValueChange={setHoraFin}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORAS.map((hr) => (
                    <SelectItem key={hr} value={hr}>{hr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
