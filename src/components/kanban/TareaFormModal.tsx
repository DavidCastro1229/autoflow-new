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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const tareaFormSchema = z.object({
  codigo_tarea: z.string().min(1, "El código es requerido"),
  nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
  objetivo: z.string().max(300, "Máximo 300 caracteres").optional(),
  tipo_tarea: z.enum(["administrativa", "operativa"]),
  categorias: z.array(z.string()).min(1, "Selecciona al menos una categoría"),
  condiciones_aplicacion: z.array(z.string()),
  tiempo_estimado: z.number().min(0).default(0),
  unidad_tiempo: z.enum(["minutos", "horas"]),
  medidas_seguridad: z.string().max(500, "Máximo 500 caracteres").optional(),
  notas_internas: z.string().max(500, "Máximo 500 caracteres").optional(),
  roles_preferentes: z.array(z.number()),
  forma_pago: z.enum(["por_hora", "salario_fijo", "contrato_precio_fijo"]),
});

type TareaFormValues = z.infer<typeof tareaFormSchema>;

interface CatalogoTarea {
  id: string;
  numero_orden: number;
  codigo_tarea: string;
  nombre: string;
  descripcion: string | null;
  objetivo: string | null;
  tipo_tarea: 'administrativa' | 'operativa';
  categorias: string[];
  condiciones_aplicacion: string[];
  tiempo_estimado: number;
  unidad_tiempo: 'minutos' | 'horas';
  medidas_seguridad: string | null;
  notas_internas: string | null;
  roles_preferentes: number[];
  forma_pago: 'por_hora' | 'salario_fijo' | 'contrato_precio_fijo';
  taller_id: string;
}

interface Especialidad {
  id: number;
  nombre: string;
}

interface TareaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: CatalogoTarea | null;
  tallerId: string | null;
  especialidades: Especialidad[];
  categoriasOptions: string[];
  condicionesOptions: string[];
  onSuccess: () => void;
}

