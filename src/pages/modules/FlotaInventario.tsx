import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Trash2, Loader2, Pencil } from "lucide-react";

interface Vehiculo {
  id: string;
  numero_unidad: string;
  marca_modelo: string;
  numero_placa: string;
  numero_vin: string;
  anio_fabricacion: number;
  kilometraje_actual: number;
  estado_vehiculo: string;
}

export default function FlotaInventario() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    numero_unidad: "", marca_modelo: "", numero_placa: "", numero_vin: "",
    anio_fabricacion: new Date().getFullYear(), kilometraje_actual: 0, estado_vehiculo: "activo",
  });

  useEffect(() => {
    if (flotaId) fetchVehiculos();
  }, [flotaId]);

  const fetchVehiculos = async () => {
    try {
      const { data, error } = await supabase.from("flota_vehiculos").select("*").eq("flota_id", flotaId).order("created_at", { ascending: false });
      if (error) throw error;
      setVehiculos(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!flotaId) return;
    try {
      if (editingId) {
        const { error } = await supabase.from("flota_vehiculos").update(form).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("flota_vehiculos").insert([{ flota_id: flotaId, ...form }]);
        if (error) throw error;
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm({ numero_unidad: "", marca_modelo: "", numero_placa: "", numero_vin: "", anio_fabricacion: new Date().getFullYear(), kilometraje_actual: 0, estado_vehiculo: "activo" });
      fetchVehiculos();
      toast({ title: editingId ? "Actualizado" : "Creado", description: "Vehículo guardado correctamente" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (v: Vehiculo) => {
    setEditingId(v.id);
    setForm({ numero_unidad: v.numero_unidad, marca_modelo: v.marca_modelo, numero_placa: v.numero_placa, numero_vin: v.numero_vin, anio_fabricacion: v.anio_fabricacion, kilometraje_actual: v.kilometraje_actual, estado_vehiculo: v.estado_vehiculo });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("flota_vehiculos").delete().eq("id", id);
    fetchVehiculos();
    toast({ title: "Eliminado" });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Truck className="h-8 w-8 text-primary" />Inventario de Vehículos</h1>
          <p className="text-muted-foreground mt-1">{vehiculos.length} vehículos registrados</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ numero_unidad: "", marca_modelo: "", numero_placa: "", numero_vin: "", anio_fabricacion: new Date().getFullYear(), kilometraje_actual: 0, estado_vehiculo: "activo" }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Agregar Vehículo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Km</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiculos.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No hay vehículos registrados</TableCell></TableRow>
              ) : vehiculos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.numero_unidad}</TableCell>
                  <TableCell>{v.marca_modelo}</TableCell>
                  <TableCell>{v.numero_placa}</TableCell>
                  <TableCell className="font-mono text-xs">{v.numero_vin}</TableCell>
                  <TableCell>{v.anio_fabricacion}</TableCell>
                  <TableCell>{v.kilometraje_actual.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{v.estado_vehiculo}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Agregar"} Vehículo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Número de Unidad</Label><Input value={form.numero_unidad} onChange={(e) => setForm(p => ({ ...p, numero_unidad: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Marca/Modelo</Label><Input value={form.marca_modelo} onChange={(e) => setForm(p => ({ ...p, marca_modelo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Placa</Label><Input value={form.numero_placa} onChange={(e) => setForm(p => ({ ...p, numero_placa: e.target.value }))} /></div>
              <div className="space-y-2"><Label>VIN</Label><Input value={form.numero_vin} onChange={(e) => setForm(p => ({ ...p, numero_vin: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Año</Label><Input type="number" value={form.anio_fabricacion} onChange={(e) => setForm(p => ({ ...p, anio_fabricacion: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Kilometraje</Label><Input type="number" value={form.kilometraje_actual} onChange={(e) => setForm(p => ({ ...p, kilometraje_actual: parseInt(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>{editingId ? "Actualizar" : "Agregar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
