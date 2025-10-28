import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface TallerEmpleado {
  id: string;
  user_id: string;
  nombre: string;
  apellidos: string;
  created_at: string;
}

interface UserWithRole extends TallerEmpleado {
  email: string;
  role: string;
}

export default function Accesos() {
  const [usuarios, setUsuarios] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { role: userRole } = useUserRole();

  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    role: "taller" as "taller" | "admin_taller",
  });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      
      // Get current user's taller
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: taller } = await supabase
        .from('talleres')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!taller) return;

      // Get all employees from this taller
      const { data: empleados, error: empleadosError } = await supabase
        .from('taller_empleados')
        .select('*')
        .eq('taller_id', taller.id)
        .order('created_at', { ascending: false });

      if (empleadosError) throw empleadosError;

      // Get roles for these users
      const userIds = empleados?.map(e => e.user_id) || [];
      
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Get emails from auth (we'll need to store this in taller_empleados or get it differently)
      // For now, we'll create a combined view
      const usuariosWithRoles: UserWithRole[] = empleados?.map(emp => {
        const roleData = roles?.find(r => r.user_id === emp.user_id);
        return {
          ...emp,
          email: '', // We'll need to get this from auth or store it
          role: roleData?.role || 'taller',
        };
      }) || [];

      setUsuarios(usuariosWithRoles);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'admin_taller') {
      fetchUsuarios();
    }
  }, [userRole]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellidos || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-taller-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear usuario');
      }

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });

      setIsDialogOpen(false);
      setFormData({
        nombre: "",
        apellidos: "",
        email: "",
        password: "",
        role: "taller",
      });
      
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin_taller' ? 'default' : 'secondary';
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin_taller' ? 'Administrador' : 'Usuario';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Accesos</h1>
          <p className="text-muted-foreground">Administración de usuarios y permisos del taller</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea un nuevo usuario para tu taller. Todos los campos son obligatorios.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Juan"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input
                    id="apellidos"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    placeholder="Pérez García"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "taller" | "admin_taller") => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taller">Usuario Taller</SelectItem>
                      <SelectItem value="admin_taller">Administrador Taller</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Los administradores tienen acceso a todos los módulos
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear Usuario
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Taller</CardTitle>
          <CardDescription>
            Lista de todos los usuarios con acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay usuarios registrados aún</p>
              <p className="text-sm mt-2">Crea el primer usuario para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellidos</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nombre}</TableCell>
                    <TableCell>{usuario.apellidos}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(usuario.role)}>
                        {getRoleLabel(usuario.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(usuario.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
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
