import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Save, Loader2 } from "lucide-react";

export default function FlotaDatosBancarios() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    entidad_bancaria: "",
    cuenta_bancaria: "",
    tipo_cuenta: "corriente",
    moneda: "HNL",
  });

  useEffect(() => {
    if (flotaId) fetchData();
  }, [flotaId]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("flota_datos_bancarios")
        .select("*")
        .eq("flota_id", flotaId)
        .maybeSingle();
      if (error) throw error;
      if (data) setFormData({ entidad_bancaria: data.entidad_bancaria, cuenta_bancaria: data.cuenta_bancaria, tipo_cuenta: data.tipo_cuenta, moneda: data.moneda });
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
      await supabase.from("flota_datos_bancarios").delete().eq("flota_id", flotaId);
      const { error } = await supabase.from("flota_datos_bancarios").insert([{ flota_id: flotaId, ...formData }]);
      if (error) throw error;
      toast({ title: "Guardado", description: "Datos bancarios actualizados" });
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
          <h1 className="text-3xl font-bold flex items-center gap-2"><CreditCard className="h-8 w-8 text-primary" />Datos Bancarios</h1>
          <p className="text-muted-foreground mt-1">Información bancaria de la flota</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Cuenta Bancaria</CardTitle>
          <CardDescription>Datos para pagos y facturación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Entidad Bancaria</Label><Input value={formData.entidad_bancaria} onChange={(e) => setFormData(p => ({ ...p, entidad_bancaria: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Número de Cuenta</Label><Input value={formData.cuenta_bancaria} onChange={(e) => setFormData(p => ({ ...p, cuenta_bancaria: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Cuenta</Label>
              <Select value={formData.tipo_cuenta} onValueChange={(v) => setFormData(p => ({ ...p, tipo_cuenta: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corriente">Corriente</SelectItem>
                  <SelectItem value="ahorro">Ahorro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={formData.moneda} onValueChange={(v) => setFormData(p => ({ ...p, moneda: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HNL">HNL - Lempiras</SelectItem>
                  <SelectItem value="USD">USD - Dólares</SelectItem>
                  <SelectItem value="EUR">EUR - Euros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
