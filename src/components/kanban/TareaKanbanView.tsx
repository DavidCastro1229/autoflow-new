import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Loader2, 
  Clock, 
  User,
  GripVertical,
  Workflow,
  Settings
} from "lucide-react";

interface TareaFase {
  id: string;
  tarea_id: string;
  numero_orden: number;
  titulo: string;
  color: string;
  tiempo_estimado: number | null;
  unidad_tiempo: 'minutos' | 'horas' | null;
  equipo_id: string | null;
  tecnico_id: string | null;
  equipo?: { nombre: string; apellido: string } | null;
  tecnico?: { nombre: string; apellido: string } | null;
}

interface FaseFlujo {
  id: string;
  fase_id: string;
  numero_orden: number;
  titulo: string;
  color: string;
  tiempo_estimado: number | null;
  unidad_tiempo: 'minutos' | 'horas' | null;
}

interface CatalogoTarea {
  id: string;
  nombre: string;
  codigo_tarea: string;
  tipo_tarea: 'administrativa' | 'operativa';
  taller_id: string;
}

interface TareaKanbanViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: CatalogoTarea | null;
  tallerId: string;
  onOpenFasesManager: () => void;
}

// Sortable Flow Card Component
function SortableFlujoCard({ flujo }: { flujo: FaseFlujo }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flujo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-card border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: flujo.color }}
        />
        <span className="text-sm font-medium truncate flex-1">
          {flujo.titulo}
        </span>
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      {flujo.tiempo_estimado && flujo.tiempo_estimado > 0 && (
        <div className="flex items-center gap-1 mt-1.5 ml-4">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {flujo.tiempo_estimado} {flujo.unidad_tiempo}
          </span>
        </div>
      )}
    </div>
  );
}

// Drag Overlay Card for flujos
function DragOverlayFlujoCard({ flujo }: { flujo: FaseFlujo }) {
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg cursor-grabbing ring-2 ring-primary">
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: flujo.color }}
        />
        <span className="text-sm font-medium truncate">
          {flujo.titulo}
        </span>
      </div>
    </div>
  );
}

// Drag Overlay Card for fases
function DragOverlayFaseCard({ fase }: { fase: TareaFase }) {
  return (
    <div 
      className="w-72 rounded-xl border shadow-lg cursor-grabbing ring-2 ring-primary bg-card"
      style={{ 
        borderLeftWidth: '4px',
        borderLeftColor: fase.color 
      }}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: fase.color }}
          />
          <h3 className="font-semibold text-sm">
            Fase {fase.numero_orden}: {fase.titulo}
          </h3>
        </div>
      </div>
    </div>
  );
}

