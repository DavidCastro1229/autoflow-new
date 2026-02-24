import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Loader2 } from "lucide-react";

export default function FlotaNegociacion() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tipo_contrato: "propiedad" as string,
    fecha_inicio: new Date().toISOString().split("T")[0],
    duracion_contrato: "",
    tarifa_precios: 0,
    tarifa_descuento: 0,
    descuento_pronto_pago: 0,
    credito_autorizado_por: "",
    dias_credito_autorizado: 0,
    porcentaje_cobro_mora: 0,
  });

  useEffect(() => {
    if (flotaId) fetchData();
  }, [flotaId]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.from("flota_datos_negociacion").select("*").eq("flota_id", flotaId).maybeSingle();
      if (error) throw error;
      if (data) {
        setFormData({
          tipo_contrato: data.tipo_contrato,
          fecha_inicio: data.fecha_inicio,
          duracion_contrato: data.duracion_contrato,
          tarifa_precios: data.tarifa_precios || 0,
          tarifa_descuento: data.tarifa_descuento || 0,
          descuento_pronto_pago: data.descuento_pronto_pago || 0,
          credito_autorizado_por: data.credito_autorizado_por || "",
          dias_credito_autorizado: data.dias_credito_autorizado || 0,
          porcentaje_cobro_mora: data.porcentaje_cobro_mora || 0,
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
      await supabase.from("flota_datos_negociacion").delete().eq("flota_id", flotaId);
      const { error } = await supabase.from("flota_datos_negociacion").insert([{ flota_id: flotaId, ...formData, tipo_contrato: formData.tipo_contrato as "arrendamiento" | "propiedad" | "subcontratacion" }]);
      if (error) throw error;
      toast({ title: "Guardado", description: "Datos de negociación actualizados" });
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
          <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary" />Negociación</h1>
          <p className="text-muted-foreground mt-1">Términos comerciales y tarifas</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Contrato</CardTitle><CardDescription>Tipo y duración del contrato</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Select value={formData.tipo_contrato} onValueChange={(v) => setFormData(p => ({ ...p, tipo_contrato: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrendamiento">Arrendamiento</SelectItem>
                  <SelectItem value="propiedad">Propiedad</SelectItem>
                  <SelectItem value="subcontratacion">Subcontratación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fecha de Inicio</Label><Input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData(p => ({ ...p, fecha_inicio: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Duración del Contrato</Label><Input value={formData.duracion_contrato} onChange={(e) => setFormData(p => ({ ...p, duracion_contrato: e.target.value }))} placeholder="Ej: 12 meses" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tarifas y Crédito</CardTitle><CardDescription>Condiciones financieras</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tarifa Precios</Label><Input type="number" value={formData.tarifa_precios} onChange={(e) => setFormData(p => ({ ...p, tarifa_precios: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Tarifa Descuento (%)</Label><Input type="number" value={formData.tarifa_descuento} onChange={(e) => setFormData(p => ({ ...p, tarifa_descuento: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="space-y-2"><Label>Descuento Pronto Pago (%)</Label><Input type="number" value={formData.descuento_pronto_pago} onChange={(e) => setFormData(p => ({ ...p, descuento_pronto_pago: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>Crédito Autorizado Por</Label><Input value={formData.credito_autorizado_por} onChange={(e) => setFormData(p => ({ ...p, credito_autorizado_por: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Días Crédito</Label><Input type="number" value={formData.dias_credito_autorizado} onChange={(e) => setFormData(p => ({ ...p, dias_credito_autorizado: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Mora (%)</Label><Input type="number" value={formData.porcentaje_cobro_mora} onChange={(e) => setFormData(p => ({ ...p, porcentaje_cobro_mora: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
