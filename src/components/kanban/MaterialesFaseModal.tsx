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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Package } from "lucide-react";

interface InventarioItem {
  id: string;
  codigo: string;
  nombre: string;
  stock_actual: number;
  precio_venta: number;
}

interface FaseMaterial {
  id: string;
  fase_id: string;
  inventario_id: string;
  cantidad: number;
  inventario?: InventarioItem;
}

interface MaterialesFaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faseId: string;
  faseTitulo: string;
  tallerId: string;
}

export function MaterialesFaseModal({
  open,
  onOpenChange,
  faseId,
  faseTitulo,
  tallerId,
}: MaterialesFaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [materiales, setMateriales] = useState<FaseMaterial[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [selectedInventarioId, setSelectedInventarioId] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(1);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, faseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [materialesRes, inventarioRes] = await Promise.all([
        supabase
          .from("fase_materiales")
          .select(`
            id,
            fase_id,
            inventario_id,
            cantidad,
            inventario:inventario_id (
              id,
              codigo,
              nombre,
              stock_actual,
              precio_venta
            )
          `)
          .eq("fase_id", faseId),
        supabase
          .from("inventario")
          .select("id, codigo, nombre, stock_actual, precio_venta")
          .eq("taller_id", tallerId)
          .eq("estado", "activo")
          .gt("stock_actual", 0)
          .order("nombre"),
      ]);

      if (materialesRes.error) throw materialesRes.error;
      if (inventarioRes.error) throw inventarioRes.error;

      setMateriales(materialesRes.data as FaseMaterial[] || []);
      setInventario(inventarioRes.data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedInventarioId) {
      toast.error("Selecciona un material del inventario");
      return;
    }

    if (cantidad <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    // Check if already added
    if (materiales.some(m => m.inventario_id === selectedInventarioId)) {
      toast.error("Este material ya está agregado");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("fase_materiales").insert({
        fase_id: faseId,
        inventario_id: selectedInventarioId,
        cantidad: cantidad,
      });

      if (error) throw error;

      toast.success("Material agregado");
      setSelectedInventarioId("");
      setCantidad(1);
      fetchData();
    } catch (error: any) {
      console.error("Error adding material:", error);
      toast.error("Error al agregar el material");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCantidad = async (materialId: string, newCantidad: number) => {
    if (newCantidad <= 0) return;

    try {
      const { error } = await supabase
        .from("fase_materiales")
        .update({ cantidad: newCantidad })
        .eq("id", materialId);

      if (error) throw error;

      setMateriales(prev => 
        prev.map(m => m.id === materialId ? { ...m, cantidad: newCantidad } : m)
      );
    } catch (error: any) {
      console.error("Error updating cantidad:", error);
      toast.error("Error al actualizar la cantidad");
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from("fase_materiales")
        .delete()
        .eq("id", materialId);

      if (error) throw error;

      toast.success("Material eliminado");
      setMateriales(prev => prev.filter(m => m.id !== materialId));
    } catch (error: any) {
      console.error("Error removing material:", error);
      toast.error("Error al eliminar el material");
    }
  };

  // Filter out already added items
  const availableInventario = inventario.filter(
    item => !materiales.some(m => m.inventario_id === item.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materiales - {faseTitulo}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add material form */}
            <div className="flex items-end gap-2 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Material del Inventario</label>
                <Select value={selectedInventarioId} onValueChange={setSelectedInventarioId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInventario.length === 0 ? (
                      <SelectItem value="" disabled>
                        No hay materiales disponibles
                      </SelectItem>
                    ) : (
                      availableInventario.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <span className="flex items-center gap-2">
                            <code className="text-xs">{item.codigo}</code>
                            {item.nombre}
                            <Badge variant="secondary" className="text-xs">
                              Stock: {item.stock_actual}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <label className="text-sm font-medium mb-1 block">Cantidad</label>
                <Input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button onClick={handleAddMaterial} disabled={saving || !selectedInventarioId}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            {/* Materials list */}
            {materiales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay materiales asignados a esta fase
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="w-24">Cantidad</TableHead>
                    <TableHead className="w-28">Precio Unit.</TableHead>
                    <TableHead className="w-28">Subtotal</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiales.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {material.inventario?.codigo}
                        </code>
                      </TableCell>
                      <TableCell>{material.inventario?.nombre}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={material.cantidad}
                          onChange={(e) => handleUpdateCantidad(material.id, parseInt(e.target.value) || 1)}
                          className="w-20 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        ${material.inventario?.precio_venta?.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${((material.inventario?.precio_venta || 0) * material.cantidad).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMaterial(material.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Total */}
            {materiales.length > 0 && (
              <div className="flex justify-end p-4 bg-muted rounded-lg">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Total Materiales:</span>
                  <span className="ml-2 text-lg font-bold">
                    ${materiales.reduce((sum, m) => sum + (m.inventario?.precio_venta || 0) * m.cantidad, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
