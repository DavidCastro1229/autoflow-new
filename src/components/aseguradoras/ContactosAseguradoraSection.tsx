import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, User, Mail, Phone, MessageCircle, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

type TipoContacto = "gerente_pais" | "gerente_regional" | "reclamos" | "ajustadores" | "corredores";

interface Contacto {
  id: string;
  aseguradora_id: string;
  tipo_contacto: TipoContacto;
  nombre: string;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  notificar_email: boolean;
  notificar_whatsapp: boolean;
  notificar_app: boolean;
  incluir_cliente_final: boolean;
}

interface ContactosAseguradoraSectionProps {
  aseguradoraId: string;
}

const tipoContactoLabels: Record<TipoContacto, { label: string; description: string; icon: string }> = {
  gerente_pais: { 
    label: "Gerente País", 
    description: "Responsable a nivel nacional",
    icon: "🌎"
  },
  gerente_regional: { 
    label: "Gerente Regional", 
    description: "Responsable de zona geográfica",
    icon: "📍"
  },
  reclamos: { 
    label: "Reclamos", 
    description: "Departamento de gestión de reclamos",
    icon: "📋"
  },
  ajustadores: { 
    label: "Ajustadores", 
    description: "Personal de ajuste de siniestros",
    icon: "🔧"
  },
  corredores: { 
    label: "Corredores", 
    description: "Agentes y corredores de seguros",
    icon: "🤝"
  },
};

const tipoContactoOrder: TipoContacto[] = [
  "gerente_pais",
  "gerente_regional",
  "reclamos",
  "ajustadores",
  "corredores"
];

export default function ContactosAseguradoraSection({ aseguradoraId }: ContactosAseguradoraSectionProps) {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContactos();
  }, [aseguradoraId]);

  const fetchContactos = async () => {
    try {
      const { data, error } = await supabase
        .from("aseguradora_contactos")
        .select("*")
        .eq("aseguradora_id", aseguradoraId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setContactos(data || []);
    } catch (error) {
      console.error("Error fetching contactos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contactos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addContacto = async (tipoContacto: TipoContacto) => {
    setSaving(tipoContacto);
    try {
      const { data, error } = await supabase
        .from("aseguradora_contactos")
        .insert({
          aseguradora_id: aseguradoraId,
          tipo_contacto: tipoContacto,
          nombre: "",
          notificar_email: false,
          notificar_whatsapp: false,
          notificar_app: false,
          incluir_cliente_final: false,
        })
        .select()
        .single();

      if (error) throw error;

      setContactos([...contactos, data]);
      toast({
        title: "Contacto agregado",
        description: "Se ha agregado un nuevo contacto",
      });
    } catch (error) {
      console.error("Error adding contacto:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el contacto",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const updateContacto = async (id: string, updates: Partial<Contacto>) => {
    try {
      const { error } = await supabase
        .from("aseguradora_contactos")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setContactos(contactos.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (error) {
      console.error("Error updating contacto:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el contacto",
        variant: "destructive",
      });
    }
  };

  const deleteContacto = async (id: string) => {
    try {
      const { error } = await supabase
        .from("aseguradora_contactos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setContactos(contactos.filter(c => c.id !== id));
      toast({
        title: "Contacto eliminado",
        description: "Se ha eliminado el contacto",
      });
    } catch (error) {
      console.error("Error deleting contacto:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto",
        variant: "destructive",
      });
    }
  };

  const getContactosByTipo = (tipo: TipoContacto) => {
    return contactos.filter(c => c.tipo_contacto === tipo);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contactos por Departamento</CardTitle>
        <CardDescription>
          Gestiona los contactos de tu aseguradora por tipo y configura las preferencias de notificación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {tipoContactoOrder.map((tipo) => {
            const tipoInfo = tipoContactoLabels[tipo];
            const tipoContactos = getContactosByTipo(tipo);

            return (
              <AccordionItem key={tipo} value={tipo} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tipoInfo.icon}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tipoInfo.label}</span>
                        {tipoContactos.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {tipoContactos.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-normal">
                        {tipoInfo.description}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-4">
                    {tipoContactos.map((contacto) => (
                      <ContactoCard
                        key={contacto.id}
                        contacto={contacto}
                        onUpdate={updateContacto}
                        onDelete={deleteContacto}
                      />
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addContacto(tipo)}
                      disabled={saving === tipo}
                      className="w-full"
                    >
                      {saving === tipo ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Agregar {tipoInfo.label}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

interface ContactoCardProps {
  contacto: Contacto;
  onUpdate: (id: string, updates: Partial<Contacto>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ContactoCard({ contacto, onUpdate, onDelete }: ContactoCardProps) {
  const [localData, setLocalData] = useState(contacto);
  const [deleting, setDeleting] = useState(false);

  const handleBlur = (field: keyof Contacto) => {
    if (localData[field] !== contacto[field]) {
      onUpdate(contacto.id, { [field]: localData[field] });
    }
  };

  const handleCheckboxChange = (field: keyof Contacto, checked: boolean) => {
    setLocalData({ ...localData, [field]: checked });
    onUpdate(contacto.id, { [field]: checked });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(contacto.id);
    setDeleting(false);
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre
            </Label>
            <Input
              value={localData.nombre}
              onChange={(e) => setLocalData({ ...localData, nombre: e.target.value })}
              onBlur={() => handleBlur("nombre")}
              placeholder="Nombre del contacto"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              type="email"
              value={localData.email || ""}
              onChange={(e) => setLocalData({ ...localData, email: e.target.value })}
              onBlur={() => handleBlur("email")}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Teléfono
            </Label>
            <Input
              value={localData.telefono || ""}
              onChange={(e) => setLocalData({ ...localData, telefono: e.target.value })}
              onBlur={() => handleBlur("telefono")}
              placeholder="+504 9999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              WhatsApp
            </Label>
            <Input
              value={localData.whatsapp || ""}
              onChange={(e) => setLocalData({ ...localData, whatsapp: e.target.value })}
              onBlur={() => handleBlur("whatsapp")}
              placeholder="+504 9999-9999"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="border-t pt-4">
        <Label className="text-sm font-medium mb-3 block">Preferencias de Notificación</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`email-${contacto.id}`}
              checked={localData.notificar_email}
              onCheckedChange={(checked) => handleCheckboxChange("notificar_email", checked as boolean)}
            />
            <Label htmlFor={`email-${contacto.id}`} className="text-sm font-normal cursor-pointer">
              Email
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`whatsapp-${contacto.id}`}
              checked={localData.notificar_whatsapp}
              onCheckedChange={(checked) => handleCheckboxChange("notificar_whatsapp", checked as boolean)}
            />
            <Label htmlFor={`whatsapp-${contacto.id}`} className="text-sm font-normal cursor-pointer">
              WhatsApp
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`app-${contacto.id}`}
              checked={localData.notificar_app}
              onCheckedChange={(checked) => handleCheckboxChange("notificar_app", checked as boolean)}
            />
            <Label htmlFor={`app-${contacto.id}`} className="text-sm font-normal cursor-pointer">
              App
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id={`cliente-${contacto.id}`}
              checked={localData.incluir_cliente_final}
              onCheckedChange={(checked) => handleCheckboxChange("incluir_cliente_final", checked as boolean)}
            />
            <Label htmlFor={`cliente-${contacto.id}`} className="text-sm font-normal cursor-pointer">
              Cliente final incluido
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
