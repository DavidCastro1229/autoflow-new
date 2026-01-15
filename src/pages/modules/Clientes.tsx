import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Building2, Truck, User, Pencil, Trash2, Mail, Phone, Calendar, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { ExportButtons } from "@/components/ExportButtons";
import { formatDateForExport } from "@/lib/exportUtils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type TipoCliente = "individual" | "empresa" | "flota";

interface Cliente {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  nombre_empresa: string | null;
  email: string;
  telefono: string;
  tipo_cliente: TipoCliente;
  created_at: string;
  updated_at: string;
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

interface EditClienteFormData {
  nombre: string;
  apellido: string;
  nombre_empresa: string;
  telefono: string;
  tipo_cliente: TipoCliente;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue, watch } = useForm<ClienteFormData>();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, watch: watchEdit } = useForm<EditClienteFormData>();
  
  const tipoCliente = watch("tipo_cliente");
  const tipoClienteEdit = watchEdit("tipo_cliente");

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const filtered = clientes.filter((cliente) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cliente.nombre.toLowerCase().includes(searchLower) ||
        cliente.apellido.toLowerCase().includes(searchLower) ||
        cliente.email.toLowerCase().includes(searchLower) ||
        cliente.telefono.includes(searchTerm) ||
        (cliente.nombre_empresa && cliente.nombre_empresa.toLowerCase().includes(searchLower))
      );
    });
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientes(data || []);
      setFilteredClientes(data || []);
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
      
      let errorMessage = "No se pudo crear el cliente";
      const errorText = error.message || "";
      
      if (errorText.includes("email address has already been registered") || errorText.includes("email_exists")) {
        errorMessage = "Ya existe un cliente registrado con este correo electrónico. Por favor use otro correo o busque el cliente existente.";
      } else if (errorText) {
        errorMessage = errorText;
      }
      
      toast({
        title: "Error al crear cliente",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setValueEdit("nombre", cliente.nombre);
    setValueEdit("apellido", cliente.apellido);
    setValueEdit("nombre_empresa", cliente.nombre_empresa || "");
    setValueEdit("telefono", cliente.telefono);
    setValueEdit("tipo_cliente", cliente.tipo_cliente);
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (formData: EditClienteFormData) => {
    if (!selectedCliente) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          nombre_empresa: formData.nombre_empresa || null,
          telefono: formData.telefono,
          tipo_cliente: formData.tipo_cliente,
        })
        .eq("id", selectedCliente.id);

      if (error) throw error;

      toast({
        title: "Cliente actualizado",
        description: `${formData.nombre} ${formData.apellido} ha sido actualizado exitosamente`,
      });

      resetEdit();
      setEditDialogOpen(false);
      setSelectedCliente(null);
      fetchClientes();
    } catch (error: any) {
      console.error("Error updating cliente:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCliente = async () => {
    if (!selectedCliente) return;
    
    setSubmitting(true);
    try {
      // Delete the cliente record (the auth user will remain but won't have access)
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", selectedCliente.id);

      if (error) throw error;

      toast({
        title: "Cliente eliminado",
        description: `${selectedCliente.nombre} ${selectedCliente.apellido} ha sido eliminado del sistema`,
      });

      setDeleteDialogOpen(false);
      setSelectedCliente(null);
      fetchClientes();
    } catch (error: any) {
      console.error("Error deleting cliente:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Individuales</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter((c) => c.tipo_cliente === "individual").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter((c) => c.tipo_cliente === "empresa").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flotas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter((c) => c.tipo_cliente === "flota").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Clientes
              </CardTitle>
              <CardDescription>
                {filteredClientes.length} de {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Cargando clientes...</p>
          ) : filteredClientes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No se encontraron clientes con ese criterio de búsqueda" : "No hay clientes registrados. Crea uno usando el botón \"Nuevo Cliente\""}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{cliente.nombre} {cliente.apellido}</p>
                          <p className="text-sm text-muted-foreground">ID: {cliente.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{cliente.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{cliente.telefono}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadgeVariant(cliente.tipo_cliente)} className="flex items-center gap-1 w-fit">
                        {getTipoIcon(cliente.tipo_cliente)}
                        {cliente.tipo_cliente.charAt(0).toUpperCase() + cliente.tipo_cliente.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cliente.nombre_empresa ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{cliente.nombre_empresa}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatDate(cliente.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(cliente.updated_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(cliente)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(cliente)}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifique los datos del cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_nombre">Nombre *</Label>
                <Input
                  id="edit_nombre"
                  {...registerEdit("nombre", { required: true })}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_apellido">Apellido *</Label>
                <Input
                  id="edit_apellido"
                  {...registerEdit("apellido", { required: true })}
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_tipo_cliente">Tipo de Cliente *</Label>
              <Select 
                value={tipoClienteEdit}
                onValueChange={(value) => setValueEdit("tipo_cliente", value as TipoCliente)}
              >
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

            {(tipoClienteEdit === "empresa" || tipoClienteEdit === "flota") && (
              <div className="space-y-2">
                <Label htmlFor="edit_nombre_empresa">Nombre de Empresa</Label>
                <Input
                  id="edit_nombre_empresa"
                  {...registerEdit("nombre_empresa")}
                  placeholder="Empresa S.A."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit_telefono">Teléfono *</Label>
              <Input
                id="edit_telefono"
                {...registerEdit("telefono", { required: true })}
                placeholder="+52 123 456 7890"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> El correo electrónico no puede ser modificado ya que está vinculado a la cuenta del usuario.
              </p>
              {selectedCliente && (
                <p className="text-sm mt-1">
                  Email actual: <span className="font-medium">{selectedCliente.email}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedCliente(null);
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente a{" "}
              <strong>{selectedCliente?.nombre} {selectedCliente?.apellido}</strong> del sistema.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCliente}
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
