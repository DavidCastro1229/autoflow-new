import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, Send, Loader2, Eye, MapPin, Phone, Mail, Check, X, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Taller {
  id: string;
  nombre_taller: string;
  direccion: string;
  ciudad: string;
  estado: string;
  telefono: string;
  email: string;
  descripcion: string | null;
  logo_url: string | null;
}

interface Solicitud {
  id: string;
  flota_id: string;
  taller_id: string;
  status: string;
  mensaje: string | null;
  created_at: string;
  taller?: Taller;
}

const FlotaTaller = () => {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [tipoTaller, setTipoTaller] = useState<string>("externo");
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [mensajeModal, setMensajeModal] = useState(false);
  const [selectedTaller, setSelectedTaller] = useState<Taller | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [detailTaller, setDetailTaller] = useState<Taller | null>(null);

  const fetchData = async () => {
    if (!flotaId) return;
    setLoading(true);
    try {
      // Fetch tipo_taller from flotas
      const { data: flotaData } = await supabase
        .from("flotas")
        .select("tipo_taller")
        .eq("id", flotaId)
        .single();
      
      if (flotaData?.tipo_taller) {
        setTipoTaller(flotaData.tipo_taller);
      }

      // Fetch solicitudes
      const { data: solData, error: solError } = await supabase
        .from("flota_taller_solicitudes")
        .select("*")
        .eq("flota_id", flotaId)
        .order("created_at", { ascending: false });

      if (solError) throw solError;

      // Fetch taller details for each solicitud
      if (solData && solData.length > 0) {
        const tallerIds = solData.map((s: any) => s.taller_id);
        const { data: tallerData } = await supabase
          .from("talleres")
          .select("id, nombre_taller, direccion, ciudad, estado, telefono, email, descripcion, logo_url")
          .in("id", tallerIds);

        const solWithTaller = solData.map((s: any) => ({
          ...s,
          taller: tallerData?.find((t: any) => t.id === s.taller_id),
        }));
        setSolicitudes(solWithTaller);
      } else {
        setSolicitudes([]);
      }

      // Fetch all approved talleres for search
      const { data: allTalleres, error: tallError } = await supabase
        .from("talleres")
        .select("id, nombre_taller, direccion, ciudad, estado, telefono, email, descripcion, logo_url")
        .eq("status", "aprobado");

      if (tallError) throw tallError;
      setTalleres(allTalleres || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [flotaId]);

  const handleUpdateTipoTaller = async (tipo: string) => {
    if (!flotaId) return;
    setTipoTaller(tipo);
    await supabase.from("flotas").update({ tipo_taller: tipo }).eq("id", flotaId);
  };

  const handleSendSolicitud = async () => {
    if (!flotaId || !selectedTaller) return;
    setSending(selectedTaller.id);
    try {
      const { error } = await supabase.from("flota_taller_solicitudes").insert({
        flota_id: flotaId,
        taller_id: selectedTaller.id,
        mensaje: mensaje || null,
        status: "pendiente",
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Ya existe", description: "Ya enviaste una solicitud a este taller", variant: "destructive" });
        } else throw error;
      } else {
        toast({ title: "Solicitud enviada", description: "Tu solicitud ha sido enviada al taller" });
        setMensajeModal(false);
        setMensaje("");
        setSelectedTaller(null);
        await fetchData();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(null);
    }
  };

  const handleCancelSolicitud = async (solId: string) => {
    try {
      const { error } = await supabase.from("flota_taller_solicitudes").delete().eq("id", solId);
      if (error) throw error;
      toast({ title: "Solicitud cancelada" });
      await fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Pendiente</Badge>;
      case "aprobado": return <Badge variant="outline" className="bg-green-500/10 text-green-500">Aprobado</Badge>;
      case "rechazado": return <Badge variant="outline" className="bg-red-500/10 text-red-500">Rechazado</Badge>;
      default: return null;
    }
  };

  const asociados = solicitudes.filter((s) => s.status === "aprobado");
  const pendientes = solicitudes.filter((s) => s.status === "pendiente");
  const solicitudTallerIds = solicitudes.map((s) => s.taller_id);

  const filteredTalleres = talleres.filter(
    (t) =>
      !solicitudTallerIds.includes(t.id) &&
      (t.nombre_taller.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Taller</h1>
          <p className="text-muted-foreground">Gestión de relación con talleres</p>
        </div>
      </div>

      {/* Selector tipo taller */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Taller</CardTitle>
          <CardDescription>Selecciona si tu flota cuenta con taller propio o utiliza talleres externos</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={tipoTaller} onValueChange={handleUpdateTipoTaller}>
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interno">Taller Interno (propio fuera del sistema)</SelectItem>
              <SelectItem value="externo">Taller Externo (talleres del sistema)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {tipoTaller === "interno" ? (
        <Card>
          <CardHeader>
            <CardTitle>Taller Interno</CardTitle>
            <CardDescription>Tu flota cuenta con un taller propio fuera del sistema AutoFlowX</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Al seleccionar taller interno, tu flota gestiona su propio taller de manera independiente.
              Los servicios de mantenimiento y reparación son manejados internamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="mi-taller" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mi-taller">Mi Taller ({asociados.length})</TabsTrigger>
            <TabsTrigger value="solicitar">Solicitar Asociarse</TabsTrigger>
          </TabsList>

          {/* Tab Mi Taller */}
          <TabsContent value="mi-taller" className="space-y-4">
            {asociados.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">No tienes talleres asociados aún</p>
                  <p className="text-sm text-muted-foreground mt-2">Ve a la pestaña "Solicitar Asociarse" para enviar solicitudes a talleres</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {asociados.map((sol) => (
                  <Card key={sol.id}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      {sol.taller?.logo_url ? (
                        <img src={sol.taller.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{sol.taller?.nombre_taller}</CardTitle>
                        <CardDescription>{sol.taller?.ciudad}, {sol.taller?.estado}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{sol.taller?.direccion}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{sol.taller?.telefono}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{sol.taller?.email}</span>
                      </div>
                      {sol.taller?.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2">{sol.taller.descripcion}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Solicitudes pendientes */}
            {pendientes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Solicitudes Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Taller</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendientes.map((sol) => (
                        <TableRow key={sol.id}>
                          <TableCell className="font-medium">{sol.taller?.nombre_taller}</TableCell>
                          <TableCell>{new Date(sol.created_at).toLocaleDateString("es-MX")}</TableCell>
                          <TableCell>{getStatusBadge(sol.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleCancelSolicitud(sol.id)}>
                              <X className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Solicitar Asociarse */}
          <TabsContent value="solicitar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Talleres</CardTitle>
                <CardDescription>Busca talleres disponibles y envía una solicitud de asociación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o ciudad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {filteredTalleres.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No se encontraron talleres disponibles</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTalleres.map((taller) => (
                      <Card key={taller.id} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            {taller.logo_url ? (
                              <img src={taller.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-base">{taller.nombre_taller}</CardTitle>
                              <CardDescription className="text-xs">{taller.ciudad}, {taller.estado}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">{taller.descripcion || "Sin descripción"}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setDetailTaller(taller)}>
                              <Eye className="h-4 w-4 mr-1" /> Ver
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => { setSelectedTaller(taller); setMensajeModal(true); }}
                            >
                              <Send className="h-4 w-4 mr-1" /> Solicitar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal enviar solicitud */}
      <Dialog open={mensajeModal} onOpenChange={setMensajeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Asociación</DialogTitle>
            <DialogDescription>Envía una solicitud a {selectedTaller?.nombre_taller}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mensaje (opcional)</label>
              <Textarea
                placeholder="Escribe un mensaje para el taller..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setMensajeModal(false)}>Cancelar</Button>
              <Button onClick={handleSendSolicitud} disabled={sending === selectedTaller?.id}>
                {sending === selectedTaller?.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Enviar Solicitud
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal detalle taller */}
      <Dialog open={!!detailTaller} onOpenChange={() => setDetailTaller(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Taller</DialogTitle>
          </DialogHeader>
          {detailTaller && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {detailTaller.logo_url ? (
                  <img src={detailTaller.logo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{detailTaller.nombre_taller}</h3>
                  <p className="text-sm text-muted-foreground">{detailTaller.ciudad}, {detailTaller.estado}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{detailTaller.direccion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{detailTaller.telefono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{detailTaller.email}</span>
                </div>
              </div>
              {detailTaller.descripcion && (
                <div>
                  <p className="text-sm font-medium mb-1">Descripción</p>
                  <p className="text-sm text-muted-foreground">{detailTaller.descripcion}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlotaTaller;
