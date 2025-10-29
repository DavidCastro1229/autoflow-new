import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wrench, Award, Eye, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

type AreaTecnico = "tecnico" | "tecnico_senior";

interface Especialidad {
  id: number;
  nombre: string;
}

interface Tecnico {
  id: string;
  nombre: string;
  apellido: string;
  area: AreaTecnico;
  especialidad_id: number;
  experiencia: string;
  telefono: string;
  direccion: string;
  habilidades: string | null;
  certificaciones: string | null;
  email: string;
  created_at: string;
  especialidades_taller?: {
    nombre: string;
  };
}

interface TecnicoFormData {
  nombre: string;
  apellido: string;
  area: AreaTecnico;
  especialidad_id: string;
  experiencia: string;
  telefono: string;
  direccion: string;
  habilidades: string;
  certificaciones: string;
  email: string;
  password: string;
}

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTecnico, setSelectedTecnico] = useState<Tecnico | null>(null);
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, watch } = useForm<TecnicoFormData>();
  const editForm = useForm<Omit<TecnicoFormData, 'password'>>();

  useEffect(() => {
    fetchTecnicos();
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = async () => {
    try {
      const { data, error } = await supabase
        .from("especialidades_taller")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setEspecialidades(data || []);
    } catch (error: any) {
      console.error("Error fetching especialidades:", error);
    }
  };

  const fetchTecnicos = async () => {
    try {
      const { data, error } = await supabase
        .from("tecnicos")
        .select(`
          *,
          especialidades_taller (
            nombre
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTecnicos(data || []);
    } catch (error: any) {
      console.error("Error fetching tecnicos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los técnicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: TecnicoFormData) => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const { data, error } = await supabase.functions.invoke("create-tecnico", {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Técnico creado",
        description: `${formData.nombre} ${formData.apellido} ha sido registrado exitosamente`,
      });

      reset();
      setDialogOpen(false);
      fetchTecnicos();
    } catch (error: any) {
      console.error("Error creating tecnico:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el técnico",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAreaBadgeVariant = (area: AreaTecnico): "default" | "secondary" => {
    return area === "tecnico_senior" ? "secondary" : "default";
  };

  const handleViewDetail = (tecnico: Tecnico) => {
    setSelectedTecnico(tecnico);
    setDetailDialogOpen(true);
  };

  const handleEdit = (tecnico: Tecnico) => {
    setSelectedTecnico(tecnico);
    editForm.reset({
      nombre: tecnico.nombre,
      apellido: tecnico.apellido,
      area: tecnico.area,
      especialidad_id: tecnico.especialidad_id.toString(),
      experiencia: tecnico.experiencia,
      telefono: tecnico.telefono,
      direccion: tecnico.direccion,
      habilidades: tecnico.habilidades || "",
      certificaciones: tecnico.certificaciones || "",
      email: tecnico.email,
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (formData: Omit<TecnicoFormData, 'password'>) => {
    if (!selectedTecnico) return;
    
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const { error } = await supabase.functions.invoke("update-tecnico", {
        body: {
          tecnico_id: selectedTecnico.id,
          ...formData,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Técnico actualizado",
        description: `Los datos de ${formData.nombre} ${formData.apellido} se han actualizado exitosamente`,
      });

      setEditDialogOpen(false);
      fetchTecnicos();
    } catch (error: any) {
      console.error("Error updating tecnico:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el técnico",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (tecnico: Tecnico) => {
    setSelectedTecnico(tecnico);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTecnico) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const { error } = await supabase.functions.invoke("delete-tecnico", {
        body: {
          tecnico_id: selectedTecnico.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Técnico eliminado",
        description: `${selectedTecnico.nombre} ${selectedTecnico.apellido} ha sido eliminado del sistema`,
      });

      setDeleteDialogOpen(false);
      setSelectedTecnico(null);
      fetchTecnicos();
    } catch (error: any) {
      console.error("Error deleting tecnico:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el técnico",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Técnicos</h1>
          <p className="text-muted-foreground">Administración de técnicos y mecánicos del taller</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Técnico
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Técnico</DialogTitle>
              <DialogDescription>
                Complete los datos del técnico para registrarlo en el sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    {...register("nombre", { required: true })}
                    placeholder="Juan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    {...register("apellido", { required: true })}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Área *</Label>
                  <Select onValueChange={(value) => setValue("area", value as AreaTecnico)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="tecnico_senior">Técnico Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="especialidad_id">Especialidad *</Label>
                  <Select onValueChange={(value) => setValue("especialidad_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id.toString()}>
                          {esp.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experiencia">Experiencia *</Label>
                <Input
                  id="experiencia"
                  {...register("experiencia", { required: true })}
                  placeholder="Ej: 5 años"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    {...register("telefono", { required: true })}
                    placeholder="+52 123 456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", { required: true })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  {...register("direccion", { required: true })}
                  placeholder="Calle, número, colonia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="habilidades">Habilidades</Label>
                <Textarea
                  id="habilidades"
                  {...register("habilidades")}
                  placeholder="Separar por comas: Ej. Soldadura, Pintura automotriz, Diagnóstico electrónico"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificaciones">Certificaciones</Label>
                <Textarea
                  id="certificaciones"
                  {...register("certificaciones")}
                  placeholder="Separar por comas: Ej. ASE Certified, Certificación Toyota, ISO 9001"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password", { required: true })}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Registrando..." : "Registrar Técnico"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Lista de Técnicos
          </CardTitle>
          <CardDescription>
            {tecnicos.length} técnico{tecnicos.length !== 1 ? "s" : ""} registrado{tecnicos.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando técnicos...</p>
          ) : tecnicos.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay técnicos registrados. Crea uno usando el botón "Nuevo Técnico"
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Experiencia</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tecnicos.map((tecnico) => (
                  <TableRow key={tecnico.id}>
                    <TableCell className="font-medium">
                      {tecnico.nombre} {tecnico.apellido}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAreaBadgeVariant(tecnico.area)}>
                        {tecnico.area === "tecnico_senior" ? "Técnico Senior" : "Técnico"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Award className="h-3 w-3" />
                        {tecnico.especialidades_taller?.nombre || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{tecnico.experiencia}</TableCell>
                    <TableCell>{tecnico.telefono}</TableCell>
                    <TableCell>{tecnico.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(tecnico)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tecnico)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(tecnico)}
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Dialog de detalle del técnico */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Técnico</DialogTitle>
            <DialogDescription>
              Información completa del técnico
            </DialogDescription>
          </DialogHeader>
          {selectedTecnico && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nombre Completo</Label>
                  <p className="font-medium">{selectedTecnico.nombre} {selectedTecnico.apellido}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Área</Label>
                  <div>
                    <Badge variant={getAreaBadgeVariant(selectedTecnico.area)}>
                      {selectedTecnico.area === "tecnico_senior" ? "Técnico Senior" : "Técnico"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Especialidad</Label>
                  <div>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Award className="h-3 w-3" />
                      {selectedTecnico.especialidades_taller?.nombre || "N/A"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Experiencia</Label>
                  <p className="font-medium">{selectedTecnico.experiencia}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedTecnico.telefono}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedTecnico.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Dirección</Label>
                <p className="font-medium">{selectedTecnico.direccion}</p>
              </div>

              {selectedTecnico.habilidades && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Habilidades</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTecnico.habilidades.split(',').map((habilidad, index) => (
                      <Badge key={index} variant="secondary">
                        {habilidad.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTecnico.certificaciones && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Certificaciones</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTecnico.certificaciones.split(',').map((cert, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {cert.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Técnico</DialogTitle>
            <DialogDescription>
              Actualiza los datos del técnico
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  {...editForm.register("nombre", { required: true })}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  {...editForm.register("apellido", { required: true })}
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-area">Área *</Label>
                <Select 
                  value={editForm.watch("area")}
                  onValueChange={(value) => editForm.setValue("area", value as AreaTecnico)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="tecnico_senior">Técnico Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-especialidad">Especialidad *</Label>
                <Select 
                  value={editForm.watch("especialidad_id")}
                  onValueChange={(value) => editForm.setValue("especialidad_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()}>
                        {esp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-experiencia">Experiencia *</Label>
              <Input
                id="edit-experiencia"
                {...editForm.register("experiencia", { required: true })}
                placeholder="Ej: 5 años"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telefono">Teléfono *</Label>
                <Input
                  id="edit-telefono"
                  {...editForm.register("telefono", { required: true })}
                  placeholder="+52 123 456 7890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo Electrónico *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...editForm.register("email", { required: true })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-direccion">Dirección *</Label>
              <Input
                id="edit-direccion"
                {...editForm.register("direccion", { required: true })}
                placeholder="Calle, número, colonia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-habilidades">Habilidades</Label>
              <Textarea
                id="edit-habilidades"
                {...editForm.register("habilidades")}
                placeholder="Separar por comas: Ej. Soldadura, Pintura automotriz, Diagnóstico electrónico"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-certificaciones">Certificaciones</Label>
              <Textarea
                id="edit-certificaciones"
                {...editForm.register("certificaciones")}
                placeholder="Separar por comas: Ej. ASE Certified, Certificación Toyota, ISO 9001"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Actualizando..." : "Actualizar Técnico"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al técnico{" "}
              <strong>
                {selectedTecnico?.nombre} {selectedTecnico?.apellido}
              </strong>{" "}
              del sistema. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
