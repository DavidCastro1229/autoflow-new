import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Eye, Edit, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";

type EstadoCotizacion = "pendiente" | "aprobada" | "rechazada" | "convertida_a_orden";
type OperacionParte = "corregir" | "reparar" | "cambiar";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  cliente_id: string;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface Parte {
  id?: string;
  categoria_id: string;
  categoria?: Categoria;
  cantidad: number;
  descripcion: string;
  operacion: OperacionParte;
  tipo_material: string;
  tipo_reparacion: string;
  dias: number;
  horas: number;
  mano_obra: number;
  materiales: number;
  repuestos: number;
  subtotal: number;
}

interface Cotizacion {
  id: string;
  codigo_cotizacion: string;
  fecha: string;
  cliente_id: string;
  vehiculo_id: string;
  estado: EstadoCotizacion;
  total: number;
  observaciones: string | null;
  created_at: string;
  clientes?: Cliente;
  vehiculos?: Vehiculo;
}

export default function Cotizaciones() {
  const { tallerId } = useUserRole();
  const { toast } = useToast();

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("cliente");

  // Form states
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [clienteId, setClienteId] = useState("");
  const [vehiculoId, setVehiculoId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [partes, setPartes] = useState<Parte[]>([]);

  // Selector data
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Search states
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false);
  const [vehiculoSearchOpen, setVehiculoSearchOpen] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");
  const [vehiculoSearch, setVehiculoSearch] = useState("");

  useEffect(() => {
    fetchCotizaciones();
    fetchClientes();
    fetchCategorias();
  }, [tallerId]);

  useEffect(() => {
    if (clienteId) {
      fetchVehiculos(clienteId);
    } else {
      setVehiculos([]);
      setVehiculoId("");
    }
  }, [clienteId]);

  const fetchCotizaciones = async () => {
    if (!tallerId) return;

    const { data, error } = await supabase
      .from("cotizaciones" as any)
      .select(`
        *,
        clientes:cliente_id (
          id,
          nombre,
          apellido,
          email,
          telefono
        ),
        vehiculos:vehiculo_id (
          id,
          placa,
          marca,
          modelo,
          anio
        )
      `)
      .eq("taller_id", tallerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cotizaciones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
        variant: "destructive",
      });
    } else {
      setCotizaciones(data as any || []);
    }
    setLoading(false);
  };

  const fetchClientes = async () => {
    if (!tallerId) return;

    const { data, error } = await supabase
      .from("clientes" as any)
      .select("*")
      .eq("taller_id", tallerId)
      .order("nombre");

    if (!error && data) {
      setClientes(data as any);
    }
  };

  const fetchVehiculos = async (clienteIdParam: string) => {
    const { data, error } = await supabase
      .from("vehiculos" as any)
      .select("*")
      .eq("cliente_id", clienteIdParam)
      .order("marca");

    if (!error && data) {
      setVehiculos(data as any);
    }
  };

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from("categorias_servicio" as any)
      .select("*")
      .order("nombre");

    if (!error && data) {
      setCategorias(data as any);
    }
  };

  const handleAddParte = () => {
    const newParte: Parte = {
      categoria_id: "",
      cantidad: 1,
      descripcion: "",
      operacion: "reparar",
      tipo_material: "",
      tipo_reparacion: "",
      dias: 0,
      horas: 0,
      mano_obra: 0,
      materiales: 0,
      repuestos: 0,
      subtotal: 0,
    };
    setPartes([...partes, newParte]);
  };

  const handleRemoveParte = (index: number) => {
    setPartes(partes.filter((_, i) => i !== index));
  };

  const handleParteChange = (index: number, field: keyof Parte, value: any) => {
    const updatedPartes = [...partes];
    updatedPartes[index] = { ...updatedPartes[index], [field]: value };

    // Calculate subtotal
    const parte = updatedPartes[index];
    parte.subtotal = (parte.mano_obra + parte.materiales + parte.repuestos) * parte.cantidad;

    setPartes(updatedPartes);
  };

  const calculateTotal = () => {
    return partes.reduce((sum, parte) => sum + parte.subtotal, 0);
  };

  const handleSubmit = async () => {
    if (!tallerId || !clienteId || !vehiculoId || partes.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos y agrega al menos una parte",
        variant: "destructive",
      });
      return;
    }

    try {
      const total = calculateTotal();

      if (editMode && selectedCotizacion) {
        // Update existing cotizacion
        const { error: cotizacionError } = await supabase
          .from("cotizaciones" as any)
          .update({
            fecha,
            cliente_id: clienteId,
            vehiculo_id: vehiculoId,
            total,
            observaciones: observaciones || null,
          } as any)
          .eq("id", selectedCotizacion.id);

        if (cotizacionError) throw cotizacionError;

        // Delete old partes
        await supabase
          .from("cotizacion_partes" as any)
          .delete()
          .eq("cotizacion_id", selectedCotizacion.id);

        // Insert new partes
        const partesData = partes.map((parte) => ({
          cotizacion_id: selectedCotizacion.id,
          categoria_id: parte.categoria_id,
          cantidad: parte.cantidad,
          descripcion: parte.descripcion,
          operacion: parte.operacion,
          tipo_material: parte.tipo_material,
          tipo_reparacion: parte.tipo_reparacion,
          dias: parte.dias,
          horas: parte.horas,
          mano_obra: parte.mano_obra,
          materiales: parte.materiales,
          repuestos: parte.repuestos,
          subtotal: parte.subtotal,
        }));

        const { error: partesError } = await supabase
          .from("cotizacion_partes" as any)
          .insert(partesData as any);

        if (partesError) throw partesError;

        toast({
          title: "Cotización actualizada",
          description: `Cotización actualizada exitosamente`,
        });
      } else {
        // Generate codigo_cotizacion
        const { data: codigoData, error: codigoError } = await supabase.rpc(
          "generate_codigo_cotizacion" as any
        );

        if (codigoError) throw codigoError;

        // Insert cotizacion
        const { data: cotizacionData, error: cotizacionError } = await supabase
          .from("cotizaciones" as any)
          .insert({
            codigo_cotizacion: codigoData,
            fecha,
            cliente_id: clienteId,
            vehiculo_id: vehiculoId,
            taller_id: tallerId,
            total,
            observaciones: observaciones || null,
          } as any)
          .select()
          .single() as any;

        if (cotizacionError) throw cotizacionError;

        // Insert partes
        const partesData = partes.map((parte) => ({
          cotizacion_id: cotizacionData.id,
          categoria_id: parte.categoria_id,
          cantidad: parte.cantidad,
          descripcion: parte.descripcion,
          operacion: parte.operacion,
          tipo_material: parte.tipo_material,
          tipo_reparacion: parte.tipo_reparacion,
          dias: parte.dias,
          horas: parte.horas,
          mano_obra: parte.mano_obra,
          materiales: parte.materiales,
          repuestos: parte.repuestos,
          subtotal: parte.subtotal,
        }));

        const { error: partesError } = await supabase
          .from("cotizacion_partes" as any)
          .insert(partesData as any);

        if (partesError) throw partesError;

        toast({
          title: "Cotización creada",
          description: `Cotización ${codigoData} creada exitosamente`,
        });
      }

      resetForm();
      setDialogOpen(false);
      fetchCotizaciones();
    } catch (error: any) {
      console.error("Error saving cotizacion:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la cotización",
        variant: "destructive",
      });
    }
  };

  const handleView = async (cotizacion: Cotizacion) => {
    const { data: partesData, error } = await supabase
      .from("cotizacion_partes" as any)
      .select(`
        *,
        categorias_servicio:categoria_id (
          id,
          nombre
        )
      `)
      .eq("cotizacion_id", cotizacion.id);

    if (!error && partesData) {
      setPartes(
        partesData.map((p: any) => ({
          ...p,
          categoria: p.categorias_servicio,
        }))
      );
    }

    setSelectedCotizacion(cotizacion);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cotizaciones" as any).delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cotización",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cotización eliminada",
        description: "La cotización ha sido eliminada exitosamente",
      });
      fetchCotizaciones();
    }
  };

  const handleEdit = async (cotizacion: Cotizacion) => {
    const { data: partesData, error } = await supabase
      .from("cotizacion_partes" as any)
      .select(`
        *,
        categorias_servicio:categoria_id (
          id,
          nombre
        )
      `)
      .eq("cotizacion_id", cotizacion.id);

    if (!error && partesData) {
      setPartes(
        partesData.map((p: any) => ({
          ...p,
          categoria: p.categorias_servicio,
        }))
      );
    }

    setSelectedCotizacion(cotizacion);
    setFecha(cotizacion.fecha);
    setClienteId(cotizacion.cliente_id);
    setVehiculoId(cotizacion.vehiculo_id);
    setObservaciones(cotizacion.observaciones || "");
    setEditMode(true);
    setActiveTab("cliente");
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFecha(format(new Date(), "yyyy-MM-dd"));
    setClienteId("");
    setVehiculoId("");
    setObservaciones("");
    setPartes([]);
    setActiveTab("cliente");
    setEditMode(false);
    setSelectedCotizacion(null);
  };

  const getEstadoBadgeVariant = (estado: EstadoCotizacion) => {
    switch (estado) {
      case "aprobada":
        return "default";
      case "pendiente":
        return "secondary";
      case "rechazada":
        return "destructive";
      case "convertida_a_orden":
        return "outline";
      default:
        return "secondary";
    }
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
      c.apellido.toLowerCase().includes(clienteSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const filteredVehiculos = vehiculos.filter(
    (v) =>
      v.placa.toLowerCase().includes(vehiculoSearch.toLowerCase()) ||
      v.marca.toLowerCase().includes(vehiculoSearch.toLowerCase()) ||
      v.modelo.toLowerCase().includes(vehiculoSearch.toLowerCase())
  );

  const selectedCliente = clientes.find((c) => c.id === clienteId);
  const selectedVehiculo = vehiculos.find((v) => v.id === vehiculoId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground">Gestión de cotizaciones de servicios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editMode ? "Editar Cotización" : "Crear Nueva Cotización"}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cliente">Cliente y Vehículo</TabsTrigger>
                <TabsTrigger value="partes">Partes y Servicios</TabsTrigger>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Cliente *</Label>
                    <Dialog open={clienteSearchOpen} onOpenChange={setClienteSearchOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="justify-between">
                          {selectedCliente
                            ? `${selectedCliente.nombre} ${selectedCliente.apellido}`
                            : "Seleccionar cliente"}
                          <Search className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Seleccionar Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Buscar cliente..."
                            value={clienteSearch}
                            onChange={(e) => setClienteSearch(e.target.value)}
                          />
                          <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {filteredClientes.map((cliente) => (
                              <Card
                                key={cliente.id}
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => {
                                  setClienteId(cliente.id);
                                  setClienteSearchOpen(false);
                                  setClienteSearch("");
                                }}
                              >
                                <CardContent className="p-4">
                                  <p className="font-medium">
                                    {cliente.nombre} {cliente.apellido}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{cliente.email}</p>
                                  <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-2">
                    <Label>Vehículo *</Label>
                    <Dialog open={vehiculoSearchOpen} onOpenChange={setVehiculoSearchOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-between"
                          disabled={!clienteId}
                        >
                          {selectedVehiculo
                            ? `${selectedVehiculo.marca} ${selectedVehiculo.modelo} - ${selectedVehiculo.placa}`
                            : clienteId
                            ? "Seleccionar vehículo"
                            : "Primero selecciona un cliente"}
                          <Search className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Seleccionar Vehículo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Buscar vehículo..."
                            value={vehiculoSearch}
                            onChange={(e) => setVehiculoSearch(e.target.value)}
                          />
                          <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {filteredVehiculos.map((vehiculo) => (
                              <Card
                                key={vehiculo.id}
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => {
                                  setVehiculoId(vehiculo.id);
                                  setVehiculoSearchOpen(false);
                                  setVehiculoSearch("");
                                }}
                              >
                                <CardContent className="p-4">
                                  <p className="font-medium">
                                    {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Placa: {vehiculo.placa}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Notas adicionales..."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab("partes")}>Siguiente</Button>
                </div>
              </TabsContent>

              <TabsContent value="partes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Partes y Servicios</h3>
                  <Button onClick={handleAddParte} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Parte
                  </Button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {partes.map((parte, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Parte #{index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParte(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="grid gap-2">
                            <Label>Categoría *</Label>
                            <Select
                              value={parte.categoria_id}
                              onValueChange={(value) =>
                                handleParteChange(index, "categoria_id", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {categorias.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={parte.cantidad}
                              onChange={(e) =>
                                handleParteChange(index, "cantidad", parseInt(e.target.value) || 1)
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Operación *</Label>
                            <Select
                              value={parte.operacion}
                              onValueChange={(value: OperacionParte) =>
                                handleParteChange(index, "operacion", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="corregir">Corregir</SelectItem>
                                <SelectItem value="reparar">Reparar</SelectItem>
                                <SelectItem value="cambiar">Cambiar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-3 grid gap-2">
                            <Label>Descripción *</Label>
                            <Textarea
                              value={parte.descripcion}
                              onChange={(e) =>
                                handleParteChange(index, "descripcion", e.target.value)
                              }
                              placeholder="Describe el trabajo a realizar..."
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Tipo Material</Label>
                            <Input
                              value={parte.tipo_material}
                              onChange={(e) =>
                                handleParteChange(index, "tipo_material", e.target.value)
                              }
                              placeholder="Hierro, Plástico, etc."
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Tipo Reparación</Label>
                            <Input
                              value={parte.tipo_reparacion}
                              onChange={(e) =>
                                handleParteChange(index, "tipo_reparacion", e.target.value)
                              }
                              placeholder="Mecánica, General, etc."
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Días</Label>
                            <Input
                              type="number"
                              min="0"
                              value={parte.dias}
                              onChange={(e) =>
                                handleParteChange(index, "dias", parseInt(e.target.value) || 0)
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Horas</Label>
                            <Input
                              type="number"
                              min="0"
                              value={parte.horas}
                              onChange={(e) =>
                                handleParteChange(index, "horas", parseInt(e.target.value) || 0)
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Mano de Obra (L)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={parte.mano_obra}
                              onChange={(e) =>
                                handleParteChange(
                                  index,
                                  "mano_obra",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Materiales (L)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={parte.materiales}
                              onChange={(e) =>
                                handleParteChange(
                                  index,
                                  "materiales",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Repuestos (L)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={parte.repuestos}
                              onChange={(e) =>
                                handleParteChange(
                                  index,
                                  "repuestos",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Subtotal</Label>
                            <Input
                              type="text"
                              value={`L ${parte.subtotal.toFixed(2)}`}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("cliente")}>
                    Anterior
                  </Button>
                  <Button onClick={() => setActiveTab("resumen")}>Siguiente</Button>
                </div>
              </TabsContent>

              <TabsContent value="resumen" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Cotización</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Información General</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Fecha:</span>{" "}
                            {format(new Date(fecha), "dd/MM/yyyy")}
                          </p>
                          {observaciones && (
                            <p>
                              <span className="text-muted-foreground">Observaciones:</span>{" "}
                              {observaciones}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Cliente</h3>
                        {selectedCliente && (
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">
                              {selectedCliente.nombre} {selectedCliente.apellido}
                            </p>
                            <p className="text-muted-foreground">{selectedCliente.email}</p>
                            <p className="text-muted-foreground">{selectedCliente.telefono}</p>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <h3 className="font-semibold mb-2">Vehículo</h3>
                        {selectedVehiculo && (
                          <div className="space-y-1 text-sm">
                            <p className="font-medium">
                              {selectedVehiculo.marca} {selectedVehiculo.modelo} (
                              {selectedVehiculo.anio})
                            </p>
                            <p className="text-muted-foreground">
                              Placa: {selectedVehiculo.placa}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Partes y Servicios</h3>
                      <div className="space-y-2">
                        {partes.map((parte, index) => {
                          const categoria = categorias.find((c) => c.id === parte.categoria_id);
                          return (
                            <Card key={index}>
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {categoria?.nombre} - {parte.operacion.toUpperCase()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {parte.descripcion}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Cantidad: {parte.cantidad} | Material: {parte.tipo_material} |
                                      Reparación: {parte.tipo_reparacion}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Tiempo: {parte.dias} días, {parte.horas} horas
                                    </p>
                                  </div>
                                  <p className="font-semibold">L {parte.subtotal.toFixed(2)}</p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-semibold">Total</p>
                        <p className="text-2xl font-bold">L {calculateTotal().toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("partes")}>
                    Anterior
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editMode ? "Actualizar Cotización" : "Crear Cotización"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
          <CardDescription>
            Administra las cotizaciones creadas para tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-muted-foreground">Cargando cotizaciones...</p>
          ) : cotizaciones.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No hay cotizaciones registradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizaciones.map((cotizacion) => (
                  <TableRow key={cotizacion.id}>
                    <TableCell className="font-medium">
                      {cotizacion.codigo_cotizacion}
                    </TableCell>
                    <TableCell>{format(new Date(cotizacion.fecha), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {cotizacion.clientes
                        ? `${cotizacion.clientes.nombre} ${cotizacion.clientes.apellido}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {cotizacion.vehiculos
                        ? `${cotizacion.vehiculos.marca} ${cotizacion.vehiculos.modelo} - ${cotizacion.vehiculos.placa}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>L {cotizacion.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(cotizacion.estado)}>
                        {cotizacion.estado.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(cotizacion)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(cotizacion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cotizacion.id)}
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Cotización</DialogTitle>
          </DialogHeader>

          {selectedCotizacion && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Información General</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Código:</span>{" "}
                      {selectedCotizacion.codigo_cotizacion}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Fecha:</span>{" "}
                      {format(new Date(selectedCotizacion.fecha), "dd/MM/yyyy")}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Estado:</span>{" "}
                      <Badge variant={getEstadoBadgeVariant(selectedCotizacion.estado)}>
                        {selectedCotizacion.estado.replace("_", " ")}
                      </Badge>
                    </p>
                    {selectedCotizacion.observaciones && (
                      <p>
                        <span className="text-muted-foreground">Observaciones:</span>{" "}
                        {selectedCotizacion.observaciones}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Cliente</h3>
                  {selectedCotizacion.clientes && (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {selectedCotizacion.clientes.nombre}{" "}
                        {selectedCotizacion.clientes.apellido}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedCotizacion.clientes.email}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedCotizacion.clientes.telefono}
                      </p>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <h3 className="font-semibold mb-2">Vehículo</h3>
                  {selectedCotizacion.vehiculos && (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {selectedCotizacion.vehiculos.marca}{" "}
                        {selectedCotizacion.vehiculos.modelo} (
                        {selectedCotizacion.vehiculos.anio})
                      </p>
                      <p className="text-muted-foreground">
                        Placa: {selectedCotizacion.vehiculos.placa}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Partes y Servicios</h3>
                <div className="space-y-2">
                  {partes.map((parte, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {parte.categoria?.nombre} - {parte.operacion.toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground">{parte.descripcion}</p>
                            <p className="text-xs text-muted-foreground">
                              Cantidad: {parte.cantidad} | Material: {parte.tipo_material} |
                              Reparación: {parte.tipo_reparacion}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tiempo: {parte.dias} días, {parte.horas} horas
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Mano de obra: L {parte.mano_obra.toFixed(2)} | Materiales: L{" "}
                              {parte.materiales.toFixed(2)} | Repuestos: L{" "}
                              {parte.repuestos.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-semibold">L {parte.subtotal.toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-2xl font-bold">
                    L {selectedCotizacion.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
