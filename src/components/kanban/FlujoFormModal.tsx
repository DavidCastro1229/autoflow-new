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
import { Loader2 } from "lucide-react";

const flujoFormSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  color: z.string().min(1, "El color es requerido"),
  tiempo_estimado: z.number().min(0).default(0),
  unidad_tiempo: z.enum(["minutos", "horas"]),
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

interface FlujoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flujo: FaseFlujo | null;
  faseId: string;
  nextNumeroOrden: number;
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
  onSuccess,
}: FlujoFormModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FlujoFormValues>({
    resolver: zodResolver(flujoFormSchema),
    defaultValues: {
      titulo: "",
      color: "#10B981",
      tiempo_estimado: 0,
      unidad_tiempo: "minutos",
    },
  });

  useEffect(() => {
    if (open) {
      if (flujo) {
        form.reset({
          titulo: flujo.titulo,
          color: flujo.color,
          tiempo_estimado: flujo.tiempo_estimado,
          unidad_tiempo: flujo.unidad_tiempo,
        });
      } else {
        form.reset({
          titulo: "",
          color: COLORES_PREDEFINIDOS[nextNumeroOrden % COLORES_PREDEFINIDOS.length],
          tiempo_estimado: 0,
          unidad_tiempo: "minutos",
        });
      }
    }
  }, [open, flujo, nextNumeroOrden]);

  const onSubmit = async (values: FlujoFormValues) => {
    setLoading(true);
    try {
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
      <DialogContent className="max-w-md">
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
