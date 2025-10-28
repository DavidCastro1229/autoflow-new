import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, UserCircle, Mail, Phone, Building2 } from "lucide-react";

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

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    nombre_empresa: "",
    email: "",
    password: "",
    telefono: "",
    tipo_cliente: "" as TipoCliente | "",
  });

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
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const { data, error } = await supabase.functions.invoke("create-cliente", {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "¡Cliente creado!",
        description: "El cliente ha sido registrado exitosamente",
      });

      setIsDialogOpen(false);
      setFormData({
        nombre: "",
        apellido: "",
        nombre_empresa: "",
        email: "",
        password: "",
        telefono: "",
        tipo_cliente: "",
      });
      fetchClientes();
    } catch (error: any) {
      console.error("Error creating cliente:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cliente",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getTipoClienteColor = (tipo: TipoCliente) => {
    switch (tipo) {
      case "individual":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "empresa":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "flota":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "";
    }
  };

  const getTipoClienteLabel = (tipo: TipoCliente) => {
    switch (tipo) {
      case "individual":
        return "Individual";
      case "empresa":
        return "Empresa";
      case "flota":
        return "Flota";
      default:
        return tipo;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administración de clientes del taller</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Ingresa los datos del cliente. Se creará una cuenta de usuario con acceso restringido.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_cliente">Tipo de Cliente *</Label>
                <Select
                  value={formData.tipo_cliente}
                  onValueChange={(value: TipoCliente) => setFormData({ ...formData, tipo_cliente: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="flota">Flota</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre_empresa">
                  Nombre de Empresa {formData.tipo_cliente !== "individual" && "*"}
                </Label>
                <Input
                  id="nombre_empresa"
                  value={formData.nombre_empresa}
                  onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
                  required={formData.tipo_cliente !== "individual"}
                  disabled={formData.tipo_cliente === "individual"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Cliente"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Cargando clientes...</p>
          ) : clientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay clientes registrados aún
            </p>
          ) : (
            <div className="space-y-4">
              {clientes.map((cliente) => (
                <Card key={cliente.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <UserCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {cliente.nombre} {cliente.apellido}
                              </h3>
                              {cliente.nombre_empresa && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Building2 className="h-4 w-4" />
                                  {cliente.nombre_empresa}
                                </div>
                              )}
                            </div>
                            <Badge className={getTipoClienteColor(cliente.tipo_cliente)}>
                              {getTipoClienteLabel(cliente.tipo_cliente)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {cliente.email}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {cliente.telefono}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
