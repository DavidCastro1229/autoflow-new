import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Building2, MapPin, Phone, Mail, FileText, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TallerConfig {
  id: string;
  nombre_taller: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  nombre_contacto: string;
  apellido_contacto: string;
  descripcion: string | null;
  logo_url: string | null;
}

export default function Configuraciones() {
  const { tallerId } = useUserRole();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [config, setConfig] = useState<TallerConfig | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [tallerId]);

  const fetchConfig = async () => {
    if (!tallerId) return;

    const { data, error } = await supabase
      .from("talleres" as any)
      .select("*")
      .eq("id", tallerId)
      .single() as any;

    if (error) {
      console.error("Error fetching config:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive",
      });
    } else {
      setConfig(data);
      if (data?.logo_url) {
        setLogoPreview(data.logo_url);
      }
    }
    setLoading(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo debe ser menor a 2MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !tallerId) return null;

    setUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${tallerId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old logo if exists
      if (config?.logo_url) {
        const oldFileName = config.logo_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("taller-logos").remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("taller-logos")
        .upload(filePath, logoFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("taller-logos")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el logo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !tallerId) return;

    setSaving(true);
    try {
      let logoUrl = config.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from("talleres" as any)
        .update({
          nombre_taller: config.nombre_taller,
          telefono: config.telefono,
          email: config.email,
          direccion: config.direccion,
          ciudad: config.ciudad,
          estado: config.estado,
          codigo_postal: config.codigo_postal,
          nombre_contacto: config.nombre_contacto,
          apellido_contacto: config.apellido_contacto,
          descripcion: config.descripcion,
          logo_url: logoUrl,
        } as any)
        .eq("id", tallerId);

      if (error) throw error;

      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado exitosamente",
      });

      setLogoFile(null);
      fetchConfig();
    } catch (error: any) {
      console.error("Error updating config:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la configuración",
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
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No se encontró la configuración del taller</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuraciones</h1>
        <p className="text-muted-foreground">Administra la información de tu taller</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo del Taller
            </CardTitle>
            <CardDescription>
              Sube el logo de tu taller (máximo 2MB, formatos: JPG, PNG, SVG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-32 w-32 rounded-lg">
                <AvatarImage src={logoPreview || undefined} alt="Logo del taller" />
                <AvatarFallback className="rounded-lg bg-muted">
                  <Building2 className="h-16 w-16 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <Label htmlFor="logo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors w-fit">
                    <Upload className="h-4 w-4" />
                    {logoFile ? "Cambiar logo" : "Subir logo"}
                  </div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </Label>
                {logoFile && (
                  <p className="text-sm text-muted-foreground">
                    Archivo seleccionado: {logoFile.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información del Taller
            </CardTitle>
            <CardDescription>Datos generales de tu negocio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_taller">Nombre del Taller *</Label>
                <Input
                  id="nombre_taller"
                  value={config.nombre_taller}
                  onChange={(e) => setConfig({ ...config, nombre_taller: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefono"
                    value={config.telefono}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal *</Label>
                <Input
                  id="codigo_postal"
                  value={config.codigo_postal}
                  onChange={(e) => setConfig({ ...config, codigo_postal: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="descripcion"
                  value={config.descripcion || ""}
                  onChange={(e) => setConfig({ ...config, descripcion: e.target.value })}
                  className="pl-10 min-h-[100px]"
                  placeholder="Describe los servicios y especialidades de tu taller..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación
            </CardTitle>
            <CardDescription>Dirección física del taller</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                value={config.direccion}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  value={config.ciudad}
                  onChange={(e) => setConfig({ ...config, ciudad: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado/Departamento *</Label>
                <Input
                  id="estado"
                  value={config.estado}
                  onChange={(e) => setConfig({ ...config, estado: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto Principal</CardTitle>
            <CardDescription>Información de la persona de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_contacto">Nombre *</Label>
                <Input
                  id="nombre_contacto"
                  value={config.nombre_contacto}
                  onChange={(e) => setConfig({ ...config, nombre_contacto: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellido_contacto">Apellido *</Label>
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

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchConfig()}
            disabled={saving || uploadingLogo}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || uploadingLogo}>
            {saving || uploadingLogo ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadingLogo ? "Subiendo logo..." : "Guardando..."}
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
