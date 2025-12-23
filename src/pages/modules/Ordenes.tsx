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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Loader2, Eye, User, Car, Wrench, FileText, Layers, Play } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExportButtons } from "@/components/ExportButtons";
import { formatDateForExport, formatCurrencyForExport } from "@/lib/exportUtils";
import { AsignarTareaModal } from "@/components/ordenes/AsignarTareaModal";
import { OrdenProcesoKanban } from "@/components/ordenes/OrdenProcesoKanban";

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

interface CatalogoTarea {
  id: string;
  codigo_tarea: string;
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
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
  costo_estimado: number | null;
  observaciones: string | null;
  tarea_id: string | null;
  fase_actual_id: string | null;
  flujo_actual_id: string | null;
  clientes: Cliente;
  vehiculos: Vehiculo;
  tecnicos: Tecnico;
  tipos_operacion: TipoOperacion;
  catalogo_tareas: CatalogoTarea | null;
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
    estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
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
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [asignarTareaModalOpen, setAsignarTareaModalOpen] = useState(false);
  const [ordenParaTarea, setOrdenParaTarea] = useState<Orden | null>(null);
  const [procesoKanbanOpen, setProcesoKanbanOpen] = useState(false);
  const [ordenParaProceso, setOrdenParaProceso] = useState<Orden | null>(null);

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
            tipos_operacion (id, codigo, nombre),
            catalogo_tareas (id, codigo_tarea, nombre)
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

  const handleViewDetails = (orden: Orden) => {
    setSelectedOrden(orden);
    setDetailsModalOpen(true);
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
    const config: Record<string, { variant: string; className: string; label: string }> = {
      pendiente: { variant: "outline", className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400", label: "Pendiente" },
      en_proceso: { variant: "outline", className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400", label: "En Proceso" },
      completada: { variant: "outline", className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400", label: "Completada" },
      cancelada: { variant: "outline", className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400", label: "Cancelada" },
    };
    return config[estado] || config.pendiente;
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
        <div className="flex gap-2">
          <ExportButtons
            data={ordenes.map((orden) => ({
              cliente: `${orden.clientes?.nombre} ${orden.clientes?.apellido}`,
              vehiculo: `${orden.vehiculos?.marca} ${orden.vehiculos?.modelo} - ${orden.vehiculos?.placa}`,
              tecnico: `${orden.tecnicos?.nombre} ${orden.tecnicos?.apellido}`,
              descripcion: orden.descripcion,
              estado: orden.estado === "pendiente" ? "Pendiente" : 
                      orden.estado === "en_proceso" ? "En Proceso" : 
                      orden.estado === "completada" ? "Completada" : "Cancelada",
              prioridad: orden.prioridad === "alta" ? "Alta" : orden.prioridad === "media" ? "Media" : "Baja",
              costo_estimado: orden.costo_estimado ? formatCurrencyForExport(orden.costo_estimado) : "-",
              fecha_ingreso: formatDateForExport(orden.fecha_ingreso),
              fecha_entrega: orden.fecha_entrega ? formatDateForExport(orden.fecha_entrega) : "-",
            }))}
            columns={[
              { header: "Cliente", key: "cliente", width: 25 },
              { header: "Vehículo", key: "vehiculo", width: 25 },
              { header: "Técnico", key: "tecnico", width: 20 },
              { header: "Descripción", key: "descripcion", width: 30 },
              { header: "Estado", key: "estado", width: 12 },
              { header: "Prioridad", key: "prioridad", width: 10 },
              { header: "Costo Estimado", key: "costo_estimado", width: 12 },
              { header: "Fecha Ingreso", key: "fecha_ingreso", width: 12 },
              { header: "Fecha Entrega", key: "fecha_entrega", width: 12 },
            ]}
            fileName="ordenes"
            title="Reporte de Órdenes de Trabajo"
          />
          <Button onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Proceso</TableHead>
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
                <TableCell colSpan={10} className="text-center text-muted-foreground">
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
                  <TableCell>
                    {orden.catalogo_tareas ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {orden.catalogo_tareas.codigo_tarea}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOrdenParaProceso(orden);
                            setProcesoKanbanOpen(true);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOrdenParaTarea(orden);
                          setAsignarTareaModalOpen(true);
                        }}
                      >
                        <Layers className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(orden.fecha_ingreso), "dd/MM/yyyy", { locale: es })}</TableCell>
                  <TableCell>
                    <Badge variant={getPrioridadBadge(orden.prioridad) as any}>
                      {orden.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const config = getEstadoBadge(orden.estado);
                      return (
                        <Badge variant="outline" className={config.className}>
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {orden.costo_estimado ? `$${orden.costo_estimado.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(orden)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(orden)}>
                        Editar
                      </Button>
                    </div>
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
                  onValueChange={(value) => setFormData({ ...formData, estado: value as 'pendiente' | 'en_proceso' | 'completada' | 'cancelada' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
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

      {/* Modal de Detalles */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de la Orden de Trabajo</DialogTitle>
          </DialogHeader>
          
          {selectedOrden && (
            <div className="space-y-6">
              {/* Información General de la Orden */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información de la Orden
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Tipo de Servicio</Label>
                      <p className="font-medium">{selectedOrden.tipos_operacion.nombre}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estado</Label>
                      <div className="mt-1">
                        <Badge variant={getEstadoBadge(selectedOrden.estado) as any}>
                          {selectedOrden.estado.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prioridad</Label>
                      <div className="mt-1">
                        <Badge variant={getPrioridadBadge(selectedOrden.prioridad) as any}>
                          {selectedOrden.prioridad}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Costo Estimado</Label>
                      <p className="font-medium">
                        {selectedOrden.costo_estimado ? `$${selectedOrden.costo_estimado.toFixed(2)}` : "No especificado"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de Ingreso</Label>
                      <p className="font-medium">
                        {format(new Date(selectedOrden.fecha_ingreso), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de Entrega</Label>
                      <p className="font-medium">
                        {selectedOrden.fecha_entrega 
                          ? format(new Date(selectedOrden.fecha_entrega), "dd 'de' MMMM 'de' yyyy", { locale: es })
                          : "No especificada"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Descripción</Label>
                    <p className="font-medium mt-1">{selectedOrden.descripcion}</p>
                  </div>
                  {selectedOrden.observaciones && (
                    <div>
                      <Label className="text-muted-foreground">Observaciones</Label>
                      <p className="font-medium mt-1">{selectedOrden.observaciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Información del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Nombre Completo</Label>
                      <p className="font-medium">
                        {selectedOrden.clientes.nombre} {selectedOrden.clientes.apellido}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tipo de Cliente</Label>
                      <p className="font-medium capitalize">{selectedOrden.clientes.tipo_cliente}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Información del Vehículo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Información del Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Marca y Modelo</Label>
                      <p className="font-medium">
                        {selectedOrden.vehiculos.marca} {selectedOrden.vehiculos.modelo}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Año</Label>
                      <p className="font-medium">{selectedOrden.vehiculos.anio}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Placa</Label>
                      <p className="font-medium">{selectedOrden.vehiculos.placa}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Información del Técnico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Técnico Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Nombre Completo</Label>
                    <p className="font-medium">
                      {selectedOrden.tecnicos.nombre} {selectedOrden.tecnicos.apellido}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => {
                  setDetailsModalOpen(false);
                  handleEdit(selectedOrden);
                }}>
                  Editar Orden
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para asignar tarea */}
      {ordenParaTarea && (
        <AsignarTareaModal
          open={asignarTareaModalOpen}
          onOpenChange={(open) => {
            setAsignarTareaModalOpen(open);
            if (!open) setOrdenParaTarea(null);
          }}
          ordenId={ordenParaTarea.id}
          currentTareaId={ordenParaTarea.tarea_id}
          onAssigned={fetchData}
        />
      )}

      {/* Modal Kanban del proceso */}
      {ordenParaProceso && ordenParaProceso.tarea_id && (
        <OrdenProcesoKanban
          open={procesoKanbanOpen}
          onOpenChange={(open) => {
            setProcesoKanbanOpen(open);
            if (!open) setOrdenParaProceso(null);
          }}
          ordenId={ordenParaProceso.id}
          tareaId={ordenParaProceso.tarea_id}
          faseActualId={ordenParaProceso.fase_actual_id}
          flujoActualId={ordenParaProceso.flujo_actual_id}
          ordenDescripcion={ordenParaProceso.descripcion}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
