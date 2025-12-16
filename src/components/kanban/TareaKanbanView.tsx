import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Loader2, 
  Clock, 
  User,
  GripVertical,
  CheckCircle2,
  Circle,
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
  completado: boolean | null;
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
function SortableFlujoCard({ 
  flujo, 
  isActive,
  onToggleComplete 
}: { 
  flujo: FaseFlujo; 
  isActive: boolean;
  onToggleComplete: (flujo: FaseFlujo) => void;
}) {
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
      className={`
        group bg-card border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow
        ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${flujo.completado ? 'opacity-70' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(flujo);
          }}
          className="mt-0.5 shrink-0"
        >
          {flujo.completado ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: flujo.color }}
            />
            <span className={`text-sm font-medium truncate ${flujo.completado ? 'line-through text-muted-foreground' : ''}`}>
              {flujo.titulo}
            </span>
          </div>
          {flujo.tiempo_estimado && flujo.tiempo_estimado > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {flujo.tiempo_estimado} {flujo.unidad_tiempo}
              </span>
            </div>
          )}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </div>
  );
}

// Drag Overlay Card (shown while dragging)
function DragOverlayCard({ flujo }: { flujo: FaseFlujo }) {
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg cursor-grabbing ring-2 ring-primary">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {flujo.completado ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
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
      </div>
    </div>
  );
}

// Phase Column Component
function FaseColumn({ 
  fase, 
  flujos, 
  isCurrentFase,
  activeFlujoId,
  onToggleFlujoComplete
}: { 
  fase: TareaFase; 
  flujos: FaseFlujo[];
  isCurrentFase: boolean;
  activeFlujoId: string | null;
  onToggleFlujoComplete: (flujo: FaseFlujo) => void;
}) {
  const completedCount = flujos.filter(f => f.completado).length;
  const progress = flujos.length > 0 ? (completedCount / flujos.length) * 100 : 0;

  return (
    <div 
      className={`
        flex flex-col w-72 shrink-0 rounded-xl overflow-hidden border
        ${isCurrentFase ? 'ring-2 ring-primary shadow-lg' : 'bg-muted/30'}
      `}
    >
      {/* Column Header */}
      <div 
        className="p-3 border-b"
        style={{ 
          backgroundColor: `${fase.color}20`,
          borderLeftWidth: '4px',
          borderLeftColor: fase.color 
        }}
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
          {isCurrentFase && (
            <Badge variant="default" className="text-xs">
              Actual
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium truncate">{fase.titulo}</p>
        
        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedCount}/{flujos.length} completados</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

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
          strategy={horizontalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[100px]">
            {flujos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Sin flujos definidos
              </div>
            ) : (
              flujos.map((flujo) => (
                <SortableFlujoCard 
                  key={flujo.id} 
                  flujo={flujo}
                  isActive={flujo.id === activeFlujoId}
                  onToggleComplete={onToggleFlujoComplete}
                />
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
  const [activeDragFlujo, setActiveDragFlujo] = useState<FaseFlujo | null>(null);
  const [currentFaseId, setCurrentFaseId] = useState<string | null>(null);
  const [activeFlujoId, setActiveFlujoId] = useState<string | null>(null);

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

        // Determine current fase (first fase with incomplete flujos)
        const firstIncompleteFase = data.find(fase => {
          const faseFlujos = grouped[fase.id] || [];
          return faseFlujos.some(f => !f.completado);
        });
        setCurrentFaseId(firstIncompleteFase?.id || data[0]?.id || null);

        // Determine active flujo (first incomplete flujo in current fase)
        if (firstIncompleteFase) {
          const faseFlujos = grouped[firstIncompleteFase.id] || [];
          const firstIncompleteFlujo = faseFlujos.find(f => !f.completado);
          setActiveFlujoId(firstIncompleteFlujo?.id || null);
        }
      } else {
        setFlujosByFase({});
        setCurrentFaseId(null);
        setActiveFlujoId(null);
      }
    } catch (error: any) {
      console.error("Error fetching fases:", error);
      toast.error("Error al cargar las fases");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const flujoId = event.active.id as string;
    // Find the flujo being dragged
    for (const faseId in flujosByFase) {
      const flujo = flujosByFase[faseId].find(f => f.id === flujoId);
      if (flujo) {
        setActiveDragFlujo(flujo);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragFlujo(null);
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // For now, just reorder within the same phase
    // More complex cross-phase logic can be added later
    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which fase contains these flujos
    for (const faseId in flujosByFase) {
      const flujos = flujosByFase[faseId];
      const activeIndex = flujos.findIndex(f => f.id === activeId);
      const overIndex = flujos.findIndex(f => f.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        // Reorder within the same phase
        const newFlujos = [...flujos];
        const [removed] = newFlujos.splice(activeIndex, 1);
        newFlujos.splice(overIndex, 0, removed);

        // Update order numbers
        const updates = newFlujos.map((flujo, idx) => ({
          id: flujo.id,
          numero_orden: idx + 1
        }));

        // Update state immediately for responsiveness
        setFlujosByFase(prev => ({
          ...prev,
          [faseId]: newFlujos.map((f, idx) => ({ ...f, numero_orden: idx + 1 }))
        }));

        // Update in database
        try {
          for (const update of updates) {
            await supabase
              .from("fase_flujos")
              .update({ numero_orden: update.numero_orden })
              .eq("id", update.id);
          }
        } catch (error) {
          console.error("Error updating order:", error);
          fetchFasesAndFlujos(); // Revert on error
        }
        break;
      }
    }
  };

  const handleToggleFlujoComplete = async (flujo: FaseFlujo) => {
    const newCompletado = !flujo.completado;
    
    // Optimistic update
    setFlujosByFase(prev => ({
      ...prev,
      [flujo.fase_id]: prev[flujo.fase_id].map(f => 
        f.id === flujo.id ? { ...f, completado: newCompletado } : f
      )
    }));

    try {
      const { error } = await supabase
        .from("fase_flujos")
        .update({ completado: newCompletado })
        .eq("id", flujo.id);

      if (error) throw error;

      // Update current fase and active flujo
      if (newCompletado) {
        // Move to next incomplete flujo
        const faseFlujos = flujosByFase[flujo.fase_id] || [];
        const nextIncompleteFlujo = faseFlujos.find(f => f.id !== flujo.id && !f.completado);
        
        if (nextIncompleteFlujo) {
          setActiveFlujoId(nextIncompleteFlujo.id);
        } else {
          // All flujos in this phase complete, move to next phase
          const currentFaseIndex = fases.findIndex(f => f.id === flujo.fase_id);
          if (currentFaseIndex < fases.length - 1) {
            const nextFase = fases[currentFaseIndex + 1];
            setCurrentFaseId(nextFase.id);
            const nextFaseFlujos = flujosByFase[nextFase.id] || [];
            const firstIncompleteFlujoInNextFase = nextFaseFlujos.find(f => !f.completado);
            setActiveFlujoId(firstIncompleteFlujoInNextFase?.id || null);
          } else {
            setActiveFlujoId(null);
          }
        }
      }

      toast.success(newCompletado ? "Flujo completado" : "Flujo marcado como pendiente");
    } catch (error) {
      console.error("Error toggling flujo:", error);
      toast.error("Error al actualizar el flujo");
      fetchFasesAndFlujos(); // Revert on error
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
                {tarea.codigo_tarea} - Arrastra los flujos para cambiar su orden
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenFasesManager}>
              <Settings className="h-4 w-4 mr-2" />
              Gestionar Fases
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
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
              <ScrollArea className="h-[calc(90vh-120px)]">
                <div className="flex gap-4 p-6 min-w-max">
                  {fases.map((fase) => (
                    <FaseColumn
                      key={fase.id}
                      fase={fase}
                      flujos={flujosByFase[fase.id] || []}
                      isCurrentFase={fase.id === currentFaseId}
                      activeFlujoId={activeFlujoId}
                      onToggleFlujoComplete={handleToggleFlujoComplete}
                    />
                  ))}
                </div>
              </ScrollArea>

              <DragOverlay>
                {activeDragFlujo && (
                  <DragOverlayCard flujo={activeDragFlujo} />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
