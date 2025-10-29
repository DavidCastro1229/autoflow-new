import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Car, Loader2, Plus, Eye } from "lucide-react";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  nombre_empresa: string | null;
  tipo_cliente: string;
}

interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  color: string;
  estado: string;
  vin: string;
  kilometraje: number;
  cliente_id: string;
  clientes: {
    nombre: string;
    apellido: string;
    nombre_empresa: string | null;
  };
}

export default function Vehiculos() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    placa: "",
    color: "",
    estado: "activo",
    vin: "",
    kilometraje: 0,
    cliente_id: "",
  });

  useEffect(() => {
    fetchClientes();
    fetchVehiculos();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.taller_id) return;

      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("taller_id", userRoles.taller_id);

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error("Error fetching clientes:", error);
    }
  };

  const fetchVehiculos = async () => {
    try {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.taller_id) return;

      const { data, error } = await supabase
        .from("vehiculos")
        .select(`
          *,
          clientes (
            nombre,
            apellido,
            nombre_empresa
          )
        `)
        .eq("taller_id", userRoles.taller_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehiculos(data || []);
    } catch (error: any) {
      console.error("Error fetching vehiculos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("taller_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .single();

      if (!userRoles?.taller_id) {
        throw new Error("No se encontró el taller asociado");
      }

      const { error } = await supabase.from("vehiculos").insert([{
        marca: formData.marca,
        modelo: formData.modelo,
        anio: formData.anio,
        placa: formData.placa,
        color: formData.color,
        estado: formData.estado as any,
        vin: formData.vin,
        kilometraje: formData.kilometraje,
        cliente_id: formData.cliente_id,
        taller_id: userRoles.taller_id,
      }]);

      if (error) throw error;

      toast({
        title: "Vehículo registrado",
        description: "El vehículo ha sido registrado exitosamente",
      });

      setFormData({
        marca: "",
        modelo: "",
        anio: new Date().getFullYear(),
        placa: "",
        color: "",
        estado: "activo",
        vin: "",
        kilometraje: 0,
        cliente_id: "",
      });

      setModalOpen(false);
      fetchVehiculos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el vehículo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "activo":
        return "default";
      case "en_servicio":
        return "secondary";
      case "entregado":
        return "outline";
      case "inactivo":
        return "destructive";
      default:
        return "default";
    }
  };

  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatTipoCliente = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      individual: "Individual",
      empresa: "Empresa",
      flota: "Flota",
    };
    return tipos[tipo] || tipo;
  };

  const handleViewDetails = (vehiculo: Vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">Gestiona los vehículos del taller</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Vehículo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Registrar Vehículo
              </DialogTitle>
              <DialogDescription>
                Completa los datos del vehículo para registrarlo en el sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Select
                    value={formData.cliente_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cliente_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.tipo_cliente === "empresa"
                            ? `${cliente.nombre} ${cliente.apellido} - ${cliente.nombre_empresa}`
                            : `${cliente.nombre} ${cliente.apellido} (${formatTipoCliente(cliente.tipo_cliente)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca">Marca *</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) =>
                      setFormData({ ...formData, marca: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo *</Label>
                  <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) =>
                      setFormData({ ...formData, modelo: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anio">Año *</Label>
                  <Input
                    id="anio"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.anio}
                    onChange={(e) =>
                      setFormData({ ...formData, anio: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placa">Placa *</Label>
                  <Input
                    id="placa"
                    value={formData.placa}
                    onChange={(e) =>
                      setFormData({ ...formData, placa: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vin">VIN *</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) =>
                      setFormData({ ...formData, vin: e.target.value.toUpperCase() })
                    }
                    maxLength={17}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kilometraje">Kilometraje *</Label>
                  <Input
                    id="kilometraje"
                    type="number"
                    min="0"
                    value={formData.kilometraje}
                    onChange={(e) =>
                      setFormData({ ...formData, kilometraje: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) =>
                      setFormData({ ...formData, estado: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="en_servicio">En Servicio</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Vehículo"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehículos Registrados</CardTitle>
          <CardDescription>
            Lista de todos los vehículos del taller
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : vehiculos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay vehículos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Kilometraje</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiculos.map((vehiculo) => (
                    <TableRow key={vehiculo.id}>
                      <TableCell className="font-medium">{vehiculo.placa}</TableCell>
                      <TableCell>{vehiculo.marca}</TableCell>
                      <TableCell>{vehiculo.modelo}</TableCell>
                      <TableCell>{vehiculo.anio}</TableCell>
                      <TableCell>{vehiculo.color}</TableCell>
                      <TableCell className="font-mono text-xs">{vehiculo.vin}</TableCell>
                      <TableCell>{vehiculo.kilometraje.toLocaleString()} km</TableCell>
                      <TableCell>
                        {vehiculo.clientes.nombre_empresa
                          ? `${vehiculo.clientes.nombre} ${vehiculo.clientes.apellido} - ${vehiculo.clientes.nombre_empresa}`
                          : `${vehiculo.clientes.nombre} ${vehiculo.clientes.apellido}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(vehiculo.estado)}>
                          {formatEstado(vehiculo.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(vehiculo)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Detalles del Vehículo
            </DialogTitle>
          </DialogHeader>
          {selectedVehiculo && (
            <div className="space-y-6">
              {/* Información del Vehículo */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Información del Vehículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Placa</Label>
                    <p className="font-medium">{selectedVehiculo.placa}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Marca</Label>
                    <p className="font-medium">{selectedVehiculo.marca}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Modelo</Label>
                    <p className="font-medium">{selectedVehiculo.modelo}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Año</Label>
                    <p className="font-medium">{selectedVehiculo.anio}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Color</Label>
                    <p className="font-medium">{selectedVehiculo.color}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">VIN</Label>
                    <p className="font-medium font-mono text-xs">{selectedVehiculo.vin}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Kilometraje</Label>
                    <p className="font-medium">{selectedVehiculo.kilometraje.toLocaleString()} km</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      <Badge variant={getEstadoBadgeVariant(selectedVehiculo.estado)}>
                        {formatEstado(selectedVehiculo.estado)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nombre</Label>
                    <p className="font-medium">{selectedVehiculo.clientes.nombre}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Apellido</Label>
                    <p className="font-medium">{selectedVehiculo.clientes.apellido}</p>
                  </div>
                  {selectedVehiculo.clientes.nombre_empresa && (
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Nombre de Empresa</Label>
                      <p className="font-medium">{selectedVehiculo.clientes.nombre_empresa}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
