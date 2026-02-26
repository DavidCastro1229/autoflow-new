import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, Check, X, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FlotaSolicitud {
  id: string;
  nombre_flota: string;
  nombre_contacto: string | null;
  apellido_contacto: string | null;
  correo_contacto: string;
  telefono_contacto: string;
  direccion_fisica: string;
  ciudad: string | null;
  codigo_postal: string | null;
  razon_social: string;
  numero_rtn: string;
  rubro_empresa: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
}

const SolicitudesFlotas = () => {
  const [solicitudes, setSolicitudes] = useState<FlotaSolicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedFlota, setSelectedFlota] = useState<FlotaSolicitud | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  const fetchSolicitudes = async () => {
    try {
      const { data, error } = await supabase
        .from('flotas')
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

  const handleApprove = async (flotaId: string) => {
    setProcessingId(flotaId);
    try {
      const { error } = await supabase.rpc('approve_flota', {
        flota_id: flotaId
      });

      if (error) throw error;

      toast({
        title: "Flota aprobada",
        description: "La flota ha sido aprobada exitosamente",
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

  const handleReject = async (flotaId: string) => {
    setProcessingId(flotaId);
    try {
      const { error } = await supabase.rpc('reject_flota', {
        flota_id: flotaId
      });

      if (error) throw error;

      toast({
        title: "Flota rechazada",
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

  const handleViewDetails = (flota: FlotaSolicitud) => {
    setSelectedFlota(flota);
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
          <Truck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Flotas</h1>
          <p className="text-muted-foreground">Gestión de solicitudes de registro de flotas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Solicitudes</CardTitle>
          <CardDescription>
            Revisa y gestiona las solicitudes de registro de flotas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay solicitudes de flotas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flota</TableHead>
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
                    <TableCell className="font-medium">{solicitud.nombre_flota}</TableCell>
                    <TableCell>
                      {solicitud.nombre_contacto} {solicitud.apellido_contacto}
                    </TableCell>
                    <TableCell>{solicitud.correo_contacto}</TableCell>
                    <TableCell>{solicitud.telefono_contacto}</TableCell>
                    <TableCell>
                      {solicitud.ciudad || "—"}
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
            <DialogTitle>Detalles de la Flota</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud
            </DialogDescription>
          </DialogHeader>
          
          {selectedFlota && (
            <div className="space-y-6">
              {/* Estado */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Estado de la Solicitud</span>
                {getStatusBadge(selectedFlota.status)}
              </div>

              {/* Información de la Flota */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información de la Flota</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre de la Flota</p>
                    <p className="font-medium">{selectedFlota.nombre_flota}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Razón Social</p>
                    <p className="font-medium">{selectedFlota.razon_social || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RTN</p>
                    <p className="font-medium">{selectedFlota.numero_rtn || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rubro</p>
                    <p className="font-medium">{selectedFlota.rubro_empresa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedFlota.telefono_contacto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Correo</p>
                    <p className="font-medium">{selectedFlota.correo_contacto}</p>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información de Contacto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedFlota.nombre_contacto || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Apellido</p>
                    <p className="font-medium">{selectedFlota.apellido_contacto || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Ubicación</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{selectedFlota.direccion_fisica}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ciudad</p>
                      <p className="font-medium">{selectedFlota.ciudad || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Código Postal</p>
                      <p className="font-medium">{selectedFlota.codigo_postal || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fecha de Registro */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información Adicional</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                  <p className="font-medium">
                    {new Date(selectedFlota.created_at).toLocaleString('es-MX', {
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
              {selectedFlota.status === 'pendiente' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500"
                    onClick={() => {
                      handleApprove(selectedFlota.id);
                      setDetailsOpen(false);
                    }}
                    disabled={processingId === selectedFlota.id}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar Flota
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500"
                    onClick={() => {
                      handleReject(selectedFlota.id);
                      setDetailsOpen(false);
                    }}
                    disabled={processingId === selectedFlota.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rechazar Flota
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

export default SolicitudesFlotas;
