import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Send, CheckCircle2, XCircle, Clock, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import ConvenioFormModal, { ConvenioData } from "@/components/aseguradoras/ConvenioFormModal";
import ConvenioViewModal from "@/components/aseguradoras/ConvenioViewModal";

interface Taller {
  id: string;
  nombre_taller: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  descripcion: string | null;
  logo_url: string | null;
}

interface Solicitud {
  id: string;
  taller_id: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  mensaje: string | null;
  respuesta: string | null;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
  talleres: Taller;
}

export default function AseguradorasModule() {
  const [talleres, setTalleres] = useState<Taller[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaller, setSelectedTaller] = useState<Taller | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConvenioViewOpen, setIsConvenioViewOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aseguradoraId, setAseguradoraId] = useState<string | null>(null);

  useEffect(() => {
    fetchAseguradoraId();
  }, []);

  useEffect(() => {
    if (aseguradoraId) {
      fetchTalleres();
      fetchSolicitudes();
    }
  }, [aseguradoraId]);

  const fetchAseguradoraId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("aseguradoras")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setAseguradoraId(data.id);
    } catch (error) {
      console.error("Error fetching aseguradora:", error);
    }
  };

  const fetchTalleres = async () => {
    try {
      // Obtener todos los talleres aprobados
      const { data, error } = await supabase
        .from("talleres")
        .select("*")
        .eq("status", "aprobado")
        .order("nombre_taller");

      if (error) throw error;
      setTalleres(data || []);
    } catch (error) {
      console.error("Error fetching talleres:", error);
      toast.error("Error al cargar talleres");
    } finally {
      setLoading(false);
    }
  };

  const fetchSolicitudes = async () => {
    if (!aseguradoraId) return;

    try {
      const { data, error } = await supabase
        .from("solicitudes_afiliacion")
        .select(`
          *,
          talleres (*)
        `)
        .eq("aseguradora_id", aseguradoraId);

      if (error) throw error;
      setSolicitudes(data as any || []);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
    }
  };

  const handleSendSolicitud = async (convenio: ConvenioData) => {
    if (!selectedTaller || !aseguradoraId) return;

    setSending(true);
    try {
      // 1. Crear la solicitud
      const { data: solicitudData, error: solicitudError } = await supabase
        .from("solicitudes_afiliacion")
        .insert({
          taller_id: selectedTaller.id,
          aseguradora_id: aseguradoraId,
          mensaje: mensaje || null,
        })
        .select()
        .single();

      if (solicitudError) {
        if (solicitudError.code === "23505") {
          toast.error("Ya existe una solicitud para este taller");
        } else {
          throw solicitudError;
        }
        return;
      }

      // 2. Crear el convenio asociado con la firma
      const { error: convenioError } = await supabase
        .from("convenios_afiliacion")
        .insert({
          solicitud_id: solicitudData.id,
          ...convenio,
          fecha_firma_aseguradora: new Date().toISOString(),
        });

      if (convenioError) throw convenioError;

      toast.success("Solicitud enviada exitosamente");
      setIsDialogOpen(false);
      setMensaje("");
      setSelectedTaller(null);
      fetchSolicitudes();
    } catch (error) {
      console.error("Error sending solicitud:", error);
      toast.error("Error al enviar solicitud");
    } finally {
      setSending(false);
    }
  };

  const handleViewConvenio = (solicitudId: string) => {
    setSelectedSolicitudId(solicitudId);
    setIsConvenioViewOpen(true);
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

  const filteredTalleres = talleres.filter(taller =>
    taller.nombre_taller.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taller.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    taller.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const solicitudesActivas = solicitudes.filter(s => s.estado === "pendiente" || s.estado === "aprobada");
  const solicitudesHistorial = solicitudes.filter(s => s.estado === "rechazada");

  const isSolicitudExistente = (tallerId: string) => {
    return solicitudes.some(s => s.taller_id === tallerId && s.estado !== "rechazada");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando talleres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talleres</h1>
        <p className="text-muted-foreground">
          Envía solicitudes de afiliación a talleres para trabajar con ellos
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
                placeholder="Buscar talleres por nombre, ciudad o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTalleres.map((taller) => {
              const solicitudExistente = isSolicitudExistente(taller.id);
              return (
                <Card key={taller.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Building2 className="h-8 w-8 text-primary mb-2" />
                      {solicitudExistente && (
                        <Badge variant="secondary">Solicitud Enviada</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{taller.nombre_taller}</CardTitle>
                    <CardDescription>
                      📍 {taller.ciudad}, {taller.estado}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">{taller.direccion}</p>
                      <p className="text-muted-foreground">📧 {taller.email}</p>
                      <p className="text-muted-foreground">📞 {taller.telefono}</p>
                    </div>
                    {taller.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {taller.descripcion}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => {
                        setSelectedTaller(taller);
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

          {filteredTalleres.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchTerm ? "No se encontraron talleres" : "No hay talleres disponibles"}
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
                        {solicitud.talleres.nombre_taller}
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
                      <p className="text-sm font-medium mb-1">Respuesta del taller:</p>
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
                    <p className="text-muted-foreground">📍 {solicitud.talleres.ciudad}, {solicitud.talleres.estado}</p>
                    <p className="text-muted-foreground">📧 {solicitud.talleres.email}</p>
                    <p className="text-muted-foreground">📞 {solicitud.talleres.telefono}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewConvenio(solicitud.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Convenio
                  </Button>
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
                            {solicitud.talleres.nombre_taller}
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

      {selectedTaller && (
        <ConvenioFormModal
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          tallerNombre={selectedTaller.nombre_taller}
          mensaje={mensaje}
          onMensajeChange={setMensaje}
          onSubmit={handleSendSolicitud}
          isLoading={sending}
        />
      )}

      <ConvenioViewModal
        open={isConvenioViewOpen}
        onOpenChange={setIsConvenioViewOpen}
        solicitudId={selectedSolicitudId}
      />
    </div>
  );
}
