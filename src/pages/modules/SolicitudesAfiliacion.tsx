import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Taller {
  id: string;
  nombre_taller: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  descripcion: string | null;
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

export default function SolicitudesAfiliacion() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"aprobar" | "rechazar">("aprobar");
  const [loading, setLoading] = useState(true);
  const [aseguradoraId, setAseguradoraId] = useState<string | null>(null);

  useEffect(() => {
    fetchAseguradoraId();
  }, []);

  useEffect(() => {
    if (aseguradoraId) {
      fetchSolicitudes();
      setupRealtimeSubscription();
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

  const fetchSolicitudes = async () => {
    if (!aseguradoraId) return;

    try {
      const { data, error } = await supabase
        .from("solicitudes_afiliacion")
        .select(`
          *,
          talleres (*)
        `)
        .eq("aseguradora_id", aseguradoraId)
        .order("fecha_solicitud", { ascending: false });

      if (error) throw error;
      setSolicitudes(data as any || []);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!aseguradoraId) return;

    const channel = supabase
      .channel("solicitudes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solicitudes_afiliacion",
          filter: `aseguradora_id=eq.${aseguradoraId}`,
        },
        () => {
          fetchSolicitudes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAction = async () => {
    if (!selectedSolicitud) return;

    try {
      const updateData: any = {
        estado: actionType === "aprobar" ? "aprobada" : "rechazada",
        respuesta: respuesta || null,
        fecha_respuesta: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("solicitudes_afiliacion")
        .update(updateData)
        .eq("id", selectedSolicitud.id);

      if (updateError) throw updateError;

      // Si se aprueba, crear la relación en taller_aseguradoras
      if (actionType === "aprobar") {
        const { error: relationError } = await supabase
          .from("taller_aseguradoras")
          .insert({
            taller_id: selectedSolicitud.taller_id,
            aseguradora_id: aseguradoraId,
          });

        if (relationError && relationError.code !== "23505") {
          throw relationError;
        }
      }

      toast.success(
        actionType === "aprobar" 
          ? "Solicitud aprobada exitosamente" 
          : "Solicitud rechazada"
      );
      
      setIsDialogOpen(false);
      setRespuesta("");
      setSelectedSolicitud(null);
      fetchSolicitudes();
    } catch (error) {
      console.error("Error handling solicitud:", error);
      toast.error("Error al procesar la solicitud");
    }
  };

  const openDialog = (solicitud: Solicitud, type: "aprobar" | "rechazar") => {
    setSelectedSolicitud(solicitud);
    setActionType(type);
    setRespuesta("");
    setIsDialogOpen(true);
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

  const solicitudesPendientes = solicitudes.filter(s => s.estado === "pendiente");
  const solicitudesRespondidas = solicitudes.filter(s => s.estado !== "pendiente");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitudes de Afiliación</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de talleres que desean afiliarse
        </p>
      </div>

      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pendientes">
            Pendientes
            {solicitudesPendientes.length > 0 && (
              <Badge className="ml-2" variant="destructive">{solicitudesPendientes.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          {solicitudesPendientes.map((solicitud) => (
            <Card key={solicitud.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">
                        {solicitud.talleres?.nombre_taller || "Taller no disponible"}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Solicitud recibida el {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(solicitud.estado)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Ubicación</p>
                    <p className="text-muted-foreground">
                      📍 {solicitud.talleres?.ciudad || "N/A"}, {solicitud.talleres?.estado || "N/A"}
                    </p>
                    <p className="text-muted-foreground">
                      {solicitud.talleres?.direccion || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Contacto</p>
                    <p className="text-muted-foreground">
                      📧 {solicitud.talleres?.email || "N/A"}
                    </p>
                    <p className="text-muted-foreground">
                      📞 {solicitud.talleres?.telefono || "N/A"}
                    </p>
                  </div>
                </div>
                {solicitud.talleres?.descripcion && (
                  <div>
                    <p className="font-medium mb-1">Descripción del taller</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {solicitud.talleres.descripcion}
                    </p>
                  </div>
                )}
                {solicitud.mensaje && (
                  <div>
                    <p className="font-medium mb-1">Mensaje del taller</p>
                    <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      {solicitud.mensaje}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => openDialog(solicitud, "aprobar")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprobar
                  </Button>
                  <Button
                    onClick={() => openDialog(solicitud, "rechazar")}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {solicitudesPendientes.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No hay solicitudes pendientes
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          {solicitudesRespondidas.map((solicitud) => (
            <Card key={solicitud.id} className="opacity-90">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">
                        {solicitud.talleres?.nombre_taller || "Taller no disponible"}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Respondida el {solicitud.fecha_respuesta ? new Date(solicitud.fecha_respuesta).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(solicitud.estado)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <p className="text-muted-foreground">📍 {solicitud.talleres?.ciudad || "N/A"}, {solicitud.talleres?.estado || "N/A"}</p>
                  <p className="text-muted-foreground">📧 {solicitud.talleres?.email || "N/A"}</p>
                </div>
                {solicitud.mensaje && (
                  <div>
                    <p className="text-sm font-medium mb-1">Mensaje del taller:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {solicitud.mensaje}
                    </p>
                  </div>
                )}
                {solicitud.respuesta && (
                  <div>
                    <p className="text-sm font-medium mb-1">Tu respuesta:</p>
                    <p className={`text-sm text-muted-foreground p-3 rounded-md border ${
                      solicitud.estado === "aprobada" 
                        ? "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                    }`}>
                      {solicitud.respuesta}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {solicitudesRespondidas.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No hay solicitudes respondidas aún
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "aprobar" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "aprobar" 
                ? `¿Estás seguro de aprobar la solicitud de ${selectedSolicitud?.talleres.nombre_taller}?`
                : `¿Estás seguro de rechazar la solicitud de ${selectedSolicitud?.talleres.nombre_taller}?`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Mensaje {actionType === "rechazar" ? "(requerido)" : "(opcional)"}
              </label>
              <Textarea
                placeholder={
                  actionType === "aprobar" 
                    ? "Escribe un mensaje de bienvenida (opcional)..."
                    : "Explica el motivo del rechazo..."
                }
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              className={actionType === "aprobar" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionType === "rechazar" ? "destructive" : "default"}
              disabled={actionType === "rechazar" && !respuesta.trim()}
            >
              {actionType === "aprobar" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprobar
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}