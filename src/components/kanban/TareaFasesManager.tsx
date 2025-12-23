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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Plus, 
  Loader2, 
  Pencil, 
  Trash2, 
  Clock, 
  User,
  Package,
  Workflow
} from "lucide-react";
import { FaseFormModal } from "./FaseFormModal";
import { FlujoFormModal } from "./FlujoFormModal";
import { MaterialesFaseModal } from "./MaterialesFaseModal";

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
  equipo?: { nombre: string; apellido: string } | null;
  tecnico?: { nombre: string; apellido: string } | null;
}

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

interface CatalogoTarea {
  id: string;
  nombre: string;
  codigo_tarea: string;
  tipo_tarea: 'administrativa' | 'operativa';
  taller_id: string;
}

interface TareaFasesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: CatalogoTarea | null;
  tallerId: string;
}

export function TareaFasesManager({
  open,
  onOpenChange,
  tarea,
  tallerId,
}: TareaFasesManagerProps) {
  const [loading, setLoading] = useState(false);
  const [fases, setFases] = useState<TareaFase[]>([]);
  const [flujosByFase, setFlujosByFase] = useState<Record<string, FaseFlujo[]>>({});
  
  // Modal states
  const [faseModalOpen, setFaseModalOpen] = useState(false);
  const [editingFase, setEditingFase] = useState<TareaFase | null>(null);
  const [flujoModalOpen, setFlujoModalOpen] = useState(false);
  const [editingFlujo, setEditingFlujo] = useState<FaseFlujo | null>(null);
  const [selectedFaseIdForFlujo, setSelectedFaseIdForFlujo] = useState<string>("");
  const [materialesModalOpen, setMaterialesModalOpen] = useState(false);
  const [selectedFaseForMateriales, setSelectedFaseForMateriales] = useState<TareaFase | null>(null);
  
  // Delete confirmation states
  const [deleteType, setDeleteType] = useState<'fase' | 'flujo' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<TareaFase | FaseFlujo | null>(null);

  useEffect(() => {
    if (open && tarea) {
      fetchFases();
    }
  }, [open, tarea]);

  const fetchFases = async () => {
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

  const handleAddFase = () => {
    setEditingFase(null);
    setFaseModalOpen(true);
  };

  const handleEditFase = (fase: TareaFase) => {
    setEditingFase(fase);
    setFaseModalOpen(true);
  };

  const handleDeleteFase = (fase: TareaFase) => {
    setDeleteType('fase');
    setItemToDelete(fase);
  };

  const handleAddFlujo = (faseId: string) => {
    setSelectedFaseIdForFlujo(faseId);
    setEditingFlujo(null);
    setFlujoModalOpen(true);
  };

  const handleEditFlujo = (flujo: FaseFlujo) => {
    setSelectedFaseIdForFlujo(flujo.fase_id);
    setEditingFlujo(flujo);
    setFlujoModalOpen(true);
  };

  const handleDeleteFlujo = (flujo: FaseFlujo) => {
    setDeleteType('flujo');
    setItemToDelete(flujo);
  };

  const handleOpenMateriales = (fase: TareaFase) => {
    setSelectedFaseForMateriales(fase);
    setMaterialesModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    try {
      if (deleteType === 'fase') {
        const { error } = await supabase
          .from("tarea_fases")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) throw error;
        toast.success("Fase eliminada exitosamente");
      } else {
        const { error } = await supabase
          .from("fase_flujos")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) throw error;
        toast.success("Flujo eliminado exitosamente");
      }

      fetchFases();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar");
    } finally {
      setDeleteType(null);
      setItemToDelete(null);
    }
  };

  const getNextFaseNumeroOrden = () => {
    if (fases.length === 0) return 1;
    return Math.max(...fases.map(f => f.numero_orden)) + 1;
  };

  const getNextFlujoNumeroOrden = (faseId: string) => {
    const flujos = flujosByFase[faseId] || [];
    if (flujos.length === 0) return 1;
    return Math.max(...flujos.map(f => f.numero_orden)) + 1;
  };

  if (!tarea) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Gestionar Fases y Flujos
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {tarea.codigo_tarea} - {tarea.nombre}
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-150px)] px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add phase button */}
                <Button onClick={handleAddFase} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Nueva Fase
                </Button>

                {fases.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay fases definidas para esta tarea.</p>
                    <p className="text-sm">Crea la primera fase para comenzar.</p>
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {fases.map((fase) => (
                      <AccordionItem 
                        key={fase.id} 
                        value={fase.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                          <div className="flex items-center gap-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded-full shrink-0"
                              style={{ backgroundColor: fase.color }}
                            />
                            <span className="font-medium">
                              Fase {fase.numero_orden}: {fase.titulo}
                            </span>
                            <div className="flex items-center gap-2 ml-auto mr-4">
                              {fase.tiempo_estimado > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {fase.tiempo_estimado} {fase.unidad_tiempo}
                                </Badge>
                              )}
                              {(fase.equipo || fase.tecnico) && (
                                <Badge variant="secondary" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {fase.equipo 
                                    ? `${fase.equipo.nombre} ${fase.equipo.apellido}`
                                    : `${fase.tecnico?.nombre} ${fase.tecnico?.apellido}`
                                  }
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {(flujosByFase[fase.id] || []).length} flujos
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {/* Fase actions */}
                          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditFase(fase)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar Fase
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenMateriales(fase)}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              Materiales
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFase(fase)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>

                          {/* Flujos list */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">Flujos de la Fase</h4>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleAddFlujo(fase.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar Flujo
                              </Button>
                            </div>

                            {(flujosByFase[fase.id] || []).length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">
                                No hay flujos definidos
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {(flujosByFase[fase.id] || []).map((flujo) => (
                                  <div 
                                    key={flujo.id}
                                    className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: flujo.color }}
                                      />
                                      <span className="text-sm">
                                        {flujo.numero_orden}. {flujo.titulo}
                                      </span>
                                      {flujo.tiempo_estimado > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {flujo.tiempo_estimado} {flujo.unidad_tiempo}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleEditFlujo(flujo)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteFlujo(flujo)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Fase Form Modal */}
      <FaseFormModal
        open={faseModalOpen}
        onOpenChange={setFaseModalOpen}
        fase={editingFase}
        tareaId={tarea.id}
        tipoTarea={tarea.tipo_tarea}
        nextNumeroOrden={editingFase?.numero_orden || getNextFaseNumeroOrden()}
        tallerId={tallerId}
        currentFlujos={editingFase ? (flujosByFase[editingFase.id] || []) : []}
        onSuccess={fetchFases}
      />

      {/* Flujo Form Modal */}
      <FlujoFormModal
        open={flujoModalOpen}
        onOpenChange={setFlujoModalOpen}
        flujo={editingFlujo}
        faseId={selectedFaseIdForFlujo}
        nextNumeroOrden={editingFlujo?.numero_orden || getNextFlujoNumeroOrden(selectedFaseIdForFlujo)}
        tallerId={tallerId}
        onSuccess={fetchFases}
      />

      {/* Materiales Modal */}
      {selectedFaseForMateriales && (
        <MaterialesFaseModal
          open={materialesModalOpen}
          onOpenChange={setMaterialesModalOpen}
          faseId={selectedFaseForMateriales.id}
          faseTitulo={selectedFaseForMateriales.titulo}
          tallerId={tallerId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteType} onOpenChange={() => { setDeleteType(null); setItemToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {deleteType === 'fase' ? 'fase' : 'flujo'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'fase' 
                ? "Esta acción eliminará la fase y todos sus flujos asociados."
                : "Esta acción no se puede deshacer."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
