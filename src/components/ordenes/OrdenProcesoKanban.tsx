import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Clock, ChevronRight, ChevronLeft, Check, CheckCheck, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TareaFase {
  id: string;
  titulo: string;
  numero_orden: number;
  color: string;
  tiempo_estimado: number | null;
  unidad_tiempo: string | null;
  tecnico_id: string | null;
  equipo_id: string | null;
  tecnico?: { nombre: string; apellido: string } | null;
  equipo?: { nombre: string; apellido: string } | null;
  notificar: boolean | null;
  mensaje_notificacion: string | null;
}

interface FaseFlujo {
  id: string;
  titulo: string;
  numero_orden: number;
  color: string;
  fase_id: string;
  tiempo_estimado: number | null;
  unidad_tiempo: string | null;
}

interface OrdenProcesoKanbanProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordenId: string;
  tareaId: string;
  faseActualId: string | null;
  flujoActualId: string | null;
  ordenDescripcion: string;
  onUpdate: () => void;
}

export function OrdenProcesoKanban({
  open,
  onOpenChange,
  ordenId,
  tareaId,
  faseActualId: initialFaseId,
  flujoActualId: initialFlujoId,
  ordenDescripcion,
  onUpdate,
}: OrdenProcesoKanbanProps) {
  const [fases, setFases] = useState<TareaFase[]>([]);
  const [flujosByFase, setFlujosByFase] = useState<Record<string, FaseFlujo[]>>({});
  const [completedFlujos, setCompletedFlujos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [tarea, setTarea] = useState<{ nombre: string; codigo_tarea: string } | null>(null);
  
  // Estado local para tracking de posición actual
  const [currentFaseId, setCurrentFaseId] = useState<string | null>(initialFaseId);
  const [currentFlujoId, setCurrentFlujoId] = useState<string | null>(initialFlujoId);

  // Sincronizar estado inicial
  useEffect(() => {
    setCurrentFaseId(initialFaseId);
    setCurrentFlujoId(initialFlujoId);
  }, [initialFaseId, initialFlujoId]);

  useEffect(() => {
    if (open && tareaId) {
      fetchData();
    }
  }, [open, tareaId]);

  const fetchData = async () => {
    try {
      // Fetch tarea info
      const { data: tareaData } = await supabase
        .from("catalogo_tareas")
        .select("nombre, codigo_tarea")
        .eq("id", tareaId)
        .single();

      if (tareaData) setTarea(tareaData);

      // Fetch fases with assigned team members
      const { data: fasesData, error: fasesError } = await supabase
        .from("tarea_fases")
        .select(`
          *,
          tecnico:tecnicos(nombre, apellido),
          equipo:equipo(nombre, apellido)
        `)
        .eq("tarea_id", tareaId)
        .order("numero_orden");

      if (fasesError) throw fasesError;
      setFases(fasesData || []);

      // Fetch flujos for each fase
      if (fasesData && fasesData.length > 0) {
        const faseIds = fasesData.map(f => f.id);
        const { data: flujosData, error: flujosError } = await supabase
          .from("fase_flujos")
          .select("*")
          .in("fase_id", faseIds)
          .order("numero_orden");

        if (flujosError) throw flujosError;

        const grouped: Record<string, FaseFlujo[]> = {};
        fasesData.forEach(fase => {
          grouped[fase.id] = (flujosData || []).filter(f => f.fase_id === fase.id);
        });
        setFlujosByFase(grouped);
      }

      // Cargar historial para marcar flujos ya completados
      const { data: historialData } = await supabase
        .from("orden_proceso_historial")
        .select("flujo_id")
        .eq("orden_id", ordenId)
        .not("flujo_id", "is", null);

      if (historialData) {
        const completed = new Set<string>();
        historialData.forEach(h => {
          if (h.flujo_id) completed.add(h.flujo_id);
        });
        setCompletedFlujos(completed);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar el proceso");
    } finally {
      setLoading(false);
    }
  };

  // Función para enviar notificación al completar una fase
  const sendFaseNotification = async (fase: TareaFase) => {
    if (!fase.notificar || !fase.mensaje_notificacion) return;
    
    try {
      console.log("Sending fase notification:", { faseId: fase.id, faseTitulo: fase.titulo });
      
      const { data, error } = await supabase.functions.invoke('send-fase-notification', {
        body: {
          ordenId,
          faseId: fase.id,
          faseTitulo: fase.titulo,
          mensaje: fase.mensaje_notificacion,
        },
      });

      if (error) {
        console.error("Error sending notification:", error);
        toast.error("Error al enviar notificación");
        return;
      }

      if (data?.success) {
        toast.success("Notificación enviada al cliente");
      } else {
        console.warn("Notification partially failed:", data);
      }
    } catch (error) {
      console.error("Error invoking notification function:", error);
    }
  };

  const moveToFase = async (newFaseId: string, newFlujoId: string | null = null) => {
    setMoving(true);
    try {
      // Update orden with new position
      const { error: updateError } = await supabase
        .from("ordenes")
        .update({
          fase_actual_id: newFaseId,
          flujo_actual_id: newFlujoId,
        })
        .eq("id", ordenId);

      if (updateError) throw updateError;

      // Add history entry
      await supabase
        .from("orden_proceso_historial")
        .insert({
          orden_id: ordenId,
          fase_id: newFaseId,
          flujo_id: newFlujoId,
          fecha_entrada: new Date().toISOString(),
        });

      // Actualizar estado local
      setCurrentFaseId(newFaseId);
      setCurrentFlujoId(newFlujoId);
      if (newFlujoId) {
        setCompletedFlujos(prev => new Set([...prev, newFlujoId]));
      }

      toast.success("Orden movida correctamente");
      onUpdate();
    } catch (error) {
      console.error("Error moving orden:", error);
      toast.error("Error al mover la orden");
    } finally {
      setMoving(false);
    }
  };

  const toggleFlujoComplete = async (flujoId: string, faseId: string) => {
    const isAlreadyCompleted = completedFlujos.has(flujoId);
    
    setMoving(true);
    try {
      if (isAlreadyCompleted) {
        // Desmarcar flujo
        const newCompleted = new Set(completedFlujos);
        newCompleted.delete(flujoId);
        setCompletedFlujos(newCompleted);

        // Eliminar del historial
        await supabase
          .from("orden_proceso_historial")
          .delete()
          .eq("orden_id", ordenId)
          .eq("flujo_id", flujoId);

        // Determinar nuevo estado basado en progreso restante
        const newStatus = newCompleted.size > 0 ? "en_proceso" : "pendiente";

        // Actualizar posición actual a este flujo y estado
        const { error: updateError } = await supabase
          .from("ordenes")
          .update({
            fase_actual_id: faseId,
            flujo_actual_id: flujoId,
            estado: newStatus as "pendiente" | "en_proceso",
          })
          .eq("id", ordenId);

        if (updateError) throw updateError;
        
        setCurrentFaseId(faseId);
        setCurrentFlujoId(flujoId);
        toast.success("Flujo desmarcado");
      } else {
        // Marcar flujo como completado
        const newCompletedFlujos = new Set([...completedFlujos, flujoId]);
        setCompletedFlujos(newCompletedFlujos);
        
        // Registrar en historial
        await supabase
          .from("orden_proceso_historial")
          .insert({
            orden_id: ordenId,
            fase_id: faseId,
            flujo_id: flujoId,
            fecha_entrada: new Date().toISOString(),
          });

        // Buscar siguiente flujo no completado
        const flujos = flujosByFase[faseId] || [];
        const currentFlujoIndex = flujos.findIndex(f => f.id === flujoId);
        
        // Buscar siguiente flujo en esta fase
        let nextFlujoId: string | null = null;
        for (let i = currentFlujoIndex + 1; i < flujos.length; i++) {
          if (!newCompletedFlujos.has(flujos[i].id)) {
            nextFlujoId = flujos[i].id;
            break;
          }
        }

        if (nextFlujoId) {
          // Mover al siguiente flujo no completado - estado: en_proceso
          const { error: updateError } = await supabase
            .from("ordenes")
            .update({
              fase_actual_id: faseId,
              flujo_actual_id: nextFlujoId,
              estado: "en_proceso",
            })
            .eq("id", ordenId);

          if (updateError) throw updateError;
          
          setCurrentFlujoId(nextFlujoId);
          toast.success("Flujo completado");
        } else {
          // Verificar si todos los flujos de la fase están completados
          const allCompleted = flujos.every(f => f.id === flujoId || completedFlujos.has(f.id));
          
          if (allCompleted) {
            // Fase completada - enviar notificación si está configurado
            const currentFase = fases.find(f => f.id === faseId);
            if (currentFase?.notificar && currentFase.mensaje_notificacion) {
              sendFaseNotification(currentFase);
            }

            // Buscar siguiente fase
            const currentFaseIndex = fases.findIndex(f => f.id === faseId);
            
            if (currentFaseIndex < fases.length - 1) {
              const nextFase = fases[currentFaseIndex + 1];
              const nextFlujos = flujosByFase[nextFase.id] || [];
              const firstUncompletedFlujo = nextFlujos.find(f => !newCompletedFlujos.has(f.id));
              const firstFlujoId = firstUncompletedFlujo?.id || (nextFlujos.length > 0 ? nextFlujos[0].id : null);
              
              // Aún hay fases pendientes - estado: en_proceso
              const { error: updateError } = await supabase
                .from("ordenes")
                .update({
                  fase_actual_id: nextFase.id,
                  flujo_actual_id: firstFlujoId,
                  estado: "en_proceso",
                })
                .eq("id", ordenId);

              if (updateError) throw updateError;
              
              setCurrentFaseId(nextFase.id);
              setCurrentFlujoId(firstFlujoId);
              toast.success(`Fase completada. Avanzando a: ${nextFase.titulo}`);
            } else {
              // Última fase completada - marcar orden como completada
              const { error: updateError } = await supabase
                .from("ordenes")
                .update({
                  estado: "completada",
                })
                .eq("id", ordenId);

              if (updateError) throw updateError;
              
              toast.success("¡Proceso completado! Orden marcada como completada.");
            }
          } else {
            toast.success("Flujo completado");
          }
        }
      }

      onUpdate();
    } catch (error) {
      console.error("Error toggling flujo:", error);
      toast.error("Error al actualizar el flujo");
    } finally {
      setMoving(false);
    }
  };

  // Función para calcular el estado basado en el progreso
  const calculateOrderStatus = (): "pendiente" | "en_proceso" | "completada" => {
    // Verificar si todos los flujos de todas las fases están completados
    const allFasesCompleted = fases.every(fase => allFlujosInFaseCompleted(fase.id));
    if (allFasesCompleted && fases.length > 0) {
      return "completada";
    }
    
    // Verificar si hay algún progreso
    if (completedFlujos.size > 0) {
      return "en_proceso";
    }
    
    return "pendiente";
  };

  const getCurrentFaseIndex = () => {
    return fases.findIndex(f => f.id === currentFaseId);
  };

  const canMoveBack = () => {
    const currentIndex = getCurrentFaseIndex();
    return currentIndex > 0;
  };

  const canMoveForward = () => {
    const currentIndex = getCurrentFaseIndex();
    return currentIndex < fases.length - 1;
  };

  const moveToPreviousFase = async () => {
    const currentIndex = getCurrentFaseIndex();
    if (currentIndex > 0) {
      const previousFase = fases[currentIndex - 1];
      const flujos = flujosByFase[previousFase.id] || [];
      const firstFlujo = flujos.length > 0 ? flujos[0].id : null;
      await moveToFase(previousFase.id, firstFlujo);
    }
  };

  const moveToNextFase = async () => {
    const currentIndex = getCurrentFaseIndex();
    if (currentIndex < fases.length - 1) {
      const nextFase = fases[currentIndex + 1];
      const flujos = flujosByFase[nextFase.id] || [];
      const firstFlujo = flujos.length > 0 ? flujos[0].id : null;
      await moveToFase(nextFase.id, firstFlujo);
    }
  };

  const isLastFase = () => {
    const currentIndex = getCurrentFaseIndex();
    return currentIndex === fases.length - 1;
  };

  const allFlujosInFaseCompleted = (faseId: string) => {
    const flujos = flujosByFase[faseId] || [];
    if (flujos.length === 0) return true;
    return flujos.every(f => completedFlujos.has(f.id));
  };

  // Función para marcar todos los flujos como completados
  const markAllAsCompleted = async () => {
    setMoving(true);
    try {
      const allFlujoIds: string[] = [];
      const historialInserts: { orden_id: string; fase_id: string; flujo_id: string; fecha_entrada: string }[] = [];

      // Recolectar todos los flujos de todas las fases
      fases.forEach(fase => {
        const flujos = flujosByFase[fase.id] || [];
        flujos.forEach(flujo => {
          if (!completedFlujos.has(flujo.id)) {
            allFlujoIds.push(flujo.id);
            historialInserts.push({
              orden_id: ordenId,
              fase_id: fase.id,
              flujo_id: flujo.id,
              fecha_entrada: new Date().toISOString(),
            });
          }
        });
      });

      if (historialInserts.length > 0) {
        // Insertar todos los registros en el historial
        const { error: historialError } = await supabase
          .from("orden_proceso_historial")
          .insert(historialInserts);

        if (historialError) throw historialError;
      }

      // Actualizar el estado de la orden a completada
      const lastFase = fases[fases.length - 1];
      const lastFlujos = flujosByFase[lastFase?.id] || [];
      const lastFlujo = lastFlujos[lastFlujos.length - 1];

      const { error: updateError } = await supabase
        .from("ordenes")
        .update({
          estado: "completada",
          fase_actual_id: lastFase?.id || null,
          flujo_actual_id: lastFlujo?.id || null,
        })
        .eq("id", ordenId);

      if (updateError) throw updateError;

      // Actualizar estado local
      const allCompleted = new Set([...completedFlujos, ...allFlujoIds]);
      setCompletedFlujos(allCompleted);
      setCurrentFaseId(lastFase?.id || null);
      setCurrentFlujoId(lastFlujo?.id || null);

      toast.success("¡Todos los flujos marcados como completados!");
      onUpdate();
    } catch (error) {
      console.error("Error marking all as completed:", error);
      toast.error("Error al marcar todos como completados");
    } finally {
      setMoving(false);
    }
  };

  // Verificar si todos los flujos ya están completados
  const allProcessCompleted = () => {
    return fases.every(fase => allFlujosInFaseCompleted(fase.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Proceso de Orden
            {tarea && (
              <Badge variant="outline">
                {tarea.codigo_tarea} - {tarea.nombre}
              </Badge>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{ordenDescripcion}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Navigation buttons */}
            <div className="flex items-center justify-between mb-4 px-2">
              <Button
                variant="outline"
                onClick={moveToPreviousFase}
                disabled={moving || !canMoveBack()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Fase Anterior
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {fases.map((fase) => (
                    <div
                      key={fase.id}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all",
                        fase.id === currentFaseId
                          ? "scale-125"
                          : allFlujosInFaseCompleted(fase.id)
                          ? "opacity-100"
                          : "opacity-50"
                      )}
                      style={{ backgroundColor: fase.color }}
                      title={fase.titulo}
                    />
                  ))}
                </div>

                {/* Botón para marcar todo como completado */}
                {!allProcessCompleted() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsCompleted}
                    disabled={moving}
                    className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todo completado
                  </Button>
                )}
              </div>

              {isLastFase() && allFlujosInFaseCompleted(currentFaseId || "") ? (
                <Button
                  variant="default"
                  onClick={() => onOpenChange(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Proceso Completo
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={moveToNextFase}
                  disabled={moving || !canMoveForward()}
                >
                  Siguiente Fase
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Kanban view */}
            <div className="h-[calc(90vh-200px)] overflow-auto p-2">
              <div className="flex gap-4 min-w-max pb-4">
                {fases.map((fase) => {
                  const flujos = flujosByFase[fase.id] || [];
                  const isCurrentFase = fase.id === currentFaseId;

                  return (
                    <Card
                      key={fase.id}
                      className={cn(
                        "w-72 flex-shrink-0 transition-all cursor-pointer",
                        isCurrentFase
                          ? "ring-2 ring-primary shadow-lg"
                          : "opacity-60 hover:opacity-80"
                      )}
                      onClick={() => {
                        if (!isCurrentFase && !moving) {
                          const firstFlujo = flujos.length > 0 ? flujos[0].id : null;
                          moveToFase(fase.id, firstFlujo);
                        }
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: fase.color }}
                            />
                            <CardTitle className="text-sm font-medium">
                              {fase.titulo}
                            </CardTitle>
                            {fase.notificar && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Bell className="h-3.5 w-3.5 text-blue-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Se notificará al cliente al completar esta fase</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {isCurrentFase && (
                            <Badge variant="default" className="text-xs">
                              Actual
                            </Badge>
                          )}
                        </div>
                        {fase.tiempo_estimado && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {fase.tiempo_estimado}{" "}
                            {fase.unidad_tiempo === "minutos" ? "min" : 
                             fase.unidad_tiempo === "horas" ? "hrs" : 
                             fase.unidad_tiempo === "dias" ? "días" : ""}
                          </div>
                        )}
                        {(fase.tecnico || fase.equipo) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            {fase.tecnico && (
                              <span>{fase.tecnico.nombre} {fase.tecnico.apellido}</span>
                            )}
                            {fase.equipo && (
                              <span>{fase.equipo.nombre} {fase.equipo.apellido}</span>
                            )}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {flujos.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Sin flujos definidos
                          </p>
                        ) : (
                          flujos.map((flujo) => {
                            const isCurrentFlujo = flujo.id === currentFlujoId;
                            const isCompleted = completedFlujos.has(flujo.id);
                            
                            return (
                              <Card
                                key={flujo.id}
                                className={cn(
                                  "p-3 transition-all cursor-pointer",
                                  isCompleted
                                    ? "bg-green-500/10 border-green-500/30"
                                    : isCurrentFlujo
                                    ? "ring-2 ring-primary bg-primary/5"
                                    : "hover:bg-muted/50"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!moving && isCurrentFase) {
                                    toggleFlujoComplete(flujo.id, fase.id);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                      isCompleted 
                                        ? "bg-green-500 border-green-500" 
                                        : isCurrentFlujo 
                                        ? "border-primary"
                                        : "border-muted-foreground/30"
                                    )}
                                  >
                                    {isCompleted && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <span className={cn(
                                    "text-sm font-medium flex-1",
                                    isCompleted && "line-through opacity-70"
                                  )}>
                                    {flujo.titulo}
                                  </span>
                                  {isCurrentFlujo && !isCompleted && (
                                    <Badge variant="secondary" className="text-xs">
                                      En curso
                                    </Badge>
                                  )}
                                </div>
                                {flujo.tiempo_estimado && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 ml-6">
                                    <Clock className="h-3 w-3" />
                                    {flujo.tiempo_estimado}{" "}
                                    {flujo.unidad_tiempo === "minutos" ? "min" : 
                                     flujo.unidad_tiempo === "horas" ? "hrs" : 
                                     flujo.unidad_tiempo === "dias" ? "días" : ""}
                                  </div>
                                )}
                              </Card>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
