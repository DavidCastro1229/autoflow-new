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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  Save,
  X
} from "lucide-react";

interface PlantillaFaseFlujo {
  id: string;
  plantilla_fase_id: string;
  titulo: string;
  color: string;
  tiempo_estimado: number | null;
  unidad_tiempo: 'minutos' | 'horas' | null;
  numero_orden: number;
}

interface PlantillaFase {
  id: string;
  titulo: string;
  color: string;
  tiempo_estimado: number | null;
  unidad_tiempo: 'minutos' | 'horas' | null;
  taller_id: string;
  plantilla_fase_flujos?: PlantillaFaseFlujo[];
}

interface PlantillasFasesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tallerId: string;
}

const COLORES_PREDEFINIDOS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

export function PlantillasFasesManager({
  open,
  onOpenChange,
  tallerId,
}: PlantillasFasesManagerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plantillas, setPlantillas] = useState<PlantillaFase[]>([]);
  
  // Form states for new plantilla
  const [showNewPlantillaForm, setShowNewPlantillaForm] = useState(false);
  const [newPlantilla, setNewPlantilla] = useState({
    titulo: "",
    color: "#3B82F6",
    tiempo_estimado: 0,
    unidad_tiempo: "minutos" as 'minutos' | 'horas',
  });
  
  // Form states for new flujo
  const [addingFlujoToPlantilla, setAddingFlujoToPlantilla] = useState<string | null>(null);
  const [newFlujo, setNewFlujo] = useState({
    titulo: "",
    color: "#3B82F6",
    tiempo_estimado: 0,
    unidad_tiempo: "minutos" as 'minutos' | 'horas',
  });
  
  // Edit states
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaFase | null>(null);
  const [editingFlujo, setEditingFlujo] = useState<PlantillaFaseFlujo | null>(null);
  
  // Delete states
  const [deleteType, setDeleteType] = useState<'plantilla' | 'flujo' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PlantillaFase | PlantillaFaseFlujo | null>(null);

  useEffect(() => {
    if (open) {
      fetchPlantillas();
    }
  }, [open, tallerId]);

  const fetchPlantillas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plantillas_fases")
        .select(`
          id, titulo, color, tiempo_estimado, unidad_tiempo, taller_id,
          plantilla_fase_flujos (
            id, plantilla_fase_id, titulo, color, tiempo_estimado, unidad_tiempo, numero_orden
          )
        `)
        .eq("taller_id", tallerId)
        .order("titulo");

      if (error) throw error;
      setPlantillas(data || []);
    } catch (error: any) {
      console.error("Error fetching plantillas:", error);
      toast.error("Error al cargar las plantillas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlantilla = async () => {
    if (!newPlantilla.titulo.trim()) {
      toast.error("El título es requerido");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("plantillas_fases")
        .insert({
          taller_id: tallerId,
          titulo: newPlantilla.titulo,
          color: newPlantilla.color,
          tiempo_estimado: newPlantilla.tiempo_estimado,
          unidad_tiempo: newPlantilla.unidad_tiempo,
        });

      if (error) throw error;

      toast.success("Plantilla creada exitosamente");
      setNewPlantilla({
        titulo: "",
        color: "#3B82F6",
        tiempo_estimado: 0,
        unidad_tiempo: "minutos",
      });
      setShowNewPlantillaForm(false);
      fetchPlantillas();
    } catch (error: any) {
      console.error("Error creating plantilla:", error);
      toast.error("Error al crear la plantilla");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePlantilla = async () => {
    if (!editingPlantilla) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("plantillas_fases")
        .update({
          titulo: editingPlantilla.titulo,
          color: editingPlantilla.color,
          tiempo_estimado: editingPlantilla.tiempo_estimado,
          unidad_tiempo: editingPlantilla.unidad_tiempo,
        })
        .eq("id", editingPlantilla.id);

      if (error) throw error;

      toast.success("Plantilla actualizada");
      setEditingPlantilla(null);
      fetchPlantillas();
    } catch (error: any) {
      console.error("Error updating plantilla:", error);
      toast.error("Error al actualizar la plantilla");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFlujo = async (plantillaId: string) => {
    if (!newFlujo.titulo.trim()) {
      toast.error("El título es requerido");
      return;
    }

    const plantilla = plantillas.find(p => p.id === plantillaId);
    const existingFlujos = plantilla?.plantilla_fase_flujos || [];
    const nextOrden = existingFlujos.length > 0 
      ? Math.max(...existingFlujos.map(f => f.numero_orden)) + 1 
      : 1;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("plantilla_fase_flujos")
        .insert({
          plantilla_fase_id: plantillaId,
          titulo: newFlujo.titulo,
          color: newFlujo.color,
          tiempo_estimado: newFlujo.tiempo_estimado,
          unidad_tiempo: newFlujo.unidad_tiempo,
          numero_orden: nextOrden,
        });

      if (error) throw error;

      toast.success("Flujo agregado");
      setNewFlujo({
        titulo: "",
        color: "#3B82F6",
        tiempo_estimado: 0,
        unidad_tiempo: "minutos",
      });
      setAddingFlujoToPlantilla(null);
      fetchPlantillas();
    } catch (error: any) {
      console.error("Error adding flujo:", error);
      toast.error("Error al agregar el flujo");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFlujo = async () => {
    if (!editingFlujo) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("plantilla_fase_flujos")
        .update({
          titulo: editingFlujo.titulo,
          color: editingFlujo.color,
          tiempo_estimado: editingFlujo.tiempo_estimado,
          unidad_tiempo: editingFlujo.unidad_tiempo,
        })
        .eq("id", editingFlujo.id);

      if (error) throw error;

      toast.success("Flujo actualizado");
      setEditingFlujo(null);
      fetchPlantillas();
    } catch (error: any) {
      console.error("Error updating flujo:", error);
      toast.error("Error al actualizar el flujo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    try {
      if (deleteType === 'plantilla') {
        const { error } = await supabase
          .from("plantillas_fases")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) throw error;
        toast.success("Plantilla eliminada");
      } else {
        const { error } = await supabase
          .from("plantilla_fase_flujos")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) throw error;
        toast.success("Flujo eliminado");
      }

      fetchPlantillas();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar");
    } finally {
      setDeleteType(null);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Plantillas de Fases y Flujos
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Crea y gestiona plantillas reutilizables para tus fases con flujos predefinidos
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-150px)] px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Create new plantilla button/form */}
                {!showNewPlantillaForm ? (
                  <Button onClick={() => setShowNewPlantillaForm(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Plantilla de Fase
                  </Button>
                ) : (
                  <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    <h3 className="font-medium">Nueva Plantilla</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Título *</label>
                        <Input
                          value={newPlantilla.titulo}
                          onChange={(e) => setNewPlantilla(prev => ({ ...prev, titulo: e.target.value }))}
                          placeholder="Ej: Diagnóstico inicial"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Color</label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-md border"
                            style={{ backgroundColor: newPlantilla.color }}
                          />
                          <div className="flex gap-1">
                            {COLORES_PREDEFINIDOS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-6 h-6 rounded-md border-2 ${newPlantilla.color === color ? 'border-foreground' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewPlantilla(prev => ({ ...prev, color }))}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Tiempo Estimado</label>
                        <Input
                          type="number"
                          min={0}
                          value={newPlantilla.tiempo_estimado}
                          onChange={(e) => setNewPlantilla(prev => ({ ...prev, tiempo_estimado: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Unidad</label>
                        <Select 
                          value={newPlantilla.unidad_tiempo}
                          onValueChange={(val) => setNewPlantilla(prev => ({ ...prev, unidad_tiempo: val as 'minutos' | 'horas' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minutos">Minutos</SelectItem>
                            <SelectItem value="horas">Horas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreatePlantilla} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewPlantillaForm(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Plantillas list */}
                {plantillas.length === 0 && !showNewPlantillaForm ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay plantillas de fases.</p>
                    <p className="text-sm">Crea tu primera plantilla para comenzar.</p>
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {plantillas.map((plantilla) => (
                      <AccordionItem 
                        key={plantilla.id} 
                        value={plantilla.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                          <div className="flex items-center gap-3 flex-1">
                            <div 
                              className="w-4 h-4 rounded-full shrink-0"
                              style={{ backgroundColor: plantilla.color }}
                            />
                            <span className="font-medium">{plantilla.titulo}</span>
                            <div className="flex items-center gap-2 ml-auto mr-4">
                              {plantilla.tiempo_estimado && plantilla.tiempo_estimado > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {plantilla.tiempo_estimado} {plantilla.unidad_tiempo}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {(plantilla.plantilla_fase_flujos || []).length} flujos
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {/* Plantilla actions */}
                          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingPlantilla(plantilla)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeleteType('plantilla');
                                setItemToDelete(plantilla);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          </div>

                          {/* Flujos list */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">Flujos de la Plantilla</h4>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setAddingFlujoToPlantilla(plantilla.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Agregar Flujo
                              </Button>
                            </div>

                            {/* New flujo form */}
                            {addingFlujoToPlantilla === plantilla.id && (
                              <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-medium">Título *</label>
                                    <Input
                                      value={newFlujo.titulo}
                                      onChange={(e) => setNewFlujo(prev => ({ ...prev, titulo: e.target.value }))}
                                      placeholder="Ej: Revisar nivel de aceite"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium">Color</label>
                                    <div className="flex gap-1">
                                      {COLORES_PREDEFINIDOS.slice(0, 4).map((color) => (
                                        <button
                                          key={color}
                                          type="button"
                                          className={`w-5 h-5 rounded-md border-2 ${newFlujo.color === color ? 'border-foreground' : 'border-transparent'}`}
                                          style={{ backgroundColor: color }}
                                          onClick={() => setNewFlujo(prev => ({ ...prev, color }))}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAddFlujo(plantilla.id)}
                                    disabled={saving}
                                  >
                                    {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                    Guardar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setAddingFlujoToPlantilla(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}

                            {(plantilla.plantilla_fase_flujos || []).length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">
                                No hay flujos definidos
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {(plantilla.plantilla_fase_flujos || [])
                                  .sort((a, b) => a.numero_orden - b.numero_orden)
                                  .map((flujo) => (
                                    <div 
                                      key={flujo.id}
                                      className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                                    >
                                      {editingFlujo?.id === flujo.id ? (
                                        <div className="flex items-center gap-2 flex-1">
                                          <Input
                                            value={editingFlujo.titulo}
                                            onChange={(e) => setEditingFlujo(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                                            className="h-8 text-sm"
                                          />
                                          <Button 
                                            size="sm" 
                                            onClick={handleUpdateFlujo}
                                            disabled={saving}
                                          >
                                            Guardar
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => setEditingFlujo(null)}
                                          >
                                            Cancelar
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-3">
                                            <div 
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: flujo.color }}
                                            />
                                            <span className="text-sm">
                                              {flujo.numero_orden}. {flujo.titulo}
                                            </span>
                                            {flujo.tiempo_estimado && flujo.tiempo_estimado > 0 && (
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
                                              onClick={() => setEditingFlujo(flujo)}
                                            >
                                              <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon"
                                              className="h-7 w-7 text-destructive hover:text-destructive"
                                              onClick={() => {
                                                setDeleteType('flujo');
                                                setItemToDelete(flujo);
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </>
                                      )}
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

      {/* Edit Plantilla Dialog */}
      <Dialog open={!!editingPlantilla} onOpenChange={() => setEditingPlantilla(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
          </DialogHeader>
          {editingPlantilla && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input
                  value={editingPlantilla.titulo}
                  onChange={(e) => setEditingPlantilla(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-md border"
                    style={{ backgroundColor: editingPlantilla.color }}
                  />
                  <div className="flex gap-1">
                    {COLORES_PREDEFINIDOS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-md border-2 ${editingPlantilla.color === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditingPlantilla(prev => prev ? { ...prev, color } : null)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tiempo Estimado</label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPlantilla.tiempo_estimado || 0}
                    onChange={(e) => setEditingPlantilla(prev => prev ? { ...prev, tiempo_estimado: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unidad</label>
                  <Select 
                    value={editingPlantilla.unidad_tiempo || "minutos"}
                    onValueChange={(val) => setEditingPlantilla(prev => prev ? { ...prev, unidad_tiempo: val as 'minutos' | 'horas' } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingPlantilla(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdatePlantilla} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteType} onOpenChange={() => { setDeleteType(null); setItemToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {deleteType === 'plantilla' ? 'plantilla' : 'flujo'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'plantilla' 
                ? "Esta acción eliminará la plantilla y todos sus flujos asociados."
                : "Esta acción no se puede deshacer."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
