import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, Check, X, Loader2, Eye, MapPin, Phone, Mail, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Flota {
  id: string;
  nombre_flota: string;
  razon_social: string;
  numero_rtn: string;
  correo_contacto: string;
  telefono_contacto: string;
  direccion_fisica: string;
  ciudad: string | null;
  nombre_contacto: string | null;
  apellido_contacto: string | null;
  rubro_empresa: string;
  logo_url: string | null;
  numero_flota: string;
}

interface Solicitud {
  id: string;
  flota_id: string;
  taller_id: string;
  status: string;
  mensaje: string | null;
  created_at: string;
  flota?: Flota;
}

const TallerFlotas = () => {
  const { tallerId } = useUserRole();
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [detailFlota, setDetailFlota] = useState<Flota | null>(null);

  const fetchSolicitudes = async () => {
    if (!tallerId) return;
    setLoading(true);
    try {
      const { data: solData, error } = await supabase
        .from("flota_taller_solicitudes")
        .select("*")
        .eq("taller_id", tallerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (solData && solData.length > 0) {
        const flotaIds = solData.map((s: any) => s.flota_id);
        const { data: flotaData } = await supabase
          .from("flotas")
          .select("id, nombre_flota, razon_social, numero_rtn, correo_contacto, telefono_contacto, direccion_fisica, ciudad, nombre_contacto, apellido_contacto, rubro_empresa, logo_url, numero_flota")
          .in("id", flotaIds);

        const solWithFlota = solData.map((s: any) => ({
          ...s,
          flota: flotaData?.find((f: any) => f.id === s.flota_id),
        }));
        setSolicitudes(solWithFlota);
      } else {
        setSolicitudes([]);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, [tallerId]);

  const handleApprove = async (solId: string) => {
    setProcessingId(solId);
    try {
      const { error } = await supabase
        .from("flota_taller_solicitudes")
        .update({ status: "aprobado", fecha_respuesta: new Date().toISOString() })
        .eq("id", solId);

      if (error) throw error;
      toast({ title: "Solicitud aprobada", description: "La flota ha sido asociada exitosamente" });
      await fetchSolicitudes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (solId: string) => {
    setProcessingId(solId);
    try {
      const { error } = await supabase
        .from("flota_taller_solicitudes")
        .update({ status: "rechazado", fecha_respuesta: new Date().toISOString() })
        .eq("id", solId);

      if (error) throw error;
      toast({ title: "Solicitud rechazada" });
      await fetchSolicitudes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Pendiente</Badge>;
      case "aprobado": return <Badge variant="outline" className="bg-green-500/10 text-green-500">Asociado</Badge>;
      case "rechazado": return <Badge variant="outline" className="bg-red-500/10 text-red-500">Rechazado</Badge>;
      default: return null;
    }
  };

  const asociados = solicitudes.filter((s) => s.status === "aprobado");
  const pendientes = solicitudes.filter((s) => s.status === "pendiente");

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
          <h1 className="text-3xl font-bold">Flotas</h1>
          <p className="text-muted-foreground">Gestión de flotas asociadas y solicitudes</p>
        </div>
      </div>

      <Tabs defaultValue="asociadas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="asociadas">Flotas Asociadas ({asociados.length})</TabsTrigger>
          <TabsTrigger value="solicitudes">
            Solicitudes
            {pendientes.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendientes.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Flotas Asociadas */}
        <TabsContent value="asociadas">
          <Card>
            <CardHeader>
              <CardTitle>Flotas Asociadas</CardTitle>
              <CardDescription>Lista de flotas que trabajan con tu taller</CardDescription>
            </CardHeader>
            <CardContent>
              {asociados.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tienes flotas asociadas aún</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flota</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Rubro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asociados.map((sol) => (
                      <TableRow key={sol.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {sol.flota?.logo_url ? (
                              <img src={sol.flota.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                <Truck className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            {sol.flota?.nombre_flota}
                          </div>
                        </TableCell>
                        <TableCell>{sol.flota?.nombre_contacto} {sol.flota?.apellido_contacto}</TableCell>
                        <TableCell>{sol.flota?.telefono_contacto}</TableCell>
                        <TableCell>{sol.flota?.ciudad || "—"}</TableCell>
                        <TableCell>{sol.flota?.rubro_empresa}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => sol.flota && setDetailFlota(sol.flota)}>
                            <Eye className="h-4 w-4 mr-1" /> Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Solicitudes */}
        <TabsContent value="solicitudes">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Asociación</CardTitle>
              <CardDescription>Revisa y gestiona las solicitudes de flotas</CardDescription>
            </CardHeader>
            <CardContent>
              {solicitudes.filter(s => s.status !== "aprobado").length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay solicitudes</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flota</TableHead>
                      <TableHead>Mensaje</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {solicitudes.filter(s => s.status !== "aprobado").map((sol) => (
                      <TableRow key={sol.id}>
                        <TableCell className="font-medium">{sol.flota?.nombre_flota}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{sol.mensaje || "—"}</TableCell>
                        <TableCell>{new Date(sol.created_at).toLocaleDateString("es-MX")}</TableCell>
                        <TableCell>{getStatusBadge(sol.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => sol.flota && setDetailFlota(sol.flota)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {sol.status === "pendiente" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-500/10 hover:bg-green-500/20 text-green-500"
                                  onClick={() => handleApprove(sol.id)}
                                  disabled={processingId === sol.id}
                                >
                                  {processingId === sol.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Aprobar</>}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                                  onClick={() => handleReject(sol.id)}
                                  disabled={processingId === sol.id}
                                >
                                  {processingId === sol.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" /> Rechazar</>}
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
        </TabsContent>
      </Tabs>

      {/* Modal detalle flota */}
      <Dialog open={!!detailFlota} onOpenChange={() => setDetailFlota(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de la Flota</DialogTitle>
          </DialogHeader>
          {detailFlota && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {detailFlota.logo_url ? (
                  <img src={detailFlota.logo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{detailFlota.nombre_flota}</h3>
                  <p className="text-sm text-muted-foreground">{detailFlota.numero_flota}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Razón Social</p>
                  <p className="font-medium">{detailFlota.razon_social}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RTN</p>
                  <p className="font-medium">{detailFlota.numero_rtn}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rubro</p>
                  <p className="font-medium">{detailFlota.rubro_empresa}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ciudad</p>
                  <p className="font-medium">{detailFlota.ciudad || "—"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{detailFlota.direccion_fisica}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{detailFlota.telefono_contacto}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{detailFlota.correo_contacto}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contacto</p>
                  <p className="font-medium">{detailFlota.nombre_contacto} {detailFlota.apellido_contacto}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TallerFlotas;
