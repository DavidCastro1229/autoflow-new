import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Taller = {
  id: string;
  nombre_taller: string;
  nombre_contacto: string;
  apellido_contacto: string;
  email: string;
  telefono: string;
  ciudad: string;
  estado: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
};

const Solicitudes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch talleres pendientes
  const { data: talleres, isLoading } = useQuery({
    queryKey: ['talleres-solicitudes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talleres')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Taller[];
    },
  });

  // Aprobar taller
  const approveMutation = useMutation({
    mutationFn: async (tallerId: string) => {
      const { error } = await supabase.rpc('approve_taller', {
        taller_id_param: tallerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talleres-solicitudes'] });
      toast({
        title: "Taller aprobado",
        description: "El taller ha sido aprobado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Rechazar taller
  const rejectMutation = useMutation({
    mutationFn: async (tallerId: string) => {
      const { error } = await supabase.rpc('reject_taller', {
        taller_id_param: tallerId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talleres-solicitudes'] });
      toast({
        title: "Taller rechazado",
        description: "El taller ha sido rechazado",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Pendiente</Badge>;
      case 'aprobado':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600">Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const talleresPendientes = talleres?.filter(t => t.status === 'pendiente') || [];
  const talleresAprobados = talleres?.filter(t => t.status === 'aprobado') || [];
  const talleresRechazados = talleres?.filter(t => t.status === 'rechazado') || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Talleres</h1>
          <p className="text-muted-foreground">Gestión de solicitudes de registro de talleres</p>
        </div>
      </div>

      {/* Solicitudes Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes ({talleresPendientes.length})</CardTitle>
          <CardDescription>
            Revisa y aprueba las solicitudes de registro de nuevos talleres
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : talleresPendientes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay solicitudes pendientes
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taller</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talleresPendientes.map((taller) => (
                  <TableRow key={taller.id}>
                    <TableCell className="font-medium">{taller.nombre_taller}</TableCell>
                    <TableCell>{taller.nombre_contacto} {taller.apellido_contacto}</TableCell>
                    <TableCell>{taller.email}</TableCell>
                    <TableCell>{taller.telefono}</TableCell>
                    <TableCell>{taller.ciudad}, {taller.estado}</TableCell>
                    <TableCell>{new Date(taller.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-600"
                        onClick={() => approveMutation.mutate(taller.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-600"
                        onClick={() => rejectMutation.mutate(taller.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Talleres Aprobados */}
      {talleresAprobados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Talleres Aprobados ({talleresAprobados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taller</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Aprobación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talleresAprobados.map((taller) => (
                  <TableRow key={taller.id}>
                    <TableCell className="font-medium">{taller.nombre_taller}</TableCell>
                    <TableCell>{taller.nombre_contacto} {taller.apellido_contacto}</TableCell>
                    <TableCell>{taller.email}</TableCell>
                    <TableCell>{taller.ciudad}, {taller.estado}</TableCell>
                    <TableCell>{getStatusBadge(taller.status)}</TableCell>
                    <TableCell>{new Date(taller.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Talleres Rechazados */}
      {talleresRechazados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Talleres Rechazados ({talleresRechazados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taller</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talleresRechazados.map((taller) => (
                  <TableRow key={taller.id}>
                    <TableCell className="font-medium">{taller.nombre_taller}</TableCell>
                    <TableCell>{taller.nombre_contacto} {taller.apellido_contacto}</TableCell>
                    <TableCell>{taller.email}</TableCell>
                    <TableCell>{taller.ciudad}, {taller.estado}</TableCell>
                    <TableCell>{getStatusBadge(taller.status)}</TableCell>
                    <TableCell>{new Date(taller.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Solicitudes;
