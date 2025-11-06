import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, Trash2, Edit, CheckCircle, Eye } from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
}

interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
  cliente_id: string;
}

interface Tecnico {
  id: string;
  nombre: string;
  apellido: string;
}

interface CategoriaServicio {
  id: string;
  nombre: string;
}

interface Cita {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  nota: string | null;
  estado: string;
  cliente_id: string;
  vehiculo_id: string;
  tecnico_id: string;
  servicio_id: string;
  clientes: { nombre: string; apellido: string; email: string; telefono: string } | null;
  vehiculos: { marca: string; modelo: string; placa: string; color: string; anio: number } | null;
  tecnicos: { nombre: string; apellido: string; email: string; telefono: string } | null;
  categorias_servicio: { nombre: string } | null;
}

const horasDisponibles = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00"
];

export default function Citas() {
  const { tallerId } = useUserRole();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [servicios, setServicios] = useState<CategoriaServicio[]>([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCita, setEditingCita] = useState<Cita | null>(null);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  const [formData, setFormData] = useState({
    cliente_id: "",
    vehiculo_id: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    tecnico_id: "",
    servicio_id: "",
    nota: ""
  });

  const [vehiculosFiltrados, setVehiculosFiltrados] = useState<Vehiculo[]>([]);

  useEffect(() => {
    if (tallerId) {
      fetchCitas();
      fetchClientes();
      fetchVehiculos();
      fetchTecnicos();
      fetchServicios();
    }
  }, [tallerId]);

  useEffect(() => {
    if (formData.cliente_id) {
      const vehiculosDelCliente = vehiculos.filter(v => v.cliente_id === formData.cliente_id);
      setVehiculosFiltrados(vehiculosDelCliente);
    } else {
      setVehiculosFiltrados([]);
    }
  }, [formData.cliente_id, vehiculos]);

  const fetchCitas = async () => {
    const { data, error } = await supabase
      .from("citas")
      .select(`
        *,
        clientes (nombre, apellido, email, telefono),
        vehiculos (marca, modelo, placa, color, anio),
        tecnicos (nombre, apellido, email, telefono),
        categorias_servicio (nombre)
      `)
      .eq("taller_id", tallerId)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false });

    if (error) {
      toast.error("Error al cargar citas");
      console.error(error);
    } else {
      setCitas(data || []);
    }
  };

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre, apellido")
      .eq("taller_id", tallerId);

    if (error) {
      console.error(error);
    } else {
      setClientes(data || []);
    }
  };

  const fetchVehiculos = async () => {
    const { data, error } = await supabase
      .from("vehiculos")
      .select("id, marca, modelo, placa, cliente_id")
      .eq("taller_id", tallerId);

    if (error) {
      console.error(error);
    } else {
      setVehiculos(data || []);
    }
  };

  const fetchTecnicos = async () => {
    const { data, error } = await supabase
      .from("tecnicos")
      .select("id, nombre, apellido")
      .eq("taller_id", tallerId);

    if (error) {
      console.error(error);
    } else {
      setTecnicos(data || []);
    }
  };

  const fetchServicios = async () => {
    const { data, error } = await supabase
      .from("categorias_servicio")
      .select("id, nombre");

    if (error) {
      console.error(error);
    } else {
      setServicios(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingCita) {
      const { error } = await supabase
        .from("citas")
        .update(formData)
        .eq("id", editingCita.id);

      if (error) {
        toast.error("Error al actualizar la cita");
        console.error(error);
      } else {
        toast.success("Cita actualizada exitosamente");
        setEditingCita(null);
        resetForm();
        setOpen(false);
        fetchCitas();
      }
    } else {
      const { error } = await supabase.from("citas").insert([
        {
          ...formData,
          taller_id: tallerId
        }
      ]);

      if (error) {
        toast.error("Error al crear la cita");
        console.error(error);
      } else {
        toast.success("Cita creada exitosamente");
        resetForm();
        setOpen(false);
        fetchCitas();
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      cliente_id: "",
      vehiculo_id: "",
      fecha: "",
      hora_inicio: "",
      hora_fin: "",
      tecnico_id: "",
      servicio_id: "",
      nota: ""
    });
    setEditingCita(null);
  };

  const handleEdit = (cita: Cita) => {
    setEditingCita(cita);
    setFormData({
      cliente_id: cita.cliente_id,
      vehiculo_id: cita.vehiculo_id,
      fecha: cita.fecha,
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin,
      tecnico_id: cita.tecnico_id,
      servicio_id: cita.servicio_id,
      nota: cita.nota || ""
    });
    setOpen(true);
  };

  const handleConfirm = async (id: string) => {
    const { error } = await supabase
      .from("citas")
      .update({ estado: "confirmada" })
      .eq("id", id);

    if (error) {
      toast.error("Error al confirmar la cita");
      console.error(error);
    } else {
      toast.success("Cita confirmada");
      fetchCitas();
    }
  };

  const handleViewDetails = (cita: Cita) => {
    setSelectedCita(cita);
    setDetailsOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("citas").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar la cita");
      console.error(error);
    } else {
      toast.success("Cita eliminada");
      fetchCitas();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Citas</h1>
          <p className="text-muted-foreground">Gestión de citas y calendario</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCita ? "Editar Cita" : "Registrar Nueva Cita"}</DialogTitle>
              <DialogDescription>
                {editingCita ? "Modifique los datos de la cita" : "Complete los datos de la cita"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente_id">Cliente</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, cliente_id: value, vehiculo_id: "" });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehiculo_id">Vehículo</Label>
                <Select
                  value={formData.vehiculo_id}
                  onValueChange={(value) => setFormData({ ...formData, vehiculo_id: value })}
                  required
                  disabled={!formData.cliente_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiculosFiltrados.map((vehiculo) => (
                      <SelectItem key={vehiculo.id} value={vehiculo.id}>
                        {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora Inicio</Label>
                  <Select
                    value={formData.hora_inicio}
                    onValueChange={(value) => setFormData({ ...formData, hora_inicio: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {horasDisponibles.map((hora) => (
                        <SelectItem key={hora} value={hora}>
                          {hora}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_fin">Hora Fin</Label>
                  <Select
                    value={formData.hora_fin}
                    onValueChange={(value) => setFormData({ ...formData, hora_fin: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {horasDisponibles.map((hora) => (
                        <SelectItem key={hora} value={hora}>
                          {hora}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tecnico_id">Técnico</Label>
                <Select
                  value={formData.tecnico_id}
                  onValueChange={(value) => setFormData({ ...formData, tecnico_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {tecnicos.map((tecnico) => (
                      <SelectItem key={tecnico.id} value={tecnico.id}>
                        {tecnico.nombre} {tecnico.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="servicio_id">Servicio</Label>
                <Select
                  value={formData.servicio_id}
                  onValueChange={(value) => setFormData({ ...formData, servicio_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios.map((servicio) => (
                      <SelectItem key={servicio.id} value={servicio.id}>
                        {servicio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nota">Nota</Label>
                <Textarea
                  placeholder="Ingrese notas adicionales"
                  value={formData.nota}
                  onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : editingCita ? "Actualizar Cita" : "Guardar Cita"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Citas</CardTitle>
          <CardDescription>Gestione todas las citas programadas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No hay citas registradas
                  </TableCell>
                </TableRow>
              ) : (
                citas.map((cita) => (
                  <TableRow key={cita.id}>
                    <TableCell>{new Date(cita.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {cita.hora_inicio} - {cita.hora_fin}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cita.clientes ? `${cita.clientes.nombre} ${cita.clientes.apellido}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {cita.vehiculos ? `${cita.vehiculos.marca} ${cita.vehiculos.modelo} - ${cita.vehiculos.placa}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {cita.tecnicos ? `${cita.tecnicos.nombre} ${cita.tecnicos.apellido}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {cita.categorias_servicio?.nombre || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cita.estado === "confirmada" ? "default" : cita.estado === "programada" ? "secondary" : "outline"}>
                        {cita.estado === "programada" ? "Programada" : 
                         cita.estado === "confirmada" ? "Confirmada" :
                         cita.estado === "completada" ? "Completada" : "Cancelada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(cita)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cita)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {cita.estado === "programada" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleConfirm(cita.id)}
                            title="Confirmar"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cita.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
          </DialogHeader>
          {selectedCita && (
            <div className="space-y-6">
              {/* Información de la Cita */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha</Label>
                    <p className="font-medium">{new Date(selectedCita.fecha).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Horario</Label>
                    <p className="font-medium">{selectedCita.hora_inicio} - {selectedCita.hora_fin}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Servicio</Label>
                    <p className="font-medium">{selectedCita.categorias_servicio?.nombre || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <Badge variant={selectedCita.estado === "confirmada" ? "default" : "secondary"}>
                      {selectedCita.estado === "programada" ? "Programada" : 
                       selectedCita.estado === "confirmada" ? "Confirmada" :
                       selectedCita.estado === "completada" ? "Completada" : "Cancelada"}
                    </Badge>
                  </div>
                  {selectedCita.nota && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Nota</Label>
                      <p className="font-medium">{selectedCita.nota}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Información del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cliente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre</Label>
                    <p className="font-medium">
                      {selectedCita.clientes ? `${selectedCita.clientes.nombre} ${selectedCita.clientes.apellido}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{selectedCita.clientes?.telefono || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedCita.clientes?.email || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Vehículo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehículo</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Marca y Modelo</Label>
                    <p className="font-medium">
                      {selectedCita.vehiculos ? `${selectedCita.vehiculos.marca} ${selectedCita.vehiculos.modelo}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Año</Label>
                    <p className="font-medium">{selectedCita.vehiculos?.anio || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Placa</Label>
                    <p className="font-medium">{selectedCita.vehiculos?.placa || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Color</Label>
                    <p className="font-medium">{selectedCita.vehiculos?.color || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Técnico */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Técnico Asignado</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre</Label>
                    <p className="font-medium">
                      {selectedCita.tecnicos ? `${selectedCita.tecnicos.nombre} ${selectedCita.tecnicos.apellido}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{selectedCita.tecnicos?.telefono || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedCita.tecnicos?.email || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
