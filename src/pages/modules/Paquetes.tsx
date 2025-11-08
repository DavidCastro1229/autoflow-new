import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Eye, Pencil, Trash2, PackageSearch } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Checkbox } from "@/components/ui/checkbox";

interface Servicio {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string | null;
}

interface Paquete {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_total: number;
  descuento: number | null;
  estado: boolean;
  created_at: string;
}

interface PaqueteConServicios extends Paquete {
  servicios: Servicio[];
}

const Paquetes = () => {
  const { tallerId } = useUserRole();
  const queryClient = useQueryClient();
  
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedPaquete, setSelectedPaquete] = useState<PaqueteConServicios | null>(null);
  const [editingPaquete, setEditingPaquete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    descuento: 0,
    estado: true,
    servicios_ids: [] as string[],
  });

  // Fetch servicios
  const { data: servicios = [], isLoading: loadingServicios } = useQuery({
    queryKey: ["servicios", tallerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicios")
        .select("*")
        .eq("taller_id", tallerId!)
        .eq("estado", true)
        .order("nombre");
      
      if (error) throw error;
      return data as Servicio[];
    },
    enabled: !!tallerId,
  });

  // Fetch paquetes
  const { data: paquetes = [], isLoading: loadingPaquetes } = useQuery({
    queryKey: ["paquetes", tallerId],
    queryFn: async () => {
      const { data: paquetesData, error: paquetesError } = await supabase
        .from("paquetes_servicios")
        .select("*")
        .eq("taller_id", tallerId!)
        .order("created_at", { ascending: false });
      
      if (paquetesError) throw paquetesError;

      const paquetesConServicios = await Promise.all(
        paquetesData.map(async (paquete) => {
          const { data: items, error: itemsError } = await supabase
            .from("paquete_servicio_items")
            .select(`
              servicio_id,
              servicios (id, nombre, precio, descripcion)
            `)
            .eq("paquete_id", paquete.id);
          
          if (itemsError) throw itemsError;
          
          const servicios = items.map((item: any) => item.servicios).filter(Boolean);
          
          return {
            ...paquete,
            servicios,
          };
        })
      );

      return paquetesConServicios as PaqueteConServicios[];
    },
    enabled: !!tallerId,
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      descuento: 0,
      estado: true,
      servicios_ids: [],
    });
    setEditingPaquete(null);
  };

  const calculatePrecioTotal = (serviciosIds: string[]) => {
    const total = servicios
      .filter(s => serviciosIds.includes(s.id))
      .reduce((sum, s) => sum + Number(s.precio), 0);
    
    const descuento = formData.descuento || 0;
    return total - (total * descuento / 100);
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const precioTotal = calculatePrecioTotal(data.servicios_ids);
      
      const { data: paquete, error: paqueteError } = await supabase
        .from("paquetes_servicios")
        .insert({
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          precio_total: precioTotal,
          descuento: data.descuento || 0,
          estado: data.estado,
          taller_id: tallerId,
        })
        .select()
        .single();

      if (paqueteError) throw paqueteError;

      const items = data.servicios_ids.map(servicioId => ({
        paquete_id: paquete.id,
        servicio_id: servicioId,
      }));

      const { error: itemsError } = await supabase
        .from("paquete_servicio_items")
        .insert(items);

      if (itemsError) throw itemsError;

      return paquete;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paquetes"] });
      toast.success("Paquete creado exitosamente");
      setOpenForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Error al crear paquete: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const precioTotal = calculatePrecioTotal(data.servicios_ids);
      
      const { error: updateError } = await supabase
        .from("paquetes_servicios")
        .update({
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          precio_total: precioTotal,
          descuento: data.descuento || 0,
          estado: data.estado,
        })
        .eq("id", editingPaquete!);

      if (updateError) throw updateError;

      await supabase
        .from("paquete_servicio_items")
        .delete()
        .eq("paquete_id", editingPaquete!);

      const items = data.servicios_ids.map(servicioId => ({
        paquete_id: editingPaquete!,
        servicio_id: servicioId,
      }));

      const { error: itemsError } = await supabase
        .from("paquete_servicio_items")
        .insert(items);

      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paquetes"] });
      toast.success("Paquete actualizado exitosamente");
      setOpenForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar paquete: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("paquetes_servicios")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paquetes"] });
      toast.success("Paquete eliminado exitosamente");
      setOpenDelete(false);
      setSelectedPaquete(null);
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar paquete: ${error.message}`);
    },
  });

  const handleEdit = (paquete: PaqueteConServicios) => {
    setFormData({
      nombre: paquete.nombre,
      descripcion: paquete.descripcion || "",
      descuento: paquete.descuento || 0,
      estado: paquete.estado,
      servicios_ids: paquete.servicios.map(s => s.id),
    });
    setEditingPaquete(paquete.id);
    setOpenForm(true);
  };

  const handleDelete = (paquete: PaqueteConServicios) => {
    setSelectedPaquete(paquete);
    setOpenDelete(true);
  };

  const handleViewDetails = (paquete: PaqueteConServicios) => {
    setSelectedPaquete(paquete);
    setOpenDetails(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre del paquete es requerido");
      return;
    }

    if (formData.servicios_ids.length === 0) {
      toast.error("Debes seleccionar al menos un servicio");
      return;
    }

    if (editingPaquete) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleServicio = (servicioId: string) => {
    setFormData(prev => ({
      ...prev,
      servicios_ids: prev.servicios_ids.includes(servicioId)
        ? prev.servicios_ids.filter(id => id !== servicioId)
        : [...prev.servicios_ids, servicioId]
    }));
  };

  if (loadingPaquetes || loadingServicios) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PackageSearch className="h-8 w-8" />
            Gestión de Paquetes de Servicios
          </h1>
          <p className="text-muted-foreground">Crea y administra paquetes de servicios</p>
        </div>
        <Dialog open={openForm} onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Paquete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPaquete ? "Editar Paquete" : "Crear Nuevo Paquete"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Paquete *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Mantenimiento Completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el paquete de servicios"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descuento">Descuento (%)</Label>
                <Input
                  id="descuento"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.descuento}
                  onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="estado"
                  checked={formData.estado}
                  onCheckedChange={(checked) => setFormData({ ...formData, estado: checked })}
                />
                <Label htmlFor="estado">Paquete Activo</Label>
              </div>

              <div className="space-y-2">
                <Label>Servicios Incluidos *</Label>
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {servicios.map((servicio) => (
                    <div key={servicio.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                      <Checkbox
                        id={servicio.id}
                        checked={formData.servicios_ids.includes(servicio.id)}
                        onCheckedChange={() => toggleServicio(servicio.id)}
                      />
                      <label
                        htmlFor={servicio.id}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">{servicio.nombre}</div>
                        <div className="text-muted-foreground">${Number(servicio.precio).toFixed(2)}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {formData.servicios_ids.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Precio Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${calculatePrecioTotal(formData.servicios_ids).toFixed(2)}
                    </span>
                  </div>
                  {formData.descuento > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Descuento aplicado: {formData.descuento}%
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingPaquete ? "Actualizar" : "Crear"} Paquete
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Precio Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paquetes.map((paquete) => (
              <TableRow key={paquete.id}>
                <TableCell className="font-medium">{paquete.nombre}</TableCell>
                <TableCell>{paquete.servicios.length} servicios</TableCell>
                <TableCell>{paquete.descuento}%</TableCell>
                <TableCell className="font-bold">${Number(paquete.precio_total).toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    paquete.estado 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {paquete.estado ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(paquete)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(paquete)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(paquete)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Paquete</DialogTitle>
          </DialogHeader>
          {selectedPaquete && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPaquete.nombre}</h3>
                {selectedPaquete.descripcion && (
                  <p className="text-muted-foreground mt-1">{selectedPaquete.descripcion}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Descuento</p>
                  <p className="font-medium">{selectedPaquete.descuento}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Precio Total</p>
                  <p className="font-bold text-2xl text-primary">
                    ${Number(selectedPaquete.precio_total).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Servicios Incluidos:</h4>
                <div className="space-y-2">
                  {selectedPaquete.servicios.map((servicio) => (
                    <div key={servicio.id} className="flex justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{servicio.nombre}</p>
                        {servicio.descripcion && (
                          <p className="text-sm text-muted-foreground">{servicio.descripcion}</p>
                        )}
                      </div>
                      <p className="font-medium">${Number(servicio.precio).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el paquete "{selectedPaquete?.nombre}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPaquete && deleteMutation.mutate(selectedPaquete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Paquetes;
