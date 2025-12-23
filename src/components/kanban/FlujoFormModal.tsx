import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const flujoFormSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  color: z.string().min(1, "El color es requerido"),
  tiempo_estimado: z.number().min(0).default(0),
  unidad_tiempo: z.enum(["minutos", "horas"]),
  guardar_plantilla: z.boolean().default(false),
});

type FlujoFormValues = z.infer<typeof flujoFormSchema>;

interface FaseFlujo {
  id: string;
  fase_id: string;
  numero_orden: number;
  titulo: string;
  color: string;
  tiempo_estimado: number;
  unidad_tiempo: 'minutos' | 'horas';
  completado: boolean;
}

interface PlantillaFlujo {
  id: string;
  titulo: string;
  color: string;
  tiempo_estimado: number | null;
  unidad_tiempo: 'minutos' | 'horas' | null;
}

interface FlujoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flujo: FaseFlujo | null;
  faseId: string;
  nextNumeroOrden: number;
  tallerId: string;
  onSuccess: () => void;
}

const COLORES_PREDEFINIDOS = [
  "#10B981", // green
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export function FlujoFormModal({
  open,
  onOpenChange,
  flujo,
  faseId,
  nextNumeroOrden,
  tallerId,
  onSuccess,
}: FlujoFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [plantillas, setPlantillas] = useState<PlantillaFlujo[]>([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>("");

  const form = useForm<FlujoFormValues>({
    resolver: zodResolver(flujoFormSchema),
    defaultValues: {
      titulo: "",
      color: "#10B981",
      tiempo_estimado: 0,
      unidad_tiempo: "minutos",
      guardar_plantilla: false,
    },
  });

  useEffect(() => {
    if (open) {
      fetchPlantillas();
      setSelectedPlantilla("");
      if (flujo) {
        form.reset({
          titulo: flujo.titulo,
          color: flujo.color,
          tiempo_estimado: flujo.tiempo_estimado,
          unidad_tiempo: flujo.unidad_tiempo,
          guardar_plantilla: false,
        });
      } else {
        form.reset({
          titulo: "",
          color: COLORES_PREDEFINIDOS[nextNumeroOrden % COLORES_PREDEFINIDOS.length],
          tiempo_estimado: 0,
          unidad_tiempo: "minutos",
          guardar_plantilla: false,
        });
      }
    }
  }, [open, flujo, nextNumeroOrden]);

  const fetchPlantillas = async () => {
    try {
      const { data, error } = await supabase
        .from("plantillas_flujos")
        .select("id, titulo, color, tiempo_estimado, unidad_tiempo")
        .eq("taller_id", tallerId)
        .order("titulo");

      if (error) throw error;
      setPlantillas(data || []);
    } catch (error) {
      console.error("Error fetching plantillas:", error);
    }
  };

  const handlePlantillaSelect = (plantillaId: string) => {
    if (plantillaId === "__none__") {
      setSelectedPlantilla("");
      return;
    }
    
    const plantilla = plantillas.find(p => p.id === plantillaId);
    if (plantilla) {
      setSelectedPlantilla(plantillaId);
      form.setValue("titulo", plantilla.titulo);
      form.setValue("color", plantilla.color);
      form.setValue("tiempo_estimado", plantilla.tiempo_estimado || 0);
      form.setValue("unidad_tiempo", plantilla.unidad_tiempo || "minutos");
    }
  };

  const onSubmit = async (values: FlujoFormValues) => {
    setLoading(true);
    try {
      // Save as template if checkbox is checked
      if (values.guardar_plantilla && !flujo) {
        const { error: templateError } = await supabase.from("plantillas_flujos").insert({
          taller_id: tallerId,
          titulo: values.titulo,
          color: values.color,
          tiempo_estimado: values.tiempo_estimado,
          unidad_tiempo: values.unidad_tiempo,
        });

        if (templateError) {
          console.error("Error saving template:", templateError);
          toast.error("Error al guardar la plantilla");
        } else {
          toast.success("Plantilla guardada");
        }
      }

      if (flujo) {
        const { error } = await supabase
          .from("fase_flujos")
          .update({
            titulo: values.titulo,
            color: values.color,
            tiempo_estimado: values.tiempo_estimado,
            unidad_tiempo: values.unidad_tiempo,
          })
          .eq("id", flujo.id);

        if (error) throw error;
        toast.success("Flujo actualizado exitosamente");
      } else {
        const { error } = await supabase.from("fase_flujos").insert({
          fase_id: faseId,
          numero_orden: nextNumeroOrden,
          titulo: values.titulo,
          color: values.color,
          tiempo_estimado: values.tiempo_estimado,
          unidad_tiempo: values.unidad_tiempo,
          completado: false,
        });

        if (error) throw error;
        toast.success("Flujo creado exitosamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving flujo:", error);
      toast.error(error.message || "Error al guardar el flujo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {flujo ? "Editar Flujo" : "Nuevo Flujo"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">Flujo N°</span>
              <span className="font-bold">{flujo ? flujo.numero_orden : nextNumeroOrden}</span>
            </div>

            {!flujo && plantillas.length > 0 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Usar Plantilla
                  </label>
                  <Select value={selectedPlantilla || "__none__"} onValueChange={handlePlantillaSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin plantilla</SelectItem>
                      {plantillas.map((plantilla) => (
                        <SelectItem key={plantilla.id} value={plantilla.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: plantilla.color }}
                            />
                            {plantilla.titulo}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
              </>
            )}

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Flujo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Verificar componentes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-md border"
                      style={{ backgroundColor: field.value }}
                    />
                    <div className="flex gap-1 flex-wrap">
                      {COLORES_PREDEFINIDOS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-md border-2 ${field.value === color ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => form.setValue("color", color)}
                        />
                      ))}
                    </div>
                    <Input 
                      type="color" 
                      value={field.value}
                      onChange={(e) => form.setValue("color", e.target.value)}
                      className="w-10 h-8 p-0 border-0"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tiempo_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo Estimado</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidad_tiempo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minutos">Minutos</SelectItem>
                        <SelectItem value="horas">Horas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!flujo && (
              <FormField
                control={form.control}
                name="guardar_plantilla"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Guardar como plantilla
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Este flujo estará disponible para usarlo en otras fases
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {flujo ? "Guardar Cambios" : "Crear Flujo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}