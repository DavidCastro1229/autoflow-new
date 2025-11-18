import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Eye, Pencil, Trash2, Users, Mail, Phone, MapPin, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface Cargo {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  orden: number;
}

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
  cargo_id: string;
  fecha_contratacion: string;
  salario: number;
  frecuencia_pago: string;
  estado: string;
  notas: string | null;
  created_at: string;
  cargos_administrativos?: {
    nombre: string;
    emoji: string;
    color: string;
  };
}

const FRECUENCIAS_PAGO = ["Semanal", "Quincenal", "Mensual"];

export default function Equipo() {
  const { tallerId } = useUserRole();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [filteredMiembros, setFilteredMiembros] = useState<Miembro[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cargos, setCargos] = useState<Cargo[]>([]);
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
    cargo_id: "",
    fecha_contratacion: format(new Date(), "yyyy-MM-dd"),
    salario: "",
    frecuencia_pago: "Mensual",
    estado: "activo",
    notas: ""
  });

  useEffect(() => {
    if (tallerId) {
      fetchCargos();
      fetchMiembros();
    }
  }, [tallerId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMiembros(miembros);
    } else {
      const filtered = miembros.filter(miembro => 
        miembro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        miembro.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        miembro.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        miembro.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        miembro.telefono.includes(searchTerm)
      );
      setFilteredMiembros(filtered);
    }
  }, [searchTerm, miembros]);

  const fetchCargos = async () => {
    const { data, error } = await supabase
      .from("cargos_administrativos")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (error) {
      toast.error("Error al cargar cargos");
      console.error(error);
    } else {
      setCargos(data || []);
    }
  };

  const fetchMiembros = async () => {
    if (!tallerId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("equipo")
      .select(`
        *,
        cargos_administrativos (
          nombre,
          emoji,
          color
        )
      `)
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

    const cargo = cargos.find(c => c.id === formData.cargo_id);
    const miembroData = {
      taller_id: tallerId,
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      telefono: formData.telefono,
      direccion: formData.direccion,
      fecha_nacimiento: formData.fecha_nacimiento || null,
      documento_identidad: formData.documento_identidad || null,
      cargo: cargo?.nombre || "",
      cargo_id: formData.cargo_id,
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
      cargo_id: "",
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
      cargo_id: miembro.cargo_id,
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

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
      yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
      slate: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
      amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
      gray: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipo Administrativo</h1>
          <p className="text-muted-foreground">Gestión del personal administrativo del taller</p>
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
                  <Label htmlFor="cargo_id">Cargo *</Label>
                  <Select
                    value={formData.cargo_id}
                    onValueChange={(value) => setFormData({ ...formData, cargo_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargos.map((cargo) => (
                        <SelectItem key={cargo.id} value={cargo.id}>
                          {cargo.emoji} {cargo.nombre}
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

      {/* Search bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Input
              placeholder="Buscar por nombre, email, cargo o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando miembros...</p>
        </div>
      ) : filteredMiembros.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              {searchTerm ? "No se encontraron miembros con ese criterio de búsqueda" : "No hay miembros del equipo administrativo registrados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMiembros.map((miembro) => (
            <Card key={miembro.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {miembro.nombre} {miembro.apellido}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge className={getColorClasses(miembro.cargos_administrativos?.color || "blue")}>
                        {miembro.cargos_administrativos?.emoji} {miembro.cargos_administrativos?.nombre || miembro.cargo}
                      </Badge>
                      {getEstadoBadge(miembro.estado)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Salario:</span>
                    <span className="text-muted-foreground ml-auto">
                      L {miembro.salario.toLocaleString()} / {miembro.frecuencia_pago}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Contratado:</span>
                    <span className="text-muted-foreground ml-auto">
                      {format(new Date(miembro.fecha_contratacion), "dd/MM/yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{miembro.telefono}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{miembro.email}</span>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">{miembro.direccion}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openDetailDialog(miembro)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(miembro)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(miembro.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                    <Badge className={getColorClasses(selectedMiembro.cargos_administrativos?.color || "blue")}>
                      {selectedMiembro.cargos_administrativos?.emoji} {selectedMiembro.cargos_administrativos?.nombre || selectedMiembro.cargo}
                    </Badge>
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
