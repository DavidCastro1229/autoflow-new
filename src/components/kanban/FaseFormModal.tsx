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

const faseFormSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  color: z.string().min(1, "El color es requerido"),
  tiempo_estimado: z.number().min(0).default(0),
  unidad_tiempo: z.enum(["minutos", "horas"]),
  equipo_id: z.string().optional(),
  tecnico_id: z.string().optional(),
  guardar_plantilla: z.boolean().default(false),
});

type FaseFormValues = z.infer<typeof faseFormSchema>;

interface TareaFase {
  id: string;
  tarea_id: string;
  numero_orden: number;
  titulo: string;
  color: string;
  tiempo_estimado: number;
  unidad_tiempo: 'minutos' | 'horas';
  equipo_id: string | null;
  tecnico_id: string | null;
}

interface PlantillaFase {
  id: string;
  titulo: string;
  color: string;
  tiempo_estimado: number | null;
  unidad_tiempo: 'minutos' | 'horas' | null;
}

interface EquipoMember {
  id: string;
  nombre: string;
  apellido: string;
}

interface Tecnico {
  id: string;
  nombre: string;
  apellido: string;
}

interface FaseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fase: TareaFase | null;
  tareaId: string;
  tipoTarea: 'administrativa' | 'operativa';
  nextNumeroOrden: number;
  tallerId: string;
  onSuccess: () => void;
}

const COLORES_PREDEFINIDOS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export function FaseFormModal({
  open,
  onOpenChange,
  fase,
  tareaId,
  tipoTarea,
  nextNumeroOrden,
  tallerId,
  onSuccess,
}: FaseFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [equipoMembers, setEquipoMembers] = useState<EquipoMember[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaFase[]>([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState<string>("");

  const form = useForm<FaseFormValues>({
    resolver: zodResolver(faseFormSchema),
    defaultValues: {
      titulo: "",
      color: "#3B82F6",
      tiempo_estimado: 0,
      unidad_tiempo: "minutos",
      equipo_id: undefined,
      tecnico_id: undefined,
      guardar_plantilla: false,
    },
  });

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
      fetchPlantillas();
      setSelectedPlantilla("");
      if (fase) {
        form.reset({
          titulo: fase.titulo,
          color: fase.color,
          tiempo_estimado: fase.tiempo_estimado,
          unidad_tiempo: fase.unidad_tiempo,
          equipo_id: fase.equipo_id || undefined,
          tecnico_id: fase.tecnico_id || undefined,
          guardar_plantilla: false,
        });
      } else {
        form.reset({
          titulo: "",
          color: COLORES_PREDEFINIDOS[nextNumeroOrden % COLORES_PREDEFINIDOS.length],
          tiempo_estimado: 0,
          unidad_tiempo: "minutos",
          equipo_id: undefined,
          tecnico_id: undefined,
          guardar_plantilla: false,
        });
      }
    }
  }, [open, fase, nextNumeroOrden]);

  const fetchTeamMembers = async () => {
    try {
      const [equipoRes, tecnicosRes] = await Promise.all([
        supabase
          .from("equipo")
          .select("id, nombre, apellido")
          .eq("taller_id", tallerId)
          .eq("estado", "activo")
          .order("nombre"),
        supabase
          .from("tecnicos")
          .select("id, nombre, apellido")
          .eq("taller_id", tallerId)
          .eq("estado", "activo")
          .order("nombre"),
      ]);

      if (equipoRes.data) setEquipoMembers(equipoRes.data);
      if (tecnicosRes.data) setTecnicos(tecnicosRes.data);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchPlantillas = async () => {
    try {
      const { data, error } = await supabase
        .from("plantillas_fases")
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

  const onSubmit = async (values: FaseFormValues) => {
    setLoading(true);
    try {
      // Save as template if checkbox is checked
      if (values.guardar_plantilla && !fase) {
        const { error: templateError } = await supabase.from("plantillas_fases").insert({
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

      if (fase) {
        const { error } = await supabase
          .from("tarea_fases")
          .update({
            titulo: values.titulo,
            color: values.color,
            tiempo_estimado: values.tiempo_estimado,
            unidad_tiempo: values.unidad_tiempo,
            equipo_id: tipoTarea === 'administrativa' ? values.equipo_id || null : null,
            tecnico_id: tipoTarea === 'operativa' ? values.tecnico_id || null : null,
          })
          .eq("id", fase.id);

        if (error) throw error;
        toast.success("Fase actualizada exitosamente");
      } else {
        const { error } = await supabase.from("tarea_fases").insert({
          tarea_id: tareaId,
          numero_orden: nextNumeroOrden,
          titulo: values.titulo,
          color: values.color,
          tiempo_estimado: values.tiempo_estimado,
          unidad_tiempo: values.unidad_tiempo,
          equipo_id: tipoTarea === 'administrativa' ? values.equipo_id || null : null,
          tecnico_id: tipoTarea === 'operativa' ? values.tecnico_id || null : null,
        });

        if (error) throw error;
        toast.success("Fase creada exitosamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving fase:", error);
      toast.error(error.message || "Error al guardar la fase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fase ? "Editar Fase" : "Nueva Fase"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">Fase N°</span>
              <span className="font-bold">{fase ? fase.numero_orden : nextNumeroOrden}</span>
            </div>

            {!fase && plantillas.length > 0 && (
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
                  <FormLabel>Título de la Fase *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Diagnóstico inicial" />
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

            {tipoTarea === 'administrativa' ? (
              <FormField
                control={form.control}
                name="equipo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar a (Equipo Administrativo)</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "__none__" ? undefined : val)} value={field.value || "__none__"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar miembro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin asignar</SelectItem>
                        {equipoMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.nombre} {member.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="tecnico_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar a (Equipo Técnico)</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "__none__" ? undefined : val)} value={field.value || "__none__"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar técnico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin asignar</SelectItem>
                        {tecnicos.map((tecnico) => (
                          <SelectItem key={tecnico.id} value={tecnico.id}>
                            {tecnico.nombre} {tecnico.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!fase && (
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
                        Esta fase estará disponible para usarla en otras tareas
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
                {fase ? "Guardar Cambios" : "Crear Fase"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}