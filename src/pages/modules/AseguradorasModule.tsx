import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Send, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { toast } from "sonner";

interface Aseguradora {
  id: string;
  nombre_aseguradora: string;
  rfc: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  descripcion: string | null;
}

interface Solicitud {
  id: string;
  aseguradora_id: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  mensaje: string | null;
  respuesta: string | null;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
  aseguradoras: Aseguradora;
}

export default function AseguradorasModule() {
  const { tallerId } = useUserRole();
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAseguradora, setSelectedAseguradora] = useState<Aseguradora | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tallerId) {
      fetchAseguradoras();
      fetchSolicitudes();
    }
  }, [tallerId]);

  const fetchAseguradoras = async () => {
    try {
      const { data, error } = await supabase
        .from("aseguradoras")
        .select("*")
        .order("nombre_aseguradora");

      if (error) throw error;
      setAseguradoras(data || []);
    } catch (error) {
      console.error("Error fetching aseguradoras:", error);
      toast.error("Error al cargar aseguradoras");
    } finally {
      setLoading(false);
    }
  };

  const fetchSolicitudes = async () => {
    if (!tallerId) return;

    try {
      const { data, error } = await supabase
        .from("solicitudes_afiliacion")
        .select(`
          *,
          aseguradoras (*)
        `)
        .eq("taller_id", tallerId);

      if (error) throw error;
      setSolicitudes(data as any || []);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
    }
  };

  const handleSendSolicitud = async () => {
    if (!selectedAseguradora || !tallerId) return;

    try {
      const { error } = await supabase
        .from("solicitudes_afiliacion")
        .insert({
          taller_id: tallerId,
          aseguradora_id: selectedAseguradora.id,
          mensaje: mensaje || null,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ya existe una solicitud para esta aseguradora");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Solicitud enviada exitosamente");
      setIsDialogOpen(false);
      setMensaje("");
      setSelectedAseguradora(null);
      fetchSolicitudes();
    } catch (error) {
      console.error("Error sending solicitud:", error);
      toast.error("Error al enviar solicitud");
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "aprobada":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case "rechazada":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return null;
    }
  };

  const filteredAseguradoras = aseguradoras.filter(aseg =>
    aseg.nombre_aseguradora.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aseg.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aseg.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const solicitudesActivas = solicitudes.filter(s => s.estado === "pendiente" || s.estado === "aprobada");
  const solicitudesHistorial = solicitudes.filter(s => s.estado === "rechazada");

  const isSolicitudExistente = (aseguradoraId: string) => {
    return solicitudes.some(s => s.aseguradora_id === aseguradoraId && s.estado !== "rechazada");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando aseguradoras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aseguradoras</h1>
        <p className="text-muted-foreground">
          Envía solicitudes de afiliación a aseguradoras
        </p>
      </div>

      <Tabs defaultValue="disponibles" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="disponibles">Disponibles</TabsTrigger>
          <TabsTrigger value="solicitudes">
            Mis Solicitudes
            {solicitudesActivas.length > 0 && (
              <Badge className="ml-2" variant="secondary">{solicitudesActivas.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disponibles" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aseguradoras por nombre, ciudad o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAseguradoras.map((aseguradora) => {
              const solicitudExistente = isSolicitudExistente(aseguradora.id);
              return (
                <Card key={aseguradora.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Building2 className="h-8 w-8 text-primary mb-2" />
                      {solicitudExistente && (
                        <Badge variant="secondary">Solicitud Enviada</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{aseguradora.nombre_aseguradora}</CardTitle>
                    <CardDescription>RFC: {aseguradora.rfc}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">📍 {aseguradora.ciudad}, {aseguradora.estado}</p>
                      <p className="text-muted-foreground">📧 {aseguradora.email}</p>
                      <p className="text-muted-foreground">📞 {aseguradora.telefono}</p>
                    </div>
                    {aseguradora.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {aseguradora.descripcion}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => {
                        setSelectedAseguradora(aseguradora);
                        setIsDialogOpen(true);
                      }}
                      className="w-full"
                      disabled={solicitudExistente}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {solicitudExistente ? "Solicitud Enviada" : "Enviar Solicitud"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {filteredAseguradoras.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchTerm ? "No se encontraron aseguradoras" : "No hay aseguradoras disponibles"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="solicitudes" className="space-y-4">
          <div className="space-y-4">
            {solicitudesActivas.map((solicitud) => (
              <Card key={solicitud.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {solicitud.aseguradoras.nombre_aseguradora}
                      </CardTitle>
                      <CardDescription>
                        Enviada el {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    {getEstadoBadge(solicitud.estado)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {solicitud.mensaje && (
                    <div>
                      <p className="text-sm font-medium mb-1">Tu mensaje:</p>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {solicitud.mensaje}
                      </p>
                    </div>
                  )}
                  {solicitud.respuesta && (
                    <div>
                      <p className="text-sm font-medium mb-1">Respuesta de la aseguradora:</p>
                      <p className="text-sm text-muted-foreground bg-green-50 p-3 rounded-md border border-green-200">
                        {solicitud.respuesta}
                      </p>
                      {solicitud.fecha_respuesta && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Respondida el {new Date(solicitud.fecha_respuesta).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="text-muted-foreground">📧 {solicitud.aseguradoras.email}</p>
                    <p className="text-muted-foreground">📞 {solicitud.aseguradoras.telefono}</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {solicitudesHistorial.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-8">Historial</h3>
                {solicitudesHistorial.map((solicitud) => (
                  <Card key={solicitud.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">
                            {solicitud.aseguradoras.nombre_aseguradora}
                          </CardTitle>
                          <CardDescription>
                            Enviada el {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-MX')}
                          </CardDescription>
                        </div>
                        {getEstadoBadge(solicitud.estado)}
                      </div>
                    </CardHeader>
                    {solicitud.respuesta && (
                      <CardContent>
                        <p className="text-sm font-medium mb-1">Motivo del rechazo:</p>
                        <p className="text-sm text-muted-foreground bg-red-50 p-3 rounded-md border border-red-200">
                          {solicitud.respuesta}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </>
            )}

            {solicitudes.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Send className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No has enviado ninguna solicitud aún
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Ve a la pestaña "Disponibles" para enviar solicitudes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitud de Afiliación</DialogTitle>
            <DialogDescription>
              Envía una solicitud de afiliación a {selectedAseguradora?.nombre_aseguradora}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mensaje (opcional)</label>
              <Textarea
                placeholder="Escribe un mensaje para acompañar tu solicitud..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendSolicitud}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}