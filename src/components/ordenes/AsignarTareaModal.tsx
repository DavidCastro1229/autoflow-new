import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Clock, Layers } from "lucide-react";

interface CatalogoTarea {
  id: string;
  codigo_tarea: string;
  nombre: string;
  descripcion: string | null;
  tiempo_estimado: number | null;
  unidad_tiempo: string | null;
}

interface TareaFase {
  id: string;
  titulo: string;
  numero_orden: number;
  color: string;
}

interface AsignarTareaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordenId: string;
  currentTareaId?: string | null;
  onAssigned: () => void;
}

export function AsignarTareaModal({
  open,
  onOpenChange,
  ordenId,
  currentTareaId,
  onAssigned,
}: AsignarTareaModalProps) {
  const [tareas, setTareas] = useState<CatalogoTarea[]>([]);
  const [selectedTareaId, setSelectedTareaId] = useState<string>(currentTareaId || "");
  const [fases, setFases] = useState<TareaFase[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTareas();
      setSelectedTareaId(currentTareaId || "");
    }
  }, [open, currentTareaId]);

  useEffect(() => {
    if (selectedTareaId) {
      fetchFases(selectedTareaId);
    } else {
      setFases([]);
    }
  }, [selectedTareaId]);

  const fetchTareas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", user.id)
        .single();

      if (!userRoles?.taller_id) return;

      const { data, error } = await supabase
        .from("catalogo_tareas")
        .select("id, codigo_tarea, nombre, descripcion, tiempo_estimado, unidad_tiempo")
        .eq("taller_id", userRoles.taller_id)
        .order("numero_orden");

      if (error) throw error;
      setTareas(data || []);
    } catch (error) {
      console.error("Error fetching tareas:", error);
      toast.error("Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  const fetchFases = async (tareaId: string) => {
    try {
      const { data, error } = await supabase
        .from("tarea_fases")
        .select("id, titulo, numero_orden, color")
        .eq("tarea_id", tareaId)
        .order("numero_orden");

      if (error) throw error;
      setFases(data || []);
    } catch (error) {
      console.error("Error fetching fases:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedTareaId) {
      toast.error("Selecciona una tarea");
      return;
    }

    setSubmitting(true);
    try {
      // Get the first fase of the selected tarea
      const { data: primeraFase, error: faseError } = await supabase
        .from("tarea_fases")
        .select("id")
        .eq("tarea_id", selectedTareaId)
        .order("numero_orden")
        .limit(1)
        .single();

      if (faseError && faseError.code !== 'PGRST116') throw faseError;

      // Get the first flujo of the first fase if exists
      let primerFlujoId = null;
      if (primeraFase) {
        const { data: primerFlujo } = await supabase
          .from("fase_flujos")
          .select("id")
          .eq("fase_id", primeraFase.id)
          .order("numero_orden")
          .limit(1)
          .single();
        
        if (primerFlujo) {
          primerFlujoId = primerFlujo.id;
        }
      }

      // Update the order with the assigned task
      const { error: updateError } = await supabase
        .from("ordenes")
        .update({
          tarea_id: selectedTareaId,
          fase_actual_id: primeraFase?.id || null,
          flujo_actual_id: primerFlujoId,
        })
        .eq("id", ordenId);

      if (updateError) throw updateError;

      // Create history entry if there's a first fase
      if (primeraFase) {
        await supabase
          .from("orden_proceso_historial")
          .insert({
            orden_id: ordenId,
            fase_id: primeraFase.id,
            flujo_id: primerFlujoId,
            fecha_entrada: new Date().toISOString(),
          });
      }

      toast.success("Tarea asignada correctamente");
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning tarea:", error);
      toast.error("Error al asignar la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("ordenes")
        .update({
          tarea_id: null,
          fase_actual_id: null,
          flujo_actual_id: null,
        })
        .eq("id", ordenId);

      if (error) throw error;

      toast.success("Asignación de tarea eliminada");
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast.error("Error al eliminar la asignación");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTarea = tareas.find(t => t.id === selectedTareaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar Flujo de Proceso</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seleccionar Tarea (Flujo de Proceso)</Label>
              <Select value={selectedTareaId} onValueChange={setSelectedTareaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una tarea..." />
                </SelectTrigger>
                <SelectContent>
                  {tareas.map((tarea) => (
                    <SelectItem key={tarea.id} value={tarea.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {tarea.codigo_tarea}
                        </Badge>
                        {tarea.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTarea && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{selectedTarea.descripcion || "Sin descripción"}</p>
                  </div>
                  
                  {selectedTarea.tiempo_estimado && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Tiempo estimado: {selectedTarea.tiempo_estimado}{" "}
                        {selectedTarea.unidad_tiempo === "minutos" ? "min" : 
                         selectedTarea.unidad_tiempo === "horas" ? "hrs" : 
                         selectedTarea.unidad_tiempo === "dias" ? "días" : ""}
                      </span>
                    </div>
                  )}

                  {fases.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        <span>Fases del proceso ({fases.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fases.map((fase, index) => (
                          <Badge
                            key={fase.id}
                            variant="outline"
                            style={{ borderColor: fase.color, color: fase.color }}
                          >
                            {index + 1}. {fase.titulo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between pt-4">
              {currentTareaId && (
                <Button
                  variant="destructive"
                  onClick={handleRemoveAssignment}
                  disabled={submitting}
                >
                  Quitar asignación
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAssign} disabled={submitting || !selectedTareaId}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentTareaId ? "Cambiar Tarea" : "Asignar Tarea"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
