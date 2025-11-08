import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Servicio {
  id: string;
  nombre: string;
  categoria_id: string;
  precio: number;
  tiempo_estimado: {
    dias: number;
    horas: number;
    minutos: number;
  };
  descripcion: string | null;
  materiales_requeridos: string[];
  estado: boolean;
  created_at: string;
  categoria?: {
    nombre: string;
  };
}

export default function Servicios() {
  const { role, tallerId } = useUserRole();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    categoria_id: "",
    precio: "",
    tiempo_dias: "0",
    tiempo_horas: "0",
    tiempo_minutos: "0",
    descripcion: "",
    estado: true,
  });
  const [materiales, setMateriales] = useState<string[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState("");

  // Fetch categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_servicio")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  // Fetch servicios
  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ["servicios", tallerId],
    queryFn: async () => {
      if (!tallerId) return [];
      const { data, error } = await supabase
        .from("servicios")
        .select(`
          *,
          categoria:categorias_servicio(nombre)
        `)
        .eq("taller_id", tallerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Servicio[];
    },
    enabled: !!tallerId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newServicio: any) => {
      const { error } = await supabase.from("servicios").insert([newServicio]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast.success("Servicio creado exitosamente");
      resetForm();
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error("Error al crear servicio: " + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from("servicios")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast.success("Servicio actualizado exitosamente");
      resetForm();
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error("Error al actualizar servicio: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast.success("Servicio eliminado exitosamente");
      setIsDeleteDialogOpen(false);
      setSelectedServicio(null);
    },
    onError: (error) => {
      toast.error("Error al eliminar servicio: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      categoria_id: "",
      precio: "",
      tiempo_dias: "0",
      tiempo_horas: "0",
      tiempo_minutos: "0",
      descripcion: "",
      estado: true,
    });
    setMateriales([]);
    setNuevoMaterial("");
    setEditingServicio(null);
  };

  const handleEdit = (servicio: Servicio) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      categoria_id: servicio.categoria_id,
      precio: servicio.precio.toString(),
      tiempo_dias: servicio.tiempo_estimado.dias.toString(),
      tiempo_horas: servicio.tiempo_estimado.horas.toString(),
      tiempo_minutos: servicio.tiempo_estimado.minutos.toString(),
      descripcion: servicio.descripcion || "",
      estado: servicio.estado,
    });
    setMateriales(servicio.materiales_requeridos || []);
    setIsFormOpen(true);
  };

  const handleDelete = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetails = (servicio: Servicio) => {
    setSelectedServicio(servicio);
    setIsDetailsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tallerId) {
      toast.error("No se pudo identificar el taller");
      return;
    }

    const servicioData = {
      taller_id: tallerId,
      nombre: formData.nombre,
      categoria_id: formData.categoria_id,
      precio: parseFloat(formData.precio),
      tiempo_estimado: {
        dias: parseInt(formData.tiempo_dias),
        horas: parseInt(formData.tiempo_horas),
        minutos: parseInt(formData.tiempo_minutos),
      },
      descripcion: formData.descripcion || null,
      materiales_requeridos: materiales,
      estado: formData.estado,
    };

    if (editingServicio) {
      updateMutation.mutate({ id: editingServicio.id, ...servicioData });
    } else {
      createMutation.mutate(servicioData);
    }
  };

  const agregarMaterial = () => {
    if (nuevoMaterial.trim()) {
      setMateriales([...materiales, nuevoMaterial.trim()]);
      setNuevoMaterial("");
    }
  };

  const eliminarMaterial = (index: number) => {
    setMateriales(materiales.filter((_, i) => i !== index));
  };

  const formatTiempoEstimado = (tiempo: { dias: number; horas: number; minutos: number }) => {
    const parts = [];
    if (tiempo.dias > 0) parts.push(`${tiempo.dias}d`);
    if (tiempo.horas > 0) parts.push(`${tiempo.horas}h`);
    if (tiempo.minutos > 0) parts.push(`${tiempo.minutos}m`);
    return parts.length > 0 ? parts.join(" ") : "N/A";
  };

  if (isLoading) {
    return <div className="p-6">Cargando servicios...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Servicios</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Tiempo Estimado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell className="font-medium">{servicio.nombre}</TableCell>
                  <TableCell>{servicio.categoria?.nombre}</TableCell>
                  <TableCell>${servicio.precio.toFixed(2)}</TableCell>
                  <TableCell>{formatTiempoEstimado(servicio.tiempo_estimado)}</TableCell>
                  <TableCell>
                    <Badge variant={servicio.estado ? "default" : "secondary"}>
                      {servicio.estado ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(servicio)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(servicio)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(servicio)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingServicio ? "Editar Servicio" : "Nuevo Servicio"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Servicio *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoria_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="precio">Precio (USD) *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Tiempo Estimado</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="dias" className="text-xs">Días</Label>
                  <Input
                    id="dias"
                    type="number"
                    min="0"
                    value={formData.tiempo_dias}
                    onChange={(e) =>
                      setFormData({ ...formData, tiempo_dias: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="horas" className="text-xs">Horas</Label>
                  <Input
                    id="horas"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.tiempo_horas}
                    onChange={(e) =>
                      setFormData({ ...formData, tiempo_horas: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="minutos" className="text-xs">Minutos</Label>
                  <Input
                    id="minutos"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.tiempo_minutos}
                    onChange={(e) =>
                      setFormData({ ...formData, tiempo_minutos: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label>Materiales Requeridos</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={nuevoMaterial}
                  onChange={(e) => setNuevoMaterial(e.target.value)}
                  placeholder="Agregar material"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarMaterial();
                    }
                  }}
                />
                <Button type="button" onClick={agregarMaterial}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {materiales.map((material, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {material}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => eliminarMaterial(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="estado"
                checked={formData.estado}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, estado: checked })
                }
              />
              <Label htmlFor="estado">Servicio Activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingServicio ? "Actualizar" : "Crear"} Servicio
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Servicio</DialogTitle>
          </DialogHeader>
          {selectedServicio && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="text-lg font-semibold">{selectedServicio.nombre}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Categoría</Label>
                  <p>{selectedServicio.categoria?.nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Precio</Label>
                  <p className="text-lg font-semibold">
                    ${selectedServicio.precio.toFixed(2)} USD
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Tiempo Estimado</Label>
                <p>{formatTiempoEstimado(selectedServicio.tiempo_estimado)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Descripción</Label>
                <p>{selectedServicio.descripcion || "Sin descripción"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Materiales Requeridos</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedServicio.materiales_requeridos?.length > 0 ? (
                    selectedServicio.materiales_requeridos.map((material, index) => (
                      <Badge key={index} variant="secondary">
                        {material}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay materiales registrados
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1">
                  <Badge variant={selectedServicio.estado ? "default" : "secondary"}>
                    {selectedServicio.estado ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El servicio "{selectedServicio?.nombre}"
              será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedServicio && deleteMutation.mutate(selectedServicio.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
