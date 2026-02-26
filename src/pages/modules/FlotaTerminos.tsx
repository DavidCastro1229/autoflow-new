import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Scale, Loader2, Upload, FileText, Trash2, Download, Eye, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PolicyKey = "politicas_uso_vehiculos" | "politicas_combustible" | "seguros_covertura" | "politicas_renovacion" | "politicas_condiciones_uso";

const SECTIONS: { key: PolicyKey; label: string; description: string }[] = [
  { key: "politicas_uso_vehiculos", label: "Uso de Vehículos", description: "PDFs con reglas para el uso de vehículos" },
  { key: "politicas_combustible", label: "Combustible", description: "PDFs con políticas de combustible" },
  { key: "seguros_covertura", label: "Seguros y Cobertura", description: "PDFs de información sobre seguros" },
  { key: "politicas_renovacion", label: "Renovación", description: "PDFs con políticas de renovación" },
  { key: "politicas_condiciones_uso", label: "Condiciones de Uso", description: "PDFs con condiciones generales" },
];

export default function FlotaTerminos() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<PolicyKey, boolean>>({
    politicas_uso_vehiculos: false,
    politicas_combustible: false,
    seguros_covertura: false,
    politicas_renovacion: false,
    politicas_condiciones_uso: false,
  });
  const [data, setData] = useState<Record<PolicyKey, string[]>>({
    politicas_uso_vehiculos: [],
    politicas_combustible: [],
    seguros_covertura: [],
    politicas_renovacion: [],
    politicas_condiciones_uso: [],
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const fileInputRefs = useRef<Record<PolicyKey, HTMLInputElement | null>>({
    politicas_uso_vehiculos: null,
    politicas_combustible: null,
    seguros_covertura: null,
    politicas_renovacion: null,
    politicas_condiciones_uso: null,
  });

  useEffect(() => {
    if (flotaId) fetchData();
  }, [flotaId]);

  const fetchData = async () => {
    try {
      const { data: res, error } = await supabase
        .from("flota_terminos_politicas")
        .select("*")
        .eq("flota_id", flotaId)
        .maybeSingle();
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

  const getFileName = (path: string) => {
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1]);
  };

  const handleUpload = async (key: PolicyKey, files: FileList | null) => {
    if (!files || !flotaId) return;
    setUploading(p => ({ ...p, [key]: true }));

    try {
      const newPaths: string[] = [];
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") {
          toast({ title: "Error", description: `"${file.name}" no es un PDF`, variant: "destructive" });
          continue;
        }
        const filePath = `${flotaId}/${key}/${Date.now()}_${encodeURIComponent(file.name)}`;
        const { error } = await supabase.storage.from("flota-politicas").upload(filePath, file);
        if (error) throw error;
        newPaths.push(filePath);
      }

      const updatedPaths = [...data[key], ...newPaths];
      setData(p => ({ ...p, [key]: updatedPaths }));

      // Save to DB
      await saveToDb({ ...data, [key]: updatedPaths });
      toast({ title: "Subido", description: `${newPaths.length} archivo(s) subido(s)` });
    } catch (error: any) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
    } finally {
      setUploading(p => ({ ...p, [key]: false }));
      if (fileInputRefs.current[key]) fileInputRefs.current[key]!.value = "";
    }
  };

  const handleDelete = async (key: PolicyKey, idx: number) => {
    const path = data[key][idx];
    try {
      await supabase.storage.from("flota-politicas").remove([path]);
      const updatedPaths = data[key].filter((_, i) => i !== idx);
      setData(p => ({ ...p, [key]: updatedPaths }));
      await saveToDb({ ...data, [key]: updatedPaths });
      toast({ title: "Eliminado", description: "Archivo eliminado" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDownload = async (path: string) => {
    const { data: blob, error } = await supabase.storage.from("flota-politicas").download(path);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName(path);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = async (path: string) => {
    const { data: blob, error } = await supabase.storage.from("flota-politicas").download(path);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewName(getFileName(path));
  };

  const saveToDb = async (newData: Record<PolicyKey, string[]>) => {
    if (!flotaId) return;
    await supabase.from("flota_terminos_politicas").delete().eq("flota_id", flotaId);
    const { error } = await supabase.from("flota_terminos_politicas").insert([{ flota_id: flotaId, ...newData }]);
    if (error) throw error;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Scale className="h-8 w-8 text-primary" />Términos y Políticas</h1>
          <p className="text-muted-foreground mt-1">Gestión de documentos PDF de políticas de la flota</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SECTIONS.map(({ key, label, description }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base">{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  ref={el => { fileInputRefs.current[key] = el; }}
                  onChange={e => handleUpload(key, e.target.files)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRefs.current[key]?.click()}
                  disabled={uploading[key]}
                >
                  {uploading[key] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Subir PDF
                </Button>
              </div>

              <div className="space-y-2">
                {data[key].map((path, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-md border p-2 bg-muted/30">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate flex-1">{getFileName(path)}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePreview(path)} title="Previsualizar">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(path)} title="Descargar">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(key, idx)} title="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {data[key].length === 0 && <span className="text-sm text-muted-foreground">Sin documentos</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={open => { if (!open) { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {previewUrl && (
              <iframe src={previewUrl} className="w-full h-full rounded-md border" title="Vista previa PDF" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
