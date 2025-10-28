import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileCheck, Check, X, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TallerSolicitud {
  id: string;
  nombre_taller: string;
  nombre_contacto: string;
  apellido_contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  descripcion: string | null;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
}

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState<TallerSolicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedTaller, setSelectedTaller] = useState<TallerSolicitud | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  const fetchSolicitudes = async () => {
    try {
      const { data, error } = await supabase
        .from('talleres')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitudes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleApprove = async (tallerId: string) => {
    setProcessingId(tallerId);
    try {
      const { error } = await supabase.rpc('approve_taller', {
        taller_id_param: tallerId
      });

      if (error) throw error;

      toast({
        title: "Taller aprobado",
        description: "El taller ha sido aprobado exitosamente",
      });

      await fetchSolicitudes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (tallerId: string) => {
    setProcessingId(tallerId);
    try {
      const { error } = await supabase.rpc('reject_taller', {
        taller_id_param: tallerId
      });

      if (error) throw error;

      toast({
        title: "Taller rechazado",
        description: "La solicitud ha sido rechazada",
      });

      await fetchSolicitudes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (taller: TallerSolicitud) => {
    setSelectedTaller(taller);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Pendiente</Badge>;
      case 'aprobado':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500">Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500">Rechazado</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      <Card>
        <CardHeader>
          <CardTitle>Todas las Solicitudes</CardTitle>
          <CardDescription>
            Revisa y gestiona las solicitudes de registro de talleres
          </CardDescription>
        </CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay solicitudes de talleres
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
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solicitudes.map((solicitud) => (
                  <TableRow key={solicitud.id}>
                    <TableCell className="font-medium">{solicitud.nombre_taller}</TableCell>
                    <TableCell>
                      {solicitud.nombre_contacto} {solicitud.apellido_contacto}
                    </TableCell>
                    <TableCell>{solicitud.email}</TableCell>
                    <TableCell>{solicitud.telefono}</TableCell>
                    <TableCell>
                      {solicitud.ciudad}, {solicitud.estado}
                    </TableCell>
                    <TableCell>{getStatusBadge(solicitud.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(solicitud)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        {solicitud.status === 'pendiente' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(solicitud.id)}
                              disabled={processingId === solicitud.id}
                              className="bg-green-500/10 hover:bg-green-500/20 text-green-500"
                            >
                              {processingId === solicitud.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprobar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(solicitud.id)}
                              disabled={processingId === solicitud.id}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                            >
                              {processingId === solicitud.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Rechazar
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Taller</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud
            </DialogDescription>
          </DialogHeader>
          
          {selectedTaller && (
            <div className="space-y-6">
              {/* Estado */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Estado de la Solicitud</span>
                {getStatusBadge(selectedTaller.status)}
              </div>

              {/* Información del Taller */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información del Taller</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre del Taller</p>
                    <p className="font-medium">{selectedTaller.nombre_taller}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedTaller.telefono}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedTaller.email}</p>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información de Contacto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedTaller.nombre_contacto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Apellido</p>
                    <p className="font-medium">{selectedTaller.apellido_contacto}</p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Ubicación</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{selectedTaller.direccion}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ciudad</p>
                      <p className="font-medium">{selectedTaller.ciudad}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="font-medium">{selectedTaller.estado}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Código Postal</p>
                      <p className="font-medium">{selectedTaller.codigo_postal}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedTaller.descripcion && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Descripción</h3>
                  <p className="text-sm">{selectedTaller.descripcion}</p>
                </div>
              )}

              {/* Fecha de Registro */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información Adicional</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                  <p className="font-medium">
                    {new Date(selectedTaller.created_at).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              {selectedTaller.status === 'pendiente' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500"
                    onClick={() => {
                      handleApprove(selectedTaller.id);
                      setDetailsOpen(false);
                    }}
                    disabled={processingId === selectedTaller.id}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar Taller
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500"
                    onClick={() => {
                      handleReject(selectedTaller.id);
                      setDetailsOpen(false);
                    }}
                    disabled={processingId === selectedTaller.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rechazar Taller
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Solicitudes;
