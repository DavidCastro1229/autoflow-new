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
import { toast } from "sonner";
import { Calendar, Clock, Trash2 } from "lucide-react";

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
  clientes: { nombre: string; apellido: string } | null;
  vehiculos: { marca: string; modelo: string; placa: string } | null;
  tecnicos: { nombre: string; apellido: string } | null;
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
  const [loading, setLoading] = useState(false);

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
        clientes (nombre, apellido),
        vehiculos (marca, modelo, placa),
        tecnicos (nombre, apellido),
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
      setOpen(false);
      fetchCitas();
    }

    setLoading(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Cita</DialogTitle>
              <DialogDescription>
                Complete los datos de la cita
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
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Cita"}
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
                <TableHead>Nota</TableHead>
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
                    <TableCell className="max-w-xs truncate">{cita.nota || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cita.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
