import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Loader2, Pencil, Eye } from "lucide-react";
import { PAISES_AMERICA } from "@/lib/countries";

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
  pais: string | null;
  ciudad: string | null;
  calificacion_desempeno: number | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  estado_civil: string | null;
  historial_asignaciones: string | null;
  limite_diario_viaticos: number | null;
  notas_viaticos: string | null;
  observaciones_desempeno: string | null;
  restricciones_licencia: string | null;
  vehiculo_asignado_actual: string | null;
  viaticos_autorizados: number | null;
}

const emptyForm = {
  nombre: "", apellido: "", cedula_identidad: "", telefono: "", correo: "",
  numero_licencia: "", tipo_licencia: "", fecha_vencimiento_licencia: "",
  fecha_ingreso: new Date().toISOString().split("T")[0],
  fecha_nacimiento: "", direccion: "", fecha_emision_licencia: "",
  pais: "", ciudad: "",
};

export default function FlotaConductores() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailConductor, setDetailConductor] = useState<Conductor | null>(null);

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
      const payload = { ...form, correo: form.correo || null, pais: form.pais || null, ciudad: form.ciudad || null };
      if (editingId) {
        const { error } = await supabase.from("flota_conductores").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("flota_conductores").insert([{ flota_id: flotaId, ...payload }]);
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
      pais: c.pais || "", ciudad: c.ciudad || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("flota_conductores").delete().eq("id", id);
    fetchConductores();
    toast({ title: "Eliminado" });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const DetailRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );

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
                      <Button variant="ghost" size="icon" onClick={() => setDetailConductor(c)}><Eye className="h-4 w-4" /></Button>
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

      {/* Form Dialog */}
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
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={form.pais} onValueChange={(v) => setForm(p => ({ ...p, pais: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
                  <SelectContent>
                    {PAISES_AMERICA.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Ciudad</Label><Input value={form.ciudad} onChange={(e) => setForm(p => ({ ...p, ciudad: e.target.value }))} /></div>
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

      {/* Detail Dialog */}
      <Dialog open={!!detailConductor} onOpenChange={() => setDetailConductor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalle del Conductor</DialogTitle></DialogHeader>
          {detailConductor && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Información Personal</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <DetailRow label="Nombre" value={`${detailConductor.nombre} ${detailConductor.apellido}`} />
                  <DetailRow label="Cédula" value={detailConductor.cedula_identidad} />
                  <DetailRow label="Teléfono" value={detailConductor.telefono} />
                  <DetailRow label="Correo" value={detailConductor.correo} />
                  <DetailRow label="Dirección" value={detailConductor.direccion} />
                  <DetailRow label="País" value={detailConductor.pais} />
                  <DetailRow label="Ciudad" value={detailConductor.ciudad} />
                  <DetailRow label="Fecha Nacimiento" value={detailConductor.fecha_nacimiento} />
                  <DetailRow label="Estado Civil" value={detailConductor.estado_civil} />
                  <DetailRow label="Fecha Ingreso" value={detailConductor.fecha_ingreso} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Licencia</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <DetailRow label="Nº Licencia" value={detailConductor.numero_licencia} />
                  <DetailRow label="Tipo" value={detailConductor.tipo_licencia} />
                  <DetailRow label="Emisión" value={detailConductor.fecha_emision_licencia} />
                  <DetailRow label="Vencimiento" value={detailConductor.fecha_vencimiento_licencia} />
                  <DetailRow label="Restricciones" value={detailConductor.restricciones_licencia} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Contacto de Emergencia</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Nombre" value={detailConductor.contacto_emergencia_nombre} />
                  <DetailRow label="Teléfono" value={detailConductor.contacto_emergencia_telefono} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Desempeño y Viáticos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <DetailRow label="Calificación" value={detailConductor.calificacion_desempeno} />
                  <DetailRow label="Observaciones" value={detailConductor.observaciones_desempeno} />
                  <DetailRow label="Vehículo Asignado" value={detailConductor.vehiculo_asignado_actual} />
                  <DetailRow label="Viáticos Autorizados" value={detailConductor.viaticos_autorizados} />
                  <DetailRow label="Límite Diario" value={detailConductor.limite_diario_viaticos} />
                  <DetailRow label="Notas Viáticos" value={detailConductor.notas_viaticos} />
                  <DetailRow label="Historial Asignaciones" value={detailConductor.historial_asignaciones} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
