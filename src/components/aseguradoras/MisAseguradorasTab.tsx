import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone, MessageCircle, MapPin, Globe, User, Loader2, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AseguradoraAfiliada {
  id: string;
  nombre_aseguradora: string;
  rfc: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  nombre_contacto: string;
  apellido_contacto: string;
  descripcion: string | null;
}

interface ContactoAseguradora {
  id: string;
  aseguradora_id: string;
  tipo_contacto: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  notificar_email: boolean;
  notificar_whatsapp: boolean;
  notificar_app: boolean;
  incluir_cliente_final: boolean;
}

const tipoContactoLabels: Record<string, { label: string; icon: string }> = {
  gerente_pais: { label: "Gerente País", icon: "🌎" },
  gerente_regional: { label: "Gerente Regional", icon: "📍" },
  reclamos: { label: "Reclamos", icon: "📋" },
  ajustadores: { label: "Ajustadores", icon: "🔧" },
  corredores: { label: "Corredores", icon: "🤝" },
};

export default function MisAseguradorasTab() {
  const { tallerId } = useUserRole();
  const [aseguradoras, setAseguradoras] = useState<AseguradoraAfiliada[]>([]);
  const [contactos, setContactos] = useState<Record<string, ContactoAseguradora[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tallerId) fetchAseguradoras();
  }, [tallerId]);

  const fetchAseguradoras = async () => {
    if (!tallerId) return;
    try {
      const { data, error } = await supabase
        .from("taller_aseguradoras")
        .select(`
          aseguradora_id,
          aseguradoras (*)
        `)
        .eq("taller_id", tallerId);

      if (error) throw error;

      const aseguradorasList = (data || [])
        .filter((item: any) => item.aseguradoras)
        .map((item: any) => item.aseguradoras as AseguradoraAfiliada);

      setAseguradoras(aseguradorasList);

      // Fetch contacts for all affiliated insurers
      if (aseguradorasList.length > 0) {
        const ids = aseguradorasList.map((a) => a.id);
        const { data: contactosData, error: contactosError } = await supabase
          .from("aseguradora_contactos")
          .select("*")
          .in("aseguradora_id", ids)
          .order("created_at", { ascending: true });

        if (!contactosError && contactosData) {
          const grouped: Record<string, ContactoAseguradora[]> = {};
          contactosData.forEach((c: any) => {
            if (!grouped[c.aseguradora_id]) grouped[c.aseguradora_id] = [];
            grouped[c.aseguradora_id].push(c);
          });
          setContactos(grouped);
        }
      }
    } catch (error) {
      console.error("Error fetching aseguradoras:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (aseguradoras.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-14 w-14 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No tienes aseguradoras afiliadas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Acepta solicitudes de afiliación para ver tus aseguradoras aquí
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {aseguradoras.map((aseguradora) => {
        const asegContactos = contactos[aseguradora.id] || [];
        const contactosByTipo = asegContactos.reduce((acc, c) => {
          if (!acc[c.tipo_contacto]) acc[c.tipo_contacto] = [];
          acc[c.tipo_contacto].push(c);
          return acc;
        }, {} as Record<string, ContactoAseguradora[]>);

        return (
          <Card key={aseguradora.id} className="overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{aseguradora.nombre_aseguradora}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">RFC: {aseguradora.rfc}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">Afiliada</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem icon={<User className="h-4 w-4" />} label="Contacto Principal" value={`${aseguradora.nombre_contacto} ${aseguradora.apellido_contacto}`} />
                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={aseguradora.email} />
                <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono" value={aseguradora.telefono} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Dirección" value={aseguradora.direccion} />
                <InfoItem icon={<Globe className="h-4 w-4" />} label="Ubicación" value={`${aseguradora.ciudad}, ${aseguradora.estado}`} />
                <InfoItem icon={<MapPin className="h-4 w-4" />} label="Código Postal" value={aseguradora.codigo_postal} />
              </div>

              {aseguradora.descripcion && (
                <div className="bg-muted/40 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Descripción</p>
                  <p className="text-sm text-muted-foreground">{aseguradora.descripcion}</p>
                </div>
              )}

              {/* Contactos */}
              {asegContactos.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Contactos</h3>
                      <Badge variant="secondary">{asegContactos.length}</Badge>
                    </div>

                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(contactosByTipo).map(([tipo, contactosList]) => {
                        const tipoInfo = tipoContactoLabels[tipo] || { label: tipo, icon: "👤" };
                        return (
                          <AccordionItem key={tipo} value={tipo} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{tipoInfo.icon}</span>
                                <span className="font-medium">{tipoInfo.label}</span>
                                <Badge variant="outline" className="text-xs">{contactosList.length}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-3">
                              <div className="space-y-3">
                                {contactosList.map((contacto) => (
                                  <div key={contacto.id} className="bg-muted/30 rounded-lg p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                      {contacto.nombre && (
                                        <div className="flex items-center gap-2">
                                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="font-medium">{contacto.nombre}</span>
                                        </div>
                                      )}
                                      {contacto.email && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground">{contacto.email}</span>
                                        </div>
                                      )}
                                      {contacto.telefono && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground">{contacto.telefono}</span>
                                        </div>
                                      )}
                                      {contacto.whatsapp && (
                                        <div className="flex items-center gap-2">
                                          <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="text-muted-foreground">{contacto.whatsapp}</span>
                                        </div>
                                      )}
                                    </div>
                                    {/* Notification preferences */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {contacto.notificar_email && <Badge variant="outline" className="text-xs">📧 Email</Badge>}
                                      {contacto.notificar_whatsapp && <Badge variant="outline" className="text-xs">💬 WhatsApp</Badge>}
                                      {contacto.notificar_app && <Badge variant="outline" className="text-xs">📱 App</Badge>}
                                      {contacto.incluir_cliente_final && <Badge variant="outline" className="text-xs">👤 Cliente final</Badge>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
