import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Eye, Pencil, Trash2, Users } from "lucide-react";
import { format } from "date-fns";

interface Miembro {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string | null;
  documento_identidad: string | null;
  cargo: string;
  fecha_contratacion: string;
  salario: number;
  frecuencia_pago: string;
  estado: string;
  notas: string | null;
  created_at: string;
}

const CARGOS = [
  "Jefe de Taller",
  "Gerente General",
  "Recepcionista",
  "Asesor de Servicio",
  "Mecánico",
  "Electricista",
  "Pintor",
  "Hojalatero",
  "Contador",
  "Auxiliar Administrativo",
  "Supervisor de Calidad",
  "Almacenista",
  "Vendedor de Repuestos"
];

const FRECUENCIAS_PAGO = ["Semanal", "Quincenal", "Mensual"];

export default function Equipo() {
  const { tallerId } = useUserRole();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMiembro, setSelectedMiembro] = useState<Miembro | null>(null);
  const [miembroToDelete, setMiembroToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    documento_identidad: "",
    cargo: "",
    fecha_contratacion: format(new Date(), "yyyy-MM-dd"),
    salario: "",
    frecuencia_pago: "Mensual",
    estado: "activo",
    notas: ""
  });

  useEffect(() => {
    if (tallerId) {
      fetchMiembros();
    }
  }, [tallerId]);

  const fetchMiembros = async () => {
    if (!tallerId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("equipo")
      .select("*")
      .eq("taller_id", tallerId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar miembros");
      console.error(error);
    } else {
      setMiembros(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tallerId) return;

    const miembroData = {
      taller_id: tallerId,
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      telefono: formData.telefono,
      direccion: formData.direccion,
      fecha_nacimiento: formData.fecha_nacimiento || null,
      documento_identidad: formData.documento_identidad || null,
      cargo: formData.cargo,
      fecha_contratacion: formData.fecha_contratacion,
      salario: parseFloat(formData.salario),
      frecuencia_pago: formData.frecuencia_pago.toLowerCase(),
      estado: formData.estado,
      notas: formData.notas || null
    };

    if (selectedMiembro) {
      const { error } = await supabase
        .from("equipo")
        .update(miembroData)
        .eq("id", selectedMiembro.id);

      if (error) {
        toast.error("Error al actualizar miembro");
        console.error(error);
      } else {
        toast.success("Miembro actualizado exitosamente");
        setDialogOpen(false);
        resetForm();
        fetchMiembros();
      }
    } else {
      const { error } = await supabase
        .from("equipo")
        .insert([miembroData]);

      if (error) {
        toast.error("Error al crear miembro");
        console.error(error);
      } else {
        toast.success("Miembro creado exitosamente");
        setDialogOpen(false);
        resetForm();
        fetchMiembros();
      }
    }
  };

  const handleDelete = async () => {
    if (!miembroToDelete) return;

    const { error } = await supabase
      .from("equipo")
      .delete()
      .eq("id", miembroToDelete);

    if (error) {
      toast.error("Error al eliminar miembro");
      console.error(error);
    } else {
      toast.success("Miembro eliminado exitosamente");
      setDeleteDialogOpen(false);
      setMiembroToDelete(null);
      fetchMiembros();
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      direccion: "",
      fecha_nacimiento: "",
      documento_identidad: "",
      cargo: "",
      fecha_contratacion: format(new Date(), "yyyy-MM-dd"),
      salario: "",
      frecuencia_pago: "Mensual",
      estado: "activo",
      notas: ""
    });
    setSelectedMiembro(null);
  };

  const openEditDialog = (miembro: Miembro) => {
    setSelectedMiembro(miembro);
    setFormData({
      nombre: miembro.nombre,
      apellido: miembro.apellido,
      email: miembro.email,
      telefono: miembro.telefono,
      direccion: miembro.direccion,
      fecha_nacimiento: miembro.fecha_nacimiento || "",
      documento_identidad: miembro.documento_identidad || "",
      cargo: miembro.cargo,
      fecha_contratacion: miembro.fecha_contratacion,
      salario: miembro.salario.toString(),
      frecuencia_pago: miembro.frecuencia_pago.charAt(0).toUpperCase() + miembro.frecuencia_pago.slice(1),
      estado: miembro.estado,
      notas: miembro.notas || ""
    });
    setDialogOpen(true);
  };

  const openDetailDialog = (miembro: Miembro) => {
    setSelectedMiembro(miembro);
    setDetailDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setMiembroToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getEstadoBadge = (estado: string) => {
    return estado === "activo" 
      ? <Badge variant="default">Activo</Badge>
      : <Badge variant="secondary">Inactivo</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipo de Trabajo</h1>
          <p className="text-muted-foreground">Gestión de miembros del equipo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Miembro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMiembro ? "Editar Miembro" : "Agregar Nuevo Miembro"}</DialogTitle>
              <DialogDescription>
                Complete los datos del miembro del equipo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                  <Input
                    id="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento_identidad">Documento de Identidad</Label>
                  <Input
                    id="documento_identidad"
                    value={formData.documento_identidad}
                    onChange={(e) => setFormData({ ...formData, documento_identidad: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Select
                    value={formData.cargo}
                    onValueChange={(value) => setFormData({ ...formData, cargo: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARGOS.map((cargo) => (
                        <SelectItem key={cargo} value={cargo}>
                          {cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_contratacion">Fecha de Contratación *</Label>
                  <Input
                    id="fecha_contratacion"
                    type="date"
                    value={formData.fecha_contratacion}
                    onChange={(e) => setFormData({ ...formData, fecha_contratacion: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salario">Salario *</Label>
                  <Input
                    id="salario"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salario}
                    onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frecuencia_pago">Frecuencia de Pago *</Label>
                  <Select
                    value={formData.frecuencia_pago}
                    onValueChange={(value) => setFormData({ ...formData, frecuencia_pago: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FRECUENCIAS_PAGO.map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {freq}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedMiembro ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Miembros
          </CardTitle>
          <CardDescription>
            {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} registrado{miembros.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando...</p>
          ) : miembros.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay miembros registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {miembros.map((miembro) => (
                  <TableRow key={miembro.id}>
                    <TableCell className="font-medium">
                      {miembro.nombre} {miembro.apellido}
                    </TableCell>
                    <TableCell>{miembro.cargo}</TableCell>
                    <TableCell>{miembro.email}</TableCell>
                    <TableCell>{miembro.telefono}</TableCell>
                    <TableCell>
                      L {miembro.salario.toLocaleString()} / {miembro.frecuencia_pago}
                    </TableCell>
                    <TableCell>{getEstadoBadge(miembro.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailDialog(miembro)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(miembro)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(miembro.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Miembro</DialogTitle>
          </DialogHeader>
          {selectedMiembro && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Información Personal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre Completo</Label>
                    <p className="font-medium">{selectedMiembro.nombre} {selectedMiembro.apellido}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedMiembro.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{selectedMiembro.telefono}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Documento</Label>
                    <p className="font-medium">{selectedMiembro.documento_identidad || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Dirección</Label>
                    <p className="font-medium">{selectedMiembro.direccion}</p>
                  </div>
                  {selectedMiembro.fecha_nacimiento && (
                    <div>
                      <Label className="text-muted-foreground">Fecha de Nacimiento</Label>
                      <p className="font-medium">{format(new Date(selectedMiembro.fecha_nacimiento), "dd/MM/yyyy")}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Información Laboral</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Cargo</Label>
                    <p className="font-medium">{selectedMiembro.cargo}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div>{getEstadoBadge(selectedMiembro.estado)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fecha de Contratación</Label>
                    <p className="font-medium">{format(new Date(selectedMiembro.fecha_contratacion), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Salario</Label>
                    <p className="font-medium">L {selectedMiembro.salario.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Frecuencia de Pago</Label>
                    <p className="font-medium capitalize">{selectedMiembro.frecuencia_pago}</p>
                  </div>
                </div>
              </div>

              {selectedMiembro.notas && (
                <div>
                  <Label className="text-muted-foreground">Notas</Label>
                  <p className="font-medium mt-1">{selectedMiembro.notas}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el miembro del equipo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMiembroToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