// Sortable Phase Column Component
function SortableFaseColumn({ 
  fase, 
  flujos,
}: { 
  fase: TareaFase; 
  flujos: FaseFlujo[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-72 shrink-0 rounded-xl overflow-hidden border bg-muted/30"
    >
      {/* Column Header - Draggable */}
      <div 
        className="p-3 border-b cursor-grab active:cursor-grabbing"
        style={{ 
          backgroundColor: `${fase.color}20`,
          borderLeftWidth: '4px',
          borderLeftColor: fase.color 
        }}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: fase.color }}
            />
            <h3 className="font-semibold text-sm">
              Fase {fase.numero_orden}
            </h3>
          </div>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium truncate">{fase.titulo}</p>

        {/* Assigned person */}
        {(fase.equipo || fase.tecnico) && (
          <div className="flex items-center gap-1 mt-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {fase.equipo 
                ? `${fase.equipo.nombre} ${fase.equipo.apellido}`
                : `${fase.tecnico?.nombre} ${fase.tecnico?.apellido}`
              }
            </span>
          </div>
        )}

        {/* Estimated time */}
        {fase.tiempo_estimado && fase.tiempo_estimado > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {fase.tiempo_estimado} {fase.unidad_tiempo}
            </span>
          </div>
        )}
      </div>

      {/* Flujos */}
      <ScrollArea className="flex-1 p-2">
        <SortableContext 
          items={flujos.map(f => f.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[100px]">
            {flujos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Sin flujos definidos
              </div>
            ) : (
              flujos.map((flujo) => (
                <SortableFlujoCard key={flujo.id} flujo={flujo} />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

export function TareaKanbanView({
  open,
  onOpenChange,
  tarea,
  tallerId,
  onOpenFasesManager,
}: TareaKanbanViewProps) {
  const [loading, setLoading] = useState(false);
  const [fases, setFases] = useState<TareaFase[]>([]);
  const [flujosByFase, setFlujosByFase] = useState<Record<string, FaseFlujo[]>>({});
  const [activeDragItem, setActiveDragItem] = useState<{ type: 'fase' | 'flujo'; item: TareaFase | FaseFlujo } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open && tarea) {
      fetchFasesAndFlujos();
    }
  }, [open, tarea]);

  const fetchFasesAndFlujos = async () => {
    if (!tarea) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tarea_fases")
        .select(`
          *,
          equipo:equipo_id (nombre, apellido),
          tecnico:tecnico_id (nombre, apellido)
        `)
        .eq("tarea_id", tarea.id)
        .order("numero_orden", { ascending: true });

      if (error) throw error;
      setFases(data || []);

      // Fetch flujos for all fases
      if (data && data.length > 0) {
        const faseIds = data.map(f => f.id);
        const { data: flujosData, error: flujosError } = await supabase
          .from("fase_flujos")
          .select("*")
          .in("fase_id", faseIds)
          .order("numero_orden", { ascending: true });

        if (flujosError) throw flujosError;

        // Group flujos by fase_id
        const grouped: Record<string, FaseFlujo[]> = {};
        (flujosData || []).forEach(flujo => {
          if (!grouped[flujo.fase_id]) {
            grouped[flujo.fase_id] = [];
          }
          grouped[flujo.fase_id].push(flujo);
        });
        setFlujosByFase(grouped);
      } else {
        setFlujosByFase({});
      }
    } catch (error: any) {
      console.error("Error fetching fases:", error);
      toast.error("Error al cargar las fases");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    
    // Check if it's a fase
    const fase = fases.find(f => f.id === activeId);
    if (fase) {
      setActiveDragItem({ type: 'fase', item: fase });
      return;
    }
    
    // Check if it's a flujo
    for (const faseId in flujosByFase) {
      const flujo = flujosByFase[faseId].find(f => f.id === activeId);
      if (flujo) {
        setActiveDragItem({ type: 'flujo', item: flujo });
        return;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragItem(null);
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging a fase
    const activeFaseIndex = fases.findIndex(f => f.id === activeId);
    if (activeFaseIndex !== -1) {
      const overFaseIndex = fases.findIndex(f => f.id === overId);
      if (overFaseIndex !== -1) {
        // Reorder fases
        const newFases = [...fases];
        const [removed] = newFases.splice(activeFaseIndex, 1);
        newFases.splice(overFaseIndex, 0, removed);

        // Update order numbers
        const updatedFases = newFases.map((fase, idx) => ({
          ...fase,
          numero_orden: idx + 1
        }));

        setFases(updatedFases);

        // Update in database
        try {
          for (const fase of updatedFases) {
            await supabase
              .from("tarea_fases")
              .update({ numero_orden: fase.numero_orden })
              .eq("id", fase.id);
          }
          toast.success("Orden de fases actualizado");
        } catch (error) {
          console.error("Error updating fase order:", error);
          toast.error("Error al actualizar el orden");
          fetchFasesAndFlujos();
        }
        return;
      }
    }

    // Check if we're dragging a flujo
    let sourceFaseId: string | null = null;
    let activeFlujoIndex = -1;

    for (const faseId in flujosByFase) {
      const idx = flujosByFase[faseId].findIndex(f => f.id === activeId);
      if (idx !== -1) {
        sourceFaseId = faseId;
        activeFlujoIndex = idx;
        break;
      }
    }

    if (sourceFaseId && activeFlujoIndex !== -1) {
      // Find where we're dropping
      let targetFaseId: string | null = null;
      let overFlujoIndex = -1;

      for (const faseId in flujosByFase) {
        const idx = flujosByFase[faseId].findIndex(f => f.id === overId);
        if (idx !== -1) {
          targetFaseId = faseId;
          overFlujoIndex = idx;
          break;
        }
      }

      // Check if we're dropping on a fase (empty area)
      if (!targetFaseId) {
        const targetFase = fases.find(f => f.id === overId);
        if (targetFase) {
          targetFaseId = targetFase.id;
          overFlujoIndex = 0;
        }
      }

      if (targetFaseId) {
        if (sourceFaseId === targetFaseId) {
          // Reorder within the same phase
          const flujos = [...flujosByFase[sourceFaseId]];
          const [removed] = flujos.splice(activeFlujoIndex, 1);
          flujos.splice(overFlujoIndex, 0, removed);

          const updatedFlujos = flujos.map((flujo, idx) => ({
            ...flujo,
            numero_orden: idx + 1
          }));

          setFlujosByFase(prev => ({
            ...prev,
            [sourceFaseId!]: updatedFlujos
          }));

          // Update in database
          try {
            for (const flujo of updatedFlujos) {
              await supabase
                .from("fase_flujos")
                .update({ numero_orden: flujo.numero_orden })
                .eq("id", flujo.id);
            }
          } catch (error) {
            console.error("Error updating flujo order:", error);
            fetchFasesAndFlujos();
          }
        } else {
          // Move to different phase
          const sourceFlujos = [...(flujosByFase[sourceFaseId] || [])];
          const targetFlujos = [...(flujosByFase[targetFaseId] || [])];
          
          const [movedFlujo] = sourceFlujos.splice(activeFlujoIndex, 1);
          movedFlujo.fase_id = targetFaseId;
          targetFlujos.splice(overFlujoIndex, 0, movedFlujo);

          // Update order numbers
          const updatedSourceFlujos = sourceFlujos.map((f, idx) => ({ ...f, numero_orden: idx + 1 }));
          const updatedTargetFlujos = targetFlujos.map((f, idx) => ({ ...f, numero_orden: idx + 1 }));

          setFlujosByFase(prev => ({
            ...prev,
            [sourceFaseId!]: updatedSourceFlujos,
            [targetFaseId!]: updatedTargetFlujos
          }));

          // Update in database
          try {
            await supabase
              .from("fase_flujos")
              .update({ fase_id: targetFaseId, numero_orden: overFlujoIndex + 1 })
              .eq("id", movedFlujo.id);

            for (const flujo of updatedSourceFlujos) {
              await supabase
                .from("fase_flujos")
                .update({ numero_orden: flujo.numero_orden })
                .eq("id", flujo.id);
            }
            for (const flujo of updatedTargetFlujos) {
              await supabase
                .from("fase_flujos")
                .update({ numero_orden: flujo.numero_orden })
                .eq("id", flujo.id);
            }
            toast.success("Flujo movido");
          } catch (error) {
            console.error("Error moving flujo:", error);
            toast.error("Error al mover el flujo");
            fetchFasesAndFlujos();
          }
        }
      }
    }
  };

  if (!tarea) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Vista Kanban: {tarea.nombre}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {tarea.codigo_tarea} - Arrastra fases y flujos para reorganizar
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenFasesManager}>
              <Settings className="h-4 w-4 mr-2" />
              Gestionar Fases
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : fases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Workflow className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay fases definidas</p>
              <p className="text-sm mb-4">Crea fases y flujos para esta tarea</p>
              <Button onClick={onOpenFasesManager}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Fases
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="h-[calc(90vh-120px)] overflow-auto p-6">
                <SortableContext 
                  items={fases.map(f => f.id)} 
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-4 min-w-max pb-4">
                    {fases.map((fase) => (
                      <SortableFaseColumn
                        key={fase.id}
                        fase={fase}
                        flujos={flujosByFase[fase.id] || []}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>

              <DragOverlay>
                {activeDragItem?.type === 'flujo' && (
                  <DragOverlayFlujoCard flujo={activeDragItem.item as FaseFlujo} />
                )}
                {activeDragItem?.type === 'fase' && (
                  <DragOverlayFaseCard fase={activeDragItem.item as TareaFase} />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