export function TareaFormModal({
  open,
  onOpenChange,
  tarea,
  tallerId,
  especialidades,
  categoriasOptions,
  condicionesOptions,
  onSuccess,
}: TareaFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [nextNumeroOrden, setNextNumeroOrden] = useState<number>(1);
  const [generatedCodigo, setGeneratedCodigo] = useState<string>("");

  const form = useForm<TareaFormValues>({
    resolver: zodResolver(tareaFormSchema),
    defaultValues: {
      codigo_tarea: "",
      nombre: "",
      descripcion: "",
      objetivo: "",
      tipo_tarea: "operativa",
      categorias: [],
      condiciones_aplicacion: [],
      tiempo_estimado: 0,
      unidad_tiempo: "minutos",
      medidas_seguridad: "",
      notas_internas: "",
      roles_preferentes: [],
      forma_pago: "por_hora",
    },
  });

  useEffect(() => {
    if (open && !tarea && tallerId) {
      // Generar código automático para nueva tarea
      generateAutoCode();
    }
  }, [open, tarea, tallerId]);

  useEffect(() => {
    if (open) {
      if (tarea) {
        // Modo edición
        form.reset({
          codigo_tarea: tarea.codigo_tarea,
          nombre: tarea.nombre,
          descripcion: tarea.descripcion || "",
          objetivo: tarea.objetivo || "",
          tipo_tarea: tarea.tipo_tarea,
          categorias: tarea.categorias,
          condiciones_aplicacion: tarea.condiciones_aplicacion,
          tiempo_estimado: tarea.tiempo_estimado,
          unidad_tiempo: tarea.unidad_tiempo,
          medidas_seguridad: tarea.medidas_seguridad || "",
          notas_internas: tarea.notas_internas || "",
          roles_preferentes: tarea.roles_preferentes,
          forma_pago: tarea.forma_pago,
        });
        setNextNumeroOrden(tarea.numero_orden);
      } else {
        // Modo creación
        form.reset({
          codigo_tarea: generatedCodigo,
          nombre: "",
          descripcion: "",
          objetivo: "",
          tipo_tarea: "operativa",
          categorias: [],
          condiciones_aplicacion: [],
          tiempo_estimado: 0,
          unidad_tiempo: "minutos",
          medidas_seguridad: "",
          notas_internas: "",
          roles_preferentes: [],
          forma_pago: "por_hora",
        });
      }
    }
  }, [open, tarea, generatedCodigo]);

  const generateAutoCode = async () => {
    if (!tallerId) return;
    try {
      const [numeroRes, codigoRes] = await Promise.all([
        supabase.rpc('get_next_numero_orden_tarea', { p_taller_id: tallerId }),
        supabase.rpc('generate_codigo_tarea', { p_taller_id: tallerId })
      ]);
      
      const numero = numeroRes.data || 1;
      const codigo = codigoRes.data || `TAR-${String(numero).padStart(4, '0')}`;
      
      setNextNumeroOrden(numero);
      setGeneratedCodigo(codigo);
      form.setValue('codigo_tarea', codigo);
    } catch (error) {
      console.error("Error generating code:", error);
    }
  };

  const onSubmit = async (values: TareaFormValues) => {
    if (!tallerId) {
      toast.error("No se pudo identificar el taller");
      return;
    }

    setLoading(true);
    try {
      if (tarea) {
        // Actualizar tarea existente
        const { error } = await supabase
          .from("catalogo_tareas")
          .update({
            codigo_tarea: values.codigo_tarea,
            nombre: values.nombre,
            descripcion: values.descripcion || null,
            objetivo: values.objetivo || null,
            tipo_tarea: values.tipo_tarea,
            categorias: values.categorias,
            condiciones_aplicacion: values.condiciones_aplicacion,
            tiempo_estimado: values.tiempo_estimado,
            unidad_tiempo: values.unidad_tiempo,
            medidas_seguridad: values.medidas_seguridad || null,
            notas_internas: values.notas_internas || null,
            roles_preferentes: values.roles_preferentes,
            forma_pago: values.forma_pago,
          })
          .eq("id", tarea.id);

        if (error) throw error;
        toast.success("Tarea actualizada exitosamente");
      } else {
        // Crear nueva tarea
        const { error } = await supabase.from("catalogo_tareas").insert({
          taller_id: tallerId,
          numero_orden: nextNumeroOrden,
          codigo_tarea: values.codigo_tarea,
          nombre: values.nombre,
          descripcion: values.descripcion || null,
          objetivo: values.objetivo || null,
          tipo_tarea: values.tipo_tarea,
          categorias: values.categorias,
          condiciones_aplicacion: values.condiciones_aplicacion,
          tiempo_estimado: values.tiempo_estimado,
          unidad_tiempo: values.unidad_tiempo,
          medidas_seguridad: values.medidas_seguridad || null,
          notas_internas: values.notas_internas || null,
          roles_preferentes: values.roles_preferentes,
          forma_pago: values.forma_pago,
        });

        if (error) throw error;
        toast.success("Tarea creada exitosamente");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving tarea:", error);
      toast.error(error.message || "Error al guardar la tarea");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaToggle = (categoria: string, checked: boolean) => {
    const current = form.getValues("categorias");
    if (checked) {
      form.setValue("categorias", [...current, categoria], { shouldValidate: true });
    } else {
      form.setValue("categorias", current.filter(c => c !== categoria), { shouldValidate: true });
    }
  };

  const handleCondicionToggle = (condicion: string, checked: boolean) => {
    const current = form.getValues("condiciones_aplicacion");
    if (checked) {
      form.setValue("condiciones_aplicacion", [...current, condicion]);
    } else {
      form.setValue("condiciones_aplicacion", current.filter(c => c !== condicion));
    }
  };

  const handleRolToggle = (rolId: number, checked: boolean) => {
    const current = form.getValues("roles_preferentes");
    if (checked) {
      form.setValue("roles_preferentes", [...current, rolId]);
    } else {
      form.setValue("roles_preferentes", current.filter(r => r !== rolId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {tarea ? "Editar Tarea" : "Nueva Tarea"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">
              {/* Sección 1: Identificación y Clasificación */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Identificación y Clasificación</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">N° Orden</Label>
                    <Input 
                      value={nextNumeroOrden} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="codigo_tarea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Tarea</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="TAR-0001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Tarea *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Cambio de aceite motor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción Detallada</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe en detalle qué implica esta tarea..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo de la Tarea</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="¿Cuál es el propósito de esta tarea?"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo_tarea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Tarea *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="administrativa">Administrativa</SelectItem>
                            <SelectItem value="operativa">Operativa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="categorias"
                  render={() => (
                    <FormItem>
                      <FormLabel>Categoría Principal *</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {categoriasOptions.map((cat) => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${cat}`}
                              checked={form.watch("categorias").includes(cat)}
                              onCheckedChange={(checked) => handleCategoriaToggle(cat, !!checked)}
                            />
                            <Label htmlFor={`cat-${cat}`} className="text-sm font-normal cursor-pointer">
                              {cat}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Sección 2: Parámetros de Aplicación */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Parámetros de Aplicación</h3>
                
                <div>
                  <Label className="mb-2 block">Condición de Aplicación</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {condicionesOptions.map((cond) => (
                      <div key={cond} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cond-${cond}`}
                          checked={form.watch("condiciones_aplicacion").includes(cond)}
                          onCheckedChange={(checked) => handleCondicionToggle(cond, !!checked)}
                        />
                        <Label htmlFor={`cond-${cond}`} className="text-sm font-normal cursor-pointer">
                          {cond}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sección 3: Gestión de Tiempo y Seguridad */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Gestión de Tiempo y Seguridad</h3>
                
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

                <FormField
                  control={form.control}
                  name="medidas_seguridad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medidas de Seguridad Requeridas</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe las medidas de seguridad necesarias..."
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notas_internas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Internas</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Notas adicionales para el equipo..."
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Sección 4: Configuración de Mano de Obra */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Configuración de Mano de Obra</h3>
                
                <div>
                  <Label className="mb-2 block">Rol/Especialidad Preferente</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {especialidades.map((esp) => (
                      <div key={esp.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`esp-${esp.id}`}
                          checked={form.watch("roles_preferentes").includes(esp.id)}
                          onCheckedChange={(checked) => handleRolToggle(esp.id, !!checked)}
                        />
                        <Label htmlFor={`esp-${esp.id}`} className="text-sm font-normal cursor-pointer">
                          {esp.nombre}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="forma_pago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pago Estándar</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="por_hora">Por hora</SelectItem>
                          <SelectItem value="salario_fijo">Por salario fijo</SelectItem>
                          <SelectItem value="contrato_precio_fijo">Por contrato/Precio fijo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tarea ? "Guardar Cambios" : "Guardar Tarea"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
