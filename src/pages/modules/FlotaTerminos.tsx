import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Scale, Save, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PolicyKey = "politicas_uso_vehiculos" | "politicas_combustible" | "seguros_covertura" | "politicas_renovacion" | "politicas_condiciones_uso";

const SECTIONS: { key: PolicyKey; label: string; description: string }[] = [
  { key: "politicas_uso_vehiculos", label: "Uso de Vehículos", description: "Reglas para el uso de vehículos" },
  { key: "politicas_combustible", label: "Combustible", description: "Políticas de combustible" },
  { key: "seguros_covertura", label: "Seguros y Cobertura", description: "Información sobre seguros" },
  { key: "politicas_renovacion", label: "Renovación", description: "Políticas de renovación" },
  { key: "politicas_condiciones_uso", label: "Condiciones de Uso", description: "Condiciones generales" },
];

export default function FlotaTerminos() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Record<PolicyKey, string[]>>({
    politicas_uso_vehiculos: [],
    politicas_combustible: [],
    seguros_covertura: [],
    politicas_renovacion: [],
    politicas_condiciones_uso: [],
  });
  const [inputs, setInputs] = useState<Record<PolicyKey, string>>({
    politicas_uso_vehiculos: "",
    politicas_combustible: "",
    seguros_covertura: "",
    politicas_renovacion: "",
    politicas_condiciones_uso: "",
  });

  useEffect(() => {
    if (flotaId) fetchData();
  }, [flotaId]);

  const fetchData = async () => {
    try {
      const { data: res, error } = await supabase.from("flota_terminos_politicas").select("*").eq("flota_id", flotaId).maybeSingle();
      if (error) throw error;
      if (res) {
        setData({
          politicas_uso_vehiculos: res.politicas_uso_vehiculos || [],
          politicas_combustible: res.politicas_combustible || [],
          seguros_covertura: res.seguros_covertura || [],
          politicas_renovacion: res.politicas_renovacion || [],
          politicas_condiciones_uso: res.politicas_condiciones_uso || [],
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (key: PolicyKey) => {
    const val = inputs[key].trim();
    if (!val) return;
    setData(p => ({ ...p, [key]: [...p[key], val] }));
    setInputs(p => ({ ...p, [key]: "" }));
  };

  const removeItem = (key: PolicyKey, idx: number) => {
    setData(p => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!flotaId) return;
    setSaving(true);
    try {
      await supabase.from("flota_terminos_politicas").delete().eq("flota_id", flotaId);
      const { error } = await supabase.from("flota_terminos_politicas").insert([{ flota_id: flotaId, ...data }]);
      if (error) throw error;
      toast({ title: "Guardado", description: "Términos y políticas actualizados" });
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
          <h1 className="text-3xl font-bold flex items-center gap-2"><Scale className="h-8 w-8 text-primary" />Términos y Políticas</h1>
          <p className="text-muted-foreground mt-1">Gestión de políticas de la flota</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map(({ key, label, description }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar política..."
                  value={inputs[key]}
                  onChange={(e) => setInputs(p => ({ ...p, [key]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addItem(key)}
                />
                <Button size="icon" variant="outline" onClick={() => addItem(key)}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data[key].map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                    {item}
                    <button onClick={() => removeItem(key, idx)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                {data[key].length === 0 && <span className="text-sm text-muted-foreground">Sin políticas definidas</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
