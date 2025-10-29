import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  tipo_cliente: string;
}

interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
  anio: number;
  cliente_id: string;
}

interface Tecnico {
  id: string;
  nombre: string;
  apellido: string;
}

interface TipoOperacion {
  id: string;
  codigo: string;
  nombre: string;
}

interface Orden {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  descripcion: string;
  tipo_servicio_id: string;
  tecnico_id: string;
  fecha_ingreso: string;
  fecha_entrega: string | null;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'entregada' | 'cancelada';
  costo_estimado: number | null;
  observaciones: string | null;
  clientes: Cliente;
  vehiculos: Vehiculo;
  tecnicos: Tecnico;
  tipos_operacion: TipoOperacion;
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState<Vehiculo[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tiposOperacion, setTiposOperacion] = useState<TipoOperacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    cliente_id: string;
    vehiculo_id: string;
    descripcion: string;
    tipo_servicio_id: string;
    tecnico_id: string;
    fecha_ingreso: Date;
    fecha_entrega: Date | null;
    prioridad: 'baja' | 'media' | 'alta' | 'urgente';
    estado: 'pendiente' | 'en_proceso' | 'completada' | 'entregada' | 'cancelada';
    costo_estimado: string;
    observaciones: string;
  }>({
    cliente_id: "",
    vehiculo_id: "",
    descripcion: "",
    tipo_servicio_id: "",
    tecnico_id: "",
    fecha_ingreso: new Date(),
    fecha_entrega: null,
    prioridad: "media",
    estado: "pendiente",
    costo_estimado: "",
    observaciones: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.cliente_id) {
      const vehiculosCliente = vehiculos.filter(v => v.cliente_id === formData.cliente_id);
      setVehiculosFiltrados(vehiculosCliente);
    } else {
      setVehiculosFiltrados([]);
    }
  }, [formData.cliente_id, vehiculos]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", user.id)
        .single();

      if (!userRoles?.taller_id) return;

      const [ordenesData, clientesData, vehiculosData, tecnicosData, tiposData] = await Promise.all([
        supabase
          .from("ordenes")
          .select(`
            *,
            clientes (id, nombre, apellido, tipo_cliente),
            vehiculos (id, marca, modelo, placa, anio, cliente_id),
            tecnicos (id, nombre, apellido),
            tipos_operacion (id, codigo, nombre)
          `)
          .eq("taller_id", userRoles.taller_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("clientes")
          .select("id, nombre, apellido, tipo_cliente")
          .eq("taller_id", userRoles.taller_id),
        supabase
          .from("vehiculos")
          .select("id, marca, modelo, placa, anio, cliente_id")
          .eq("taller_id", userRoles.taller_id),
        supabase
          .from("tecnicos")
          .select("id, nombre, apellido")
          .eq("taller_id", userRoles.taller_id),
        supabase
          .from("tipos_operacion")
          .select("id, codigo, nombre")
      ]);

      if (ordenesData.data) setOrdenes(ordenesData.data as Orden[]);
      if (clientesData.data) setClientes(clientesData.data);
      if (vehiculosData.data) setVehiculos(vehiculosData.data);
      if (tecnicosData.data) setTecnicos(tecnicosData.data);
      if (tiposData.data) setTiposOperacion(tiposData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", user.id)
        .single();

      if (!userRoles?.taller_id) return;

      const ordenData = {
        taller_id: userRoles.taller_id,
        cliente_id: formData.cliente_id,
        vehiculo_id: formData.vehiculo_id,
        descripcion: formData.descripcion,
        tipo_servicio_id: formData.tipo_servicio_id,
        tecnico_id: formData.tecnico_id,
        fecha_ingreso: formData.fecha_ingreso.toISOString(),
        fecha_entrega: formData.fecha_entrega?.toISOString() || null,
        prioridad: formData.prioridad,
        estado: formData.estado,
        costo_estimado: formData.costo_estimado ? parseFloat(formData.costo_estimado) : null,
        observaciones: formData.observaciones || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("ordenes")
          .update(ordenData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Orden actualizada correctamente");
      } else {
        const { error } = await supabase
          .from("ordenes")
          .insert([ordenData]);

        if (error) throw error;
        toast.success("Orden creada correctamente");
      }

      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving orden:", error);
      toast.error("Error al guardar la orden");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: "",
      vehiculo_id: "",
      descripcion: "",
      tipo_servicio_id: "",
      tecnico_id: "",
      fecha_ingreso: new Date(),
      fecha_entrega: null,
      prioridad: "media",
      estado: "pendiente",
      costo_estimado: "",
      observaciones: "",
    });
    setEditingId(null);
  };

  const handleEdit = (orden: Orden) => {
    setFormData({
      cliente_id: orden.cliente_id,
      vehiculo_id: orden.vehiculo_id,
      descripcion: orden.descripcion,
      tipo_servicio_id: orden.tipo_servicio_id,
      tecnico_id: orden.tecnico_id,
      fecha_ingreso: new Date(orden.fecha_ingreso),
      fecha_entrega: orden.fecha_entrega ? new Date(orden.fecha_entrega) : null,
      prioridad: orden.prioridad,
      estado: orden.estado,
      costo_estimado: orden.costo_estimado?.toString() || "",
      observaciones: orden.observaciones || "",
    });
    setEditingId(orden.id);
    setModalOpen(true);
  };

  const getPrioridadBadge = (prioridad: string) => {
    const variants = {
      baja: "secondary",
      media: "default",
      alta: "destructive",
      urgente: "destructive"
    };
    return variants[prioridad as keyof typeof variants] || "default";
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: "secondary",
      en_proceso: "default",
      completada: "default",
      entregada: "default",
      cancelada: "destructive"
    };
    return variants[estado as keyof typeof variants] || "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
          <p className="text-muted-foreground">Gestión de órdenes de trabajo del taller</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Fecha Ingreso</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No hay órdenes registradas
                </TableCell>
              </TableRow>
            ) : (
              ordenes.map((orden) => (
                <TableRow key={orden.id}>
                  <TableCell>{orden.clientes.nombre} {orden.clientes.apellido}</TableCell>
                  <TableCell>
                    {orden.vehiculos.marca} {orden.vehiculos.modelo}
                    <br />
                    <span className="text-sm text-muted-foreground">{orden.vehiculos.placa}</span>
                  </TableCell>
                  <TableCell>{orden.tipos_operacion.nombre}</TableCell>
                  <TableCell>{orden.tecnicos.nombre} {orden.tecnicos.apellido}</TableCell>
                  <TableCell>{format(new Date(orden.fecha_ingreso), "dd/MM/yyyy", { locale: es })}</TableCell>
                  <TableCell>
                    <Badge variant={getPrioridadBadge(orden.prioridad) as any}>
                      {orden.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadge(orden.estado) as any}>
                      {orden.estado.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {orden.costo_estimado ? `$${orden.costo_estimado.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(orden)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Orden" : "Nueva Orden de Trabajo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente_id">Cliente *</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, cliente_id: value, vehiculo_id: "" });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
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
                <Label htmlFor="vehiculo_id">Vehículo *</Label>
                <Select
                  value={formData.vehiculo_id}
                  onValueChange={(value) => setFormData({ ...formData, vehiculo_id: value })}
                  required
                  disabled={!formData.cliente_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un vehículo" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_servicio_id">Tipo de Servicio *</Label>
                <Select
                  value={formData.tipo_servicio_id}
                  onValueChange={(value) => setFormData({ ...formData, tipo_servicio_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposOperacion.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tecnico_id">Técnico Asignado *</Label>
                <Select
                  value={formData.tecnico_id}
                  onValueChange={(value) => setFormData({ ...formData, tecnico_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona técnico" />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Ingreso *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.fecha_ingreso && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha_ingreso ? format(formData.fecha_ingreso, "PPP", { locale: es }) : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fecha_ingreso}
                      onSelect={(date) => setFormData({ ...formData, fecha_ingreso: date || new Date() })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.fecha_entrega && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.fecha_entrega ? format(formData.fecha_entrega, "PPP", { locale: es }) : "Selecciona fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fecha_entrega || undefined}
                      onSelect={(date) => setFormData({ ...formData, fecha_entrega: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad *</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value) => setFormData({ ...formData, prioridad: value as 'baja' | 'media' | 'alta' | 'urgente' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as 'pendiente' | 'en_proceso' | 'completada' | 'entregada' | 'cancelada' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="entregada">Entregada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_estimado">Costo Estimado</Label>
                <Input
                  id="costo_estimado"
                  type="number"
                  step="0.01"
                  value={formData.costo_estimado}
                  onChange={(e) => setFormData({ ...formData, costo_estimado: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? "Actualizar" : "Crear"} Orden
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
