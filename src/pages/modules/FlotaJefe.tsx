import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Save, Loader2 } from "lucide-react";

export default function FlotaJefe() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    try {
      // Delete existing and insert new
      await supabase.from("flota_jefe").delete().eq("flota_id", flotaId);
      const { error } = await supabase.from("flota_jefe").insert([{ flota_id: flotaId, ...formData }]);
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
            <Input value={formData.cargo_posicion} onChange={(e) => setFormData(p => ({ ...p, cargo_posicion: e.target.value }))} />
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
            <Input value={formData.horarios_trabajo} onChange={(e) => setFormData(p => ({ ...p, horarios_trabajo: e.target.value }))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
