import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Building2, Truck, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { ExportButtons } from "@/components/ExportButtons";
import { formatDateForExport } from "@/lib/exportUtils";

type TipoCliente = "individual" | "empresa" | "flota";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  nombre_empresa: string | null;
  email: string;
  telefono: string;
  tipo_cliente: TipoCliente;
  created_at: string;
}

interface ClienteFormData {
  nombre: string;
  apellido: string;
  nombre_empresa: string;
  email: string;
  password: string;
  telefono: string;
  tipo_cliente: TipoCliente;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, watch } = useForm<ClienteFormData>();
  
  const tipoCliente = watch("tipo_cliente");

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error("Error fetching clientes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: ClienteFormData) => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const { data, error } = await supabase.functions.invoke("create-cliente", {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Cliente creado",
        description: `${formData.nombre} ${formData.apellido} ha sido registrado exitosamente`,
      });

      reset();
      setDialogOpen(false);
      fetchClientes();
    } catch (error: any) {
      console.error("Error creating cliente:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cliente",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTipoIcon = (tipo: TipoCliente) => {
    switch (tipo) {
      case "individual":
        return <User className="h-4 w-4" />;
      case "empresa":
        return <Building2 className="h-4 w-4" />;
      case "flota":
        return <Truck className="h-4 w-4" />;
    }
  };

  const getTipoBadgeVariant = (tipo: TipoCliente): "default" | "secondary" | "outline" => {
    switch (tipo) {
      case "individual":
        return "default";
      case "empresa":
        return "secondary";
      case "flota":
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administración de clientes del taller</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={clientes.map((cliente) => ({
              nombre: `${cliente.nombre} ${cliente.apellido}`,
              email: cliente.email,
              telefono: cliente.telefono,
              tipo: cliente.tipo_cliente === "individual" ? "Individual" : cliente.tipo_cliente === "empresa" ? "Empresa" : "Flota",
              empresa: cliente.nombre_empresa || "-",
              fecha_registro: formatDateForExport(cliente.created_at),
            }))}
            columns={[
              { header: "Nombre", key: "nombre", width: 25 },
              { header: "Email", key: "email", width: 25 },
              { header: "Teléfono", key: "telefono", width: 15 },
              { header: "Tipo", key: "tipo", width: 15 },
              { header: "Empresa", key: "empresa", width: 25 },
              { header: "Fecha Registro", key: "fecha_registro", width: 15 },
            ]}
            fileName="clientes"
            title="Reporte de Clientes"
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Complete los datos del cliente para registrarlo en el sistema
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

              <div className="space-y-2">
                <Label htmlFor="tipo_cliente">Tipo de Cliente *</Label>
                <Select onValueChange={(value) => setValue("tipo_cliente", value as TipoCliente)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="flota">Flota</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(tipoCliente === "empresa" || tipoCliente === "flota") && (
                <div className="space-y-2">
                  <Label htmlFor="nombre_empresa">Nombre de Empresa</Label>
                  <Input
                    id="nombre_empresa"
                    {...register("nombre_empresa")}
                    placeholder="Empresa S.A."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: true })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  {...register("telefono", { required: true })}
                  placeholder="+52 123 456 7890"
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
                  {submitting ? "Creando..." : "Crear Cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando clientes...</p>
          ) : clientes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay clientes registrados. Crea uno usando el botón "Nuevo Cliente"
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.nombre} {cliente.apellido}
                    </TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefono}</TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadgeVariant(cliente.tipo_cliente)} className="flex items-center gap-1 w-fit">
                        {getTipoIcon(cliente.tipo_cliente)}
                        {cliente.tipo_cliente.charAt(0).toUpperCase() + cliente.tipo_cliente.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cliente.nombre_empresa || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(cliente.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
