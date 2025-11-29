import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AseguradoraConfig {
  nombre_aseguradora: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  nombre_contacto: string;
  apellido_contacto: string;
  rfc: string;
  descripcion: string | null;
}

export default function ConfiguracionesAseguradora() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AseguradoraConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("aseguradoras")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setConfig(data);
    } catch (error) {
      console.error("Error fetching config:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("aseguradoras")
        .update({
          nombre_aseguradora: config.nombre_aseguradora,
          telefono: config.telefono,
          email: config.email,
          direccion: config.direccion,
          ciudad: config.ciudad,
          estado: config.estado,
          codigo_postal: config.codigo_postal,
          nombre_contacto: config.nombre_contacto,
          apellido_contacto: config.apellido_contacto,
          rfc: config.rfc,
          descripcion: config.descripcion,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración actualizada correctamente",
      });

      await fetchConfig();
    } catch (error) {
      console.error("Error updating config:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró configuración</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuraciones</h1>
        <p className="text-muted-foreground mt-2">
          Administra la información de tu aseguradora
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Datos básicos de la aseguradora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_aseguradora">Nombre de la Aseguradora</Label>
                <Input
                  id="nombre_aseguradora"
                  value={config.nombre_aseguradora}
                  onChange={(e) => setConfig({ ...config, nombre_aseguradora: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input
                  id="rfc"
                  value={config.rfc}
                  onChange={(e) => setConfig({ ...config, rfc: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={config.telefono}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={config.descripcion || ""}
                onChange={(e) => setConfig({ ...config, descripcion: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto Principal</CardTitle>
            <CardDescription>
              Información del contacto principal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_contacto">Nombre</Label>
                <Input
                  id="nombre_contacto"
                  value={config.nombre_contacto}
                  onChange={(e) => setConfig({ ...config, nombre_contacto: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido_contacto">Apellido</Label>
                <Input
                  id="apellido_contacto"
                  value={config.apellido_contacto}
                  onChange={(e) => setConfig({ ...config, apellido_contacto: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
            <CardDescription>
              Ubicación de la aseguradora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={config.direccion}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={config.ciudad}
                  onChange={(e) => setConfig({ ...config, ciudad: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={config.estado}
                  onChange={(e) => setConfig({ ...config, estado: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  value={config.codigo_postal}
                  onChange={(e) => setConfig({ ...config, codigo_postal: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={fetchConfig}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
