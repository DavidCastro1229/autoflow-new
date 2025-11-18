import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { ExportButtons } from "@/components/ExportButtons";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

interface Orden {
  id: string;
  descripcion: string;
  fecha_ingreso: string;
  estado: string;
}

interface Factura {
  id: string;
  numero_factura: string;
  nombre_factura: string;
  estado: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  cliente_id: string;
  orden_id: string | null;
  subtotal: number;
  impuestos: number;
  descuento: number;
  total: number;
  notas: string | null;
  metodo_pago: string | null;
  tipo_tarjeta: string | null;
  referencia_pago: string | null;
  fecha_pago: string | null;
  monto_pagado: number;
  nota_pago: string | null;
  clientes?: Cliente;
  ordenes?: Orden;
}

interface FacturaFormData {
  nombre_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente_id: string;
  orden_id: string;
  subtotal: string;
  impuestos: string;
  descuento: string;
  notas: string;
  metodo_pago: string;
  tipo_tarjeta: string;
  referencia_pago: string;
  nota_pago: string;
}

const estadoColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "outline",
  pagada: "secondary",
  parcial: "default",
  vencida: "destructive",
  cancelada: "destructive",
};

export default function Facturacion() {
  const { role, tallerId } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isOrdenModalOpen, setIsOrdenModalOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState<string | null>(null);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [clienteSearch, setClienteSearch] = useState("");
  const [ordenSearch, setOrdenSearch] = useState("");

  const [formData, setFormData] = useState<FacturaFormData>({
    nombre_factura: "",
    fecha_emision: new Date().toISOString().split("T")[0],
    fecha_vencimiento: "",
    cliente_id: "",
    orden_id: "",
    subtotal: "0",
    impuestos: "0",
    descuento: "0",
    notas: "",
    metodo_pago: "",
    tipo_tarjeta: "",
    referencia_pago: "",
    nota_pago: "",
  });

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ["facturas", tallerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facturas" as any)
        .select(`
          *,
          clientes (id, nombre, apellido, email, telefono),
          ordenes (id, descripcion, fecha_ingreso, estado)
        `)
        .eq("taller_id", tallerId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any;
    },
    enabled: !!tallerId,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes", tallerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("taller_id", tallerId!)
        .order("nombre");

      if (error) throw error;
      return data as Cliente[];
    },
    enabled: !!tallerId && isClienteModalOpen,
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ["ordenes", tallerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordenes")
        .select("*")
        .eq("taller_id", tallerId!)
        .order("fecha_ingreso", { ascending: false });

      if (error) throw error;
      return data as Orden[];
    },
    enabled: !!tallerId && isOrdenModalOpen,
  });

  const calculateTotal = () => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const impuestos = parseFloat(formData.impuestos) || 0;
    const descuento = parseFloat(formData.descuento) || 0;
    return subtotal + impuestos - descuento;
  };

  const createMutation = useMutation({
    mutationFn: async (data: FacturaFormData) => {
      const total = calculateTotal();
      
      // Generar número de factura
      const { data: numeroData, error: numeroError } = await supabase
        .rpc("generate_numero_factura");
      
      if (numeroError) throw numeroError;

      const facturaData = {
        numero_factura: numeroData,
        nombre_factura: data.nombre_factura,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento: data.fecha_vencimiento || null,
        cliente_id: data.cliente_id,
        orden_id: data.orden_id || null,
        taller_id: tallerId,
        subtotal: parseFloat(data.subtotal),
        impuestos: parseFloat(data.impuestos),
        descuento: parseFloat(data.descuento) || 0,
        total,
        notas: data.notas || null,
        metodo_pago: data.metodo_pago || null,
        tipo_tarjeta: data.tipo_tarjeta || null,
        referencia_pago: data.referencia_pago || null,
        nota_pago: data.nota_pago || null,
        monto_pagado: data.metodo_pago ? total : 0,
        fecha_pago: data.metodo_pago ? data.fecha_emision : null,
        estado: data.metodo_pago ? "pagada" : "pendiente",
      };

      const { error } = await supabase
        .from("facturas" as any)
        .insert(facturaData as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast({
        title: "Factura creada",
        description: "La factura se ha creado correctamente",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo crear la factura: ${error.message}`,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FacturaFormData) => {
      const total = calculateTotal();
      
      const facturaData = {
        nombre_factura: data.nombre_factura,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento: data.fecha_vencimiento || null,
        cliente_id: data.cliente_id,
        orden_id: data.orden_id || null,
        subtotal: parseFloat(data.subtotal),
        impuestos: parseFloat(data.impuestos),
        descuento: parseFloat(data.descuento) || 0,
        total,
        notas: data.notas || null,
        metodo_pago: data.metodo_pago || null,
        tipo_tarjeta: data.tipo_tarjeta || null,
        referencia_pago: data.referencia_pago || null,
        nota_pago: data.nota_pago || null,
      };

      const { error } = await supabase
        .from("facturas" as any)
        .update(facturaData as any)
        .eq("id", editingFactura!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast({
        title: "Factura actualizada",
        description: "La factura se ha actualizado correctamente",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo actualizar la factura: ${error.message}`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("facturas" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast({
        title: "Factura eliminada",
        description: "La factura se ha eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `No se pudo eliminar la factura: ${error.message}`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFactura) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_factura: "",
      fecha_emision: new Date().toISOString().split("T")[0],
      fecha_vencimiento: "",
      cliente_id: "",
      orden_id: "",
      subtotal: "0",
      impuestos: "0",
      descuento: "0",
      notas: "",
      metodo_pago: "",
      tipo_tarjeta: "",
      referencia_pago: "",
      nota_pago: "",
    });
    setEditingFactura(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (factura: Factura) => {
    setFormData({
      nombre_factura: factura.nombre_factura,
      fecha_emision: factura.fecha_emision,
      fecha_vencimiento: factura.fecha_vencimiento || "",
      cliente_id: factura.cliente_id,
      orden_id: factura.orden_id || "",
      subtotal: factura.subtotal.toString(),
      impuestos: factura.impuestos.toString(),
      descuento: factura.descuento.toString(),
      notas: factura.notas || "",
      metodo_pago: factura.metodo_pago || "",
      tipo_tarjeta: factura.tipo_tarjeta || "",
      referencia_pago: factura.referencia_pago || "",
      nota_pago: factura.nota_pago || "",
    });
    setEditingFactura(factura.id);
    setIsDialogOpen(true);
  };

  const handleViewDetail = (factura: Factura) => {
    setSelectedFactura(factura);
    setIsDetailDialogOpen(true);
  };

  const handleSelectCliente = (clienteId: string) => {
    setFormData({ ...formData, cliente_id: clienteId });
    setIsClienteModalOpen(false);
    setClienteSearch("");
  };

  const handleSelectOrden = (ordenId: string) => {
    setFormData({ ...formData, orden_id: ordenId });
    setIsOrdenModalOpen(false);
    setOrdenSearch("");
  };

  const filteredClientes = clientes.filter((cliente) =>
    `${cliente.nombre} ${cliente.apellido} ${cliente.email}`
      .toLowerCase()
      .includes(clienteSearch.toLowerCase())
  );

  const filteredOrdenes = ordenes.filter((orden) =>
    orden.descripcion.toLowerCase().includes(ordenSearch.toLowerCase())
  );

  const selectedClienteName = clientes.find(c => c.id === formData.cliente_id);
  const selectedOrdenDesc = ordenes.find(o => o.id === formData.orden_id);

  if (isLoading) {
    return <div className="p-6">Cargando facturas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">Gestión de facturas</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={(facturas || []).map((factura) => ({
              numero: factura.numero_factura,
              nombre: factura.nombre_factura,
              cliente: `${factura.clientes.nombre} ${factura.clientes.apellido}`,
              fecha_emision: format(new Date(factura.fecha_emision), "dd/MM/yyyy"),
              fecha_vencimiento: factura.fecha_vencimiento ? format(new Date(factura.fecha_vencimiento), "dd/MM/yyyy") : "N/A",
              subtotal: `L ${factura.subtotal.toLocaleString()}`,
              impuestos: `L ${factura.impuestos.toLocaleString()}`,
              total: `L ${factura.total.toLocaleString()}`,
              estado: factura.estado,
              metodo_pago: factura.metodo_pago || "N/A",
            }))}
            columns={[
              { header: "Número", key: "numero", width: 15 },
              { header: "Nombre", key: "nombre", width: 25 },
              { header: "Cliente", key: "cliente", width: 25 },
              { header: "Fecha Emisión", key: "fecha_emision", width: 15 },
              { header: "Fecha Vencimiento", key: "fecha_vencimiento", width: 15 },
              { header: "Subtotal", key: "subtotal", width: 12 },
              { header: "Impuestos", key: "impuestos", width: 12 },
              { header: "Total", key: "total", width: 12 },
              { header: "Estado", key: "estado", width: 12 },
              { header: "Método Pago", key: "metodo_pago", width: 15 },
            ]}
            fileName="facturas"
            title="Reporte de Facturación"
          />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha Emisión</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay facturas registradas
                </TableCell>
              </TableRow>
            ) : (
              facturas.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell className="font-mono">{factura.numero_factura}</TableCell>
                  <TableCell>{factura.nombre_factura}</TableCell>
                  <TableCell>
                    {factura.clientes
                      ? `${factura.clientes.nombre} ${factura.clientes.apellido}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{format(new Date(factura.fecha_emision), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-semibold">
                    L. {factura.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={estadoColors[factura.estado]}>
                      {factura.estado.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(factura)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(factura)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(factura.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para crear/editar factura */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFactura ? "Editar Factura" : "Nueva Factura"}
            </DialogTitle>
            <DialogDescription>
              Complete los datos de la factura
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nombre_factura">Nombre de Factura *</Label>
                <Input
                  id="nombre_factura"
                  value={formData.nombre_factura}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_factura: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="fecha_emision">Fecha Emisión *</Label>
                <Input
                  id="fecha_emision"
                  type="date"
                  value={formData.fecha_emision}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_emision: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="fecha_vencimiento">Fecha Vencimiento</Label>
                <Input
                  id="fecha_vencimiento"
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_vencimiento: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2">
                <Label>Cliente *</Label>
                <div className="flex gap-2">
                  <Input
                    value={
                      selectedClienteName
                        ? `${selectedClienteName.nombre} ${selectedClienteName.apellido}`
                        : ""
                    }
                    placeholder="Seleccione un cliente"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsClienteModalOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="col-span-2">
                <Label>Orden de Trabajo</Label>
                <div className="flex gap-2">
                  <Input
                    value={selectedOrdenDesc?.descripcion || ""}
                    placeholder="Seleccione una orden (opcional)"
                    readOnly
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOrdenModalOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="subtotal">Subtotal *</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) =>
                    setFormData({ ...formData, subtotal: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="impuestos">Impuestos *</Label>
                <Input
                  id="impuestos"
                  type="number"
                  step="0.01"
                  value={formData.impuestos}
                  onChange={(e) =>
                    setFormData({ ...formData, impuestos: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="descuento">Descuento</Label>
                <Input
                  id="descuento"
                  type="number"
                  step="0.01"
                  value={formData.descuento}
                  onChange={(e) =>
                    setFormData({ ...formData, descuento: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Total</Label>
                <Input
                  value={`L. ${calculateTotal().toFixed(2)}`}
                  readOnly
                  className="font-semibold"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="col-span-2">
                <h3 className="text-lg font-semibold mb-3">Datos de Pago</h3>
              </div>

              <div>
                <Label htmlFor="metodo_pago">Método de Pago</Label>
                <Select
                  value={formData.metodo_pago}
                  onValueChange={(value) =>
                    setFormData({ ...formData, metodo_pago: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo_tarjeta">Tipo de Tarjeta</Label>
                <Select
                  value={formData.tipo_tarjeta}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipo_tarjeta: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="discover">Discover</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="referencia_pago">Referencia de Pago</Label>
                <Input
                  id="referencia_pago"
                  value={formData.referencia_pago}
                  onChange={(e) =>
                    setFormData({ ...formData, referencia_pago: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="nota_pago">Nota de Pago</Label>
                <Textarea
                  id="nota_pago"
                  value={formData.nota_pago}
                  onChange={(e) =>
                    setFormData({ ...formData, nota_pago: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingFactura ? "Actualizar" : "Crear"} Factura
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para seleccionar cliente */}
      <Dialog open={isClienteModalOpen} onOpenChange={setIsClienteModalOpen}>
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
                <div
                  key={cliente.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleSelectCliente(cliente.id)}
                >
                  <div className="font-semibold">
                    {cliente.nombre} {cliente.apellido}
                  </div>
                  <div className="text-sm text-muted-foreground">{cliente.email}</div>
                  <div className="text-sm text-muted-foreground">{cliente.telefono}</div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para seleccionar orden */}
      <Dialog open={isOrdenModalOpen} onOpenChange={setIsOrdenModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Orden de Trabajo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Buscar orden..."
              value={ordenSearch}
              onChange={(e) => setOrdenSearch(e.target.value)}
            />
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredOrdenes.map((orden) => (
                <div
                  key={orden.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleSelectOrden(orden.id)}
                >
                  <div className="font-semibold">{orden.descripcion}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(orden.fecha_ingreso), "dd/MM/yyyy")}
                  </div>
                  <Badge variant="outline">{orden.estado}</Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalle completo */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
          </DialogHeader>
          {selectedFactura && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Número</Label>
                  <p className="font-mono font-semibold">{selectedFactura.numero_factura}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <div>
                    <Badge variant={estadoColors[selectedFactura.estado]}>
                      {selectedFactura.estado.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-semibold">{selectedFactura.nombre_factura}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha Emisión</Label>
                  <p>{format(new Date(selectedFactura.fecha_emision), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha Vencimiento</Label>
                  <p>
                    {selectedFactura.fecha_vencimiento
                      ? format(new Date(selectedFactura.fecha_vencimiento), "dd/MM/yyyy")
                      : "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p>
                    {selectedFactura.clientes
                      ? `${selectedFactura.clientes.nombre} ${selectedFactura.clientes.apellido}`
                      : "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Orden</Label>
                  <p>{selectedFactura.ordenes?.descripcion || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <p className="font-semibold">L. {selectedFactura.subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Impuestos</Label>
                  <p className="font-semibold">L. {selectedFactura.impuestos.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Descuento</Label>
                  <p className="font-semibold">L. {selectedFactura.descuento.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total</Label>
                  <p className="text-xl font-bold">L. {selectedFactura.total.toFixed(2)}</p>
                </div>
                {selectedFactura.notas && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Notas</Label>
                    <p>{selectedFactura.notas}</p>
                  </div>
                )}
                {selectedFactura.metodo_pago && (
                  <>
                    <div className="col-span-2 border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-2">Información de Pago</h3>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Método de Pago</Label>
                      <p className="capitalize">{selectedFactura.metodo_pago.replace("_", " ")}</p>
                    </div>
                    {selectedFactura.tipo_tarjeta && (
                      <div>
                        <Label className="text-muted-foreground">Tipo de Tarjeta</Label>
                        <p className="capitalize">{selectedFactura.tipo_tarjeta}</p>
                      </div>
                    )}
                    {selectedFactura.referencia_pago && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Referencia</Label>
                        <p>{selectedFactura.referencia_pago}</p>
                      </div>
                    )}
                    {selectedFactura.nota_pago && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Nota de Pago</Label>
                        <p>{selectedFactura.nota_pago}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
