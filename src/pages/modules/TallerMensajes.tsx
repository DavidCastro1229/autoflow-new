import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Send, Phone, Mail, MessageCircle, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Aseguradora {
  id: string;
  nombre_aseguradora: string;
  email: string;
  telefono: string;
}

interface Mensaje {
  id: string;
  aseguradora_id: string;
  taller_id: string;
  contenido: string;
  sender_type: "aseguradora" | "taller";
  created_at: string;
  leido: boolean;
}

const TallerMensajes = () => {
  const { toast } = useToast();
  const { tallerId } = useUserRole();
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [selectedAseguradora, setSelectedAseguradora] = useState<string>("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch aseguradoras afiliadas
  useEffect(() => {
    if (tallerId) {
      fetchAseguradoras();
    }
  }, [tallerId]);

  const fetchAseguradoras = async () => {
    if (!tallerId) return;

    const { data, error } = await supabase
      .from("taller_aseguradoras")
      .select(`
        aseguradora_id,
        aseguradoras (
          id,
          nombre_aseguradora,
          email,
          telefono
        )
      `)
      .eq("taller_id", tallerId);

    if (error) {
      console.error("Error fetching aseguradoras:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las aseguradoras",
        variant: "destructive",
      });
    } else {
      const aseguradorasFormateadas = data
        .filter((item) => item.aseguradoras)
        .map((item) => item.aseguradoras as unknown as Aseguradora);
      setAseguradoras(aseguradorasFormateadas);
    }
    setLoading(false);
  };

  // Fetch messages when aseguradora is selected
  useEffect(() => {
    if (selectedAseguradora && tallerId) {
      fetchMensajes();
      subscribeToMessages();
    }
  }, [selectedAseguradora, tallerId]);

  const fetchMensajes = async () => {
    if (!selectedAseguradora || !tallerId) return;

    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("mensajes")
      .select("*")
      .eq("aseguradora_id", selectedAseguradora)
      .eq("taller_id", tallerId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    } else {
      setMensajes(data as Mensaje[] || []);
      markMessagesAsRead();
    }
    setLoadingMessages(false);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("mensajes-taller-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `taller_id=eq.${tallerId}`,
        },
        (payload) => {
          const newMessage = payload.new as Mensaje;
          if (newMessage.aseguradora_id === selectedAseguradora) {
            setMensajes((prev) => [...prev, newMessage]);
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!selectedAseguradora || !tallerId) return;

    await supabase
      .from("mensajes")
      .update({ leido: true })
      .eq("aseguradora_id", selectedAseguradora)
      .eq("taller_id", tallerId)
      .eq("sender_type", "aseguradora")
      .eq("leido", false);
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !selectedAseguradora || !tallerId) return;

    const { error } = await supabase.from("mensajes").insert({
      aseguradora_id: selectedAseguradora,
      taller_id: tallerId,
      sender_type: "taller",
      contenido: nuevoMensaje,
      leido: false,
    });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } else {
      setNuevoMensaje("");
    }
  };

  const abrirWhatsApp = () => {
    const aseguradora = aseguradoras.find((a) => a.id === selectedAseguradora);
    if (aseguradora?.telefono) {
      window.open(`https://wa.me/${aseguradora.telefono.replace(/\D/g, "")}`, "_blank");
    }
  };

  const abrirCorreo = () => {
    const aseguradora = aseguradoras.find((a) => a.id === selectedAseguradora);
    if (aseguradora?.email) {
      window.open(`mailto:${aseguradora.email}`, "_blank");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando aseguradoras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mensajes</h1>
        <p className="text-muted-foreground">
          Comunícate con tus aseguradoras afiliadas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar con lista de aseguradoras */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Aseguradoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {aseguradoras.map((aseguradora) => (
                  <Button
                    key={aseguradora.id}
                    variant={selectedAseguradora === aseguradora.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedAseguradora(aseguradora.id)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>
                        {aseguradora.nombre_aseguradora.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{aseguradora.nombre_aseguradora}</p>
                      <p className="text-xs text-muted-foreground">{aseguradora.email}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat principal */}
        <Card className="lg:col-span-2">
          {selectedAseguradora ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {aseguradoras
                          .find((a) => a.id === selectedAseguradora)
                          ?.nombre_aseguradora.substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>
                        {aseguradoras.find((a) => a.id === selectedAseguradora)?.nombre_aseguradora}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {aseguradoras.find((a) => a.id === selectedAseguradora)?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={abrirWhatsApp}
                      title="Abrir WhatsApp"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={abrirCorreo}
                      title="Enviar correo"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[450px] p-4" ref={scrollRef}>
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Cargando mensajes...</p>
                    </div>
                  ) : mensajes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No hay mensajes aún. ¡Inicia la conversación!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mensajes.map((mensaje) => (
                        <div
                          key={mensaje.id}
                          className={`flex ${
                            mensaje.sender_type === "taller"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              mensaje.sender_type === "taller"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{mensaje.contenido}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(mensaje.created_at).toLocaleTimeString("es", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          enviarMensaje();
                        }
                      }}
                    />
                    <Button onClick={enviarMensaje} disabled={!nuevoMensaje.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Selecciona una aseguradora para comenzar a chatear
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TallerMensajes;
