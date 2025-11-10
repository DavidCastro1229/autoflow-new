import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Wrench, Award, User, Clock, ClipboardList, Pencil, Trash2, Mail, Phone, MapPin, Calendar } from "lucide-react";
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

interface Horario {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

interface Orden {
  id: string;
  descripcion: string;
  estado: string;
  fecha_ingreso: string;
  clientes: {
    nombre: string;
    apellido: string;
  };
  vehiculos: {
    marca: string;
    modelo: string;
    placa: string;
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

interface HorarioFormData {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

const diasSemana = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTecnico, setSelectedTecnico] = useState<Tecnico | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [editingHorario, setEditingHorario] = useState<Horario | null>(null);
  
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<TecnicoFormData>();
  const editForm = useForm<Omit<TecnicoFormData, 'password'>>();
  const horarioForm = useForm<HorarioFormData>();

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

  const fetchHorarios = async (tecnicoId: string) => {
    setLoadingHorarios(true);
    try {
      const { data, error } = await supabase
        .from("tecnico_horarios")
        .select("*")
        .eq("tecnico_id", tecnicoId)
        .order("dia_semana");

      if (error) throw error;
      setHorarios(data || []);
    } catch (error: any) {
      console.error("Error fetching horarios:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios",
        variant: "destructive",
      });
    } finally {
      setLoadingHorarios(false);
    }
  };

  const fetchOrdenes = async (tecnicoId: string) => {
    setLoadingOrdenes(true);
    try {
      const { data, error } = await supabase
        .from("ordenes")
        .select(`
          id,
          descripcion,
          estado,
          fecha_ingreso,
          clientes (
            nombre,
            apellido
          ),
          vehiculos (
            marca,
            modelo,
            placa
          )
        `)
        .eq("tecnico_id", tecnicoId)
        .order("fecha_ingreso", { ascending: false });

      if (error) throw error;
      setOrdenes(data as any || []);
    } catch (error: any) {
      console.error("Error fetching ordenes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes",
        variant: "destructive",
      });
    } finally {
      setLoadingOrdenes(false);
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

  const handleViewProfile = (tecnico: Tecnico) => {
    setSelectedTecnico(tecnico);
    fetchHorarios(tecnico.id);
    fetchOrdenes(tecnico.id);
    setProfileDialogOpen(true);
  };

  const onHorarioSubmit = async (formData: HorarioFormData) => {
    if (!selectedTecnico) return;

    setSubmitting(true);
    try {
      if (editingHorario) {
        // Update existing horario
        const { error } = await supabase
          .from("tecnico_horarios")
          .update({
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin,
          })
          .eq("id", editingHorario.id);

        if (error) throw error;

        toast({
          title: "Horario actualizado",
          description: "El horario se ha actualizado exitosamente",
        });
      } else {
        // Create new horario
        const { error } = await supabase
          .from("tecnico_horarios")
          .insert({
            tecnico_id: selectedTecnico.id,
            dia_semana: formData.dia_semana,
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin,
          });

        if (error) throw error;

        toast({
          title: "Horario agregado",
          description: "El horario se ha agregado exitosamente",
        });
      }

      horarioForm.reset();
      setEditingHorario(null);
      fetchHorarios(selectedTecnico.id);
    } catch (error: any) {
      console.error("Error saving horario:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el horario",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditHorario = (horario: Horario) => {
    setEditingHorario(horario);
    horarioForm.reset({
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
    });
  };

  const handleDeleteHorario = async (horarioId: string) => {
    if (!selectedTecnico) return;

    try {
      const { error } = await supabase
        .from("tecnico_horarios")
        .delete()
        .eq("id", horarioId);

      if (error) throw error;

      toast({
        title: "Horario eliminado",
        description: "El horario se ha eliminado exitosamente",
      });

      fetchHorarios(selectedTecnico.id);
    } catch (error: any) {
      console.error("Error deleting horario:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el horario",
        variant: "destructive",
      });
    }
  };

  const getAreaBadgeVariant = (area: AreaTecnico): "default" | "secondary" => {
    return area === "tecnico_senior" ? "secondary" : "default";
  };

  const getEstadoOrdenBadge = (estado: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      pendiente: { variant: "outline", label: "Pendiente" },
      en_proceso: { variant: "default", label: "En Proceso" },
      completada: { variant: "secondary", label: "Completada" },
    };
    return variants[estado] || { variant: "outline", label: estado };
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando técnicos...</p>
        </div>
      ) : tecnicos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              No hay técnicos registrados. Crea uno usando el botón "Nuevo Técnico"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tecnicos.map((tecnico) => (
            <Card key={tecnico.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {tecnico.nombre} {tecnico.apellido}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant={getAreaBadgeVariant(tecnico.area)}>
                        {tecnico.area === "tecnico_senior" ? "Técnico Senior" : "Técnico"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Especialidad:</span>
                    <Badge variant="outline" className="ml-auto">
                      {tecnico.especialidades_taller?.nombre || "N/A"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Experiencia:</span>
                    <span className="text-muted-foreground ml-auto">{tecnico.experiencia}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{tecnico.telefono}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{tecnico.email}</span>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">{tecnico.direccion}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleViewProfile(tecnico)}
                    className="flex-1"
                  >
                    Ver Perfil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tecnico)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(tecnico)}
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

      {/* Profile Dialog with Tabs */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil de {selectedTecnico?.nombre} {selectedTecnico?.apellido}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTecnico && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="horarios">Horarios</TabsTrigger>
                <TabsTrigger value="ordenes">Órdenes Asignadas</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Personal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>

                {selectedTecnico.habilidades && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Habilidades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedTecnico.habilidades.split(',').map((habilidad, index) => (
                          <Badge key={index} variant="secondary">
                            {habilidad.trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedTecnico.certificaciones && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Certificaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedTecnico.certificaciones.split(',').map((cert, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {cert.trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="horarios" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Gestión de Horarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={horarioForm.handleSubmit(onHorarioSubmit)} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Día de la Semana *</Label>
                          <Select 
                            value={horarioForm.watch("dia_semana")}
                            onValueChange={(value) => horarioForm.setValue("dia_semana", value)}
                            disabled={!!editingHorario}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar día" />
                            </SelectTrigger>
                            <SelectContent>
                              {diasSemana.map((dia) => (
                                <SelectItem key={dia.value} value={dia.value}>
                                  {dia.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Hora Inicio *</Label>
                          <Input
                            type="time"
                            {...horarioForm.register("hora_inicio", { required: true })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hora Fin *</Label>
                          <Input
                            type="time"
                            {...horarioForm.register("hora_fin", { required: true })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                          {editingHorario ? "Actualizar" : "Agregar"} Horario
                        </Button>
                        {editingHorario && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingHorario(null);
                              horarioForm.reset();
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </form>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Horarios Configurados</h4>
                      {loadingHorarios ? (
                        <p className="text-muted-foreground text-sm">Cargando horarios...</p>
                      ) : horarios.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No hay horarios configurados</p>
                      ) : (
                        <div className="space-y-2">
                          {diasSemana.map((dia) => {
                            const horario = horarios.find(h => h.dia_semana === dia.value);
                            return (
                              <div key={dia.value} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium w-24">{dia.label}</span>
                                  {horario ? (
                                    <span className="text-sm text-muted-foreground">
                                      {horario.hora_inicio} - {horario.hora_fin}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No configurado</span>
                                  )}
                                </div>
                                {horario && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditHorario(horario)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteHorario(horario.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ordenes" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Órdenes Asignadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingOrdenes ? (
                      <p className="text-muted-foreground text-sm">Cargando órdenes...</p>
                    ) : ordenes.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No hay órdenes asignadas a este técnico</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Vehículo</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha Ingreso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ordenes.map((orden) => (
                            <TableRow key={orden.id}>
                              <TableCell>
                                {orden.clientes?.nombre} {orden.clientes?.apellido}
                              </TableCell>
                              <TableCell>
                                {orden.vehiculos?.marca} {orden.vehiculos?.modelo}
                                <br />
                                <span className="text-xs text-muted-foreground">
                                  {orden.vehiculos?.placa}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {orden.descripcion}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getEstadoOrdenBadge(orden.estado).variant}>
                                  {getEstadoOrdenBadge(orden.estado).label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(orden.fecha_ingreso).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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

      {/* Delete Confirmation Dialog */}
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
