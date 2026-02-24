import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Loader2, Pencil } from "lucide-react";

interface Conductor {
  id: string;
  nombre: string;
  apellido: string;
  cedula_identidad: string;
  telefono: string;
  correo: string | null;
  numero_licencia: string;
  tipo_licencia: string;
  fecha_vencimiento_licencia: string;
  fecha_ingreso: string;
  fecha_nacimiento: string;
  direccion: string;
  fecha_emision_licencia: string;
}

const emptyForm = {
  nombre: "", apellido: "", cedula_identidad: "", telefono: "", correo: "",
  numero_licencia: "", tipo_licencia: "", fecha_vencimiento_licencia: "",
  fecha_ingreso: new Date().toISOString().split("T")[0],
  fecha_nacimiento: "", direccion: "", fecha_emision_licencia: "",
};

export default function FlotaConductores() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (flotaId) fetchConductores();
  }, [flotaId]);

  const fetchConductores = async () => {
    try {
      const { data, error } = await supabase.from("flota_conductores").select("*").eq("flota_id", flotaId).order("created_at", { ascending: false });
      if (error) throw error;
      setConductores(data || []);
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
        const { error } = await supabase.from("flota_conductores").update(form).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("flota_conductores").insert([{ flota_id: flotaId, ...form }]);
        if (error) throw error;
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchConductores();
      toast({ title: editingId ? "Actualizado" : "Creado" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (c: Conductor) => {
    setEditingId(c.id);
    setForm({
      nombre: c.nombre, apellido: c.apellido, cedula_identidad: c.cedula_identidad,
      telefono: c.telefono, correo: c.correo || "", numero_licencia: c.numero_licencia,
      tipo_licencia: c.tipo_licencia, fecha_vencimiento_licencia: c.fecha_vencimiento_licencia,
      fecha_ingreso: c.fecha_ingreso, fecha_nacimiento: c.fecha_nacimiento,
      direccion: c.direccion, fecha_emision_licencia: c.fecha_emision_licencia,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("flota_conductores").delete().eq("id", id);
    fetchConductores();
    toast({ title: "Eliminado" });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-8 w-8 text-primary" />Conductores</h1>
          <p className="text-muted-foreground mt-1">{conductores.length} conductores registrados</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Agregar Conductor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conductores.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay conductores</TableCell></TableRow>
              ) : conductores.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre} {c.apellido}</TableCell>
                  <TableCell>{c.cedula_identidad}</TableCell>
                  <TableCell>{c.telefono}</TableCell>
                  <TableCell>{c.numero_licencia}</TableCell>
                  <TableCell>{c.tipo_licencia}</TableCell>
                  <TableCell>{c.fecha_vencimiento_licencia}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Agregar"} Conductor</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Apellido</Label><Input value={form.apellido} onChange={(e) => setForm(p => ({ ...p, apellido: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Cédula de Identidad</Label><Input value={form.cedula_identidad} onChange={(e) => setForm(p => ({ ...p, cedula_identidad: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm(p => ({ ...p, telefono: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Correo</Label><Input value={form.correo} onChange={(e) => setForm(p => ({ ...p, correo: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Dirección</Label><Input value={form.direccion} onChange={(e) => setForm(p => ({ ...p, direccion: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Fecha de Nacimiento</Label><Input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm(p => ({ ...p, fecha_nacimiento: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Fecha de Ingreso</Label><Input type="date" value={form.fecha_ingreso} onChange={(e) => setForm(p => ({ ...p, fecha_ingreso: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Nº Licencia</Label><Input value={form.numero_licencia} onChange={(e) => setForm(p => ({ ...p, numero_licencia: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tipo Licencia</Label><Input value={form.tipo_licencia} onChange={(e) => setForm(p => ({ ...p, tipo_licencia: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Emisión</Label><Input type="date" value={form.fecha_emision_licencia} onChange={(e) => setForm(p => ({ ...p, fecha_emision_licencia: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Vencimiento Licencia</Label><Input type="date" value={form.fecha_vencimiento_licencia} onChange={(e) => setForm(p => ({ ...p, fecha_vencimiento_licencia: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>{editingId ? "Actualizar" : "Agregar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
