import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAISES_AMERICA } from "@/lib/countries";

const signupSchema = z.object({
  nombre_taller: z.string().trim().min(1, "El nombre del taller es requerido").max(100, "Máximo 100 caracteres"),
  telefono: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20, "Máximo 20 caracteres"),
  direccion: z.string().trim().min(1, "La dirección es requerida").max(200, "Máximo 200 caracteres"),
  ciudad: z.string().trim().min(1, "La ciudad es requerida").max(100, "Máximo 100 caracteres"),
  estado: z.string().trim().min(1, "El país es requerido").max(100, "Máximo 100 caracteres"),
  codigo_postal: z.string().trim().min(1, "El código postal es requerido").max(10, "Máximo 10 caracteres"),
  nombre_contacto: z.string().trim().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
  apellido_contacto: z.string().trim().min(1, "El apellido es requerido").max(50, "Máximo 50 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido").max(255, "Máximo 255 caracteres"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

const aseguradoraSignupSchema = z.object({
  nombre_aseguradora: z.string().trim().min(1, "El nombre de la aseguradora es requerido").max(100, "Máximo 100 caracteres"),
  rfc: z.string().trim().min(12, "RFC debe tener al menos 12 caracteres").max(13, "Máximo 13 caracteres"),
  telefono: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20, "Máximo 20 caracteres"),
  direccion: z.string().trim().min(1, "La dirección es requerida").max(200, "Máximo 200 caracteres"),
  ciudad: z.string().trim().min(1, "La ciudad es requerida").max(100, "Máximo 100 caracteres"),
  estado: z.string().trim().min(1, "El país es requerido").max(100, "Máximo 100 caracteres"),
  codigo_postal: z.string().trim().min(1, "El código postal es requerido").max(10, "Máximo 10 caracteres"),
  nombre_contacto: z.string().trim().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
  apellido_contacto: z.string().trim().min(1, "El apellido es requerido").max(50, "Máximo 50 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido").max(255, "Máximo 255 caracteres"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

const flotaSignupSchema = z.object({
  nombre_flota: z.string().trim().min(1, "El nombre de la flota es requerido").max(100),
  telefono: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20),
  direccion: z.string().trim().min(1, "La dirección es requerida").max(200),
  ciudad: z.string().trim().min(1, "La ciudad es requerida").max(100),
  estado: z.string().trim().min(1, "El país es requerido").max(100),
  codigo_postal: z.string().trim().min(1, "El código postal es requerido").max(10),
  nombre_contacto: z.string().trim().min(1, "El nombre es requerido").max(50),
  apellido_contacto: z.string().trim().min(1, "El apellido es requerido").max(50),
  email: z.string().trim().email("Correo electrónico inválido").max(255),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Verificar el rol del usuario
    if (data.user) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      // Bloquear login de usuarios con rol 'cliente' o 'tecnico'
      if (userRole && (userRole.role === 'cliente' || userRole.role === 'tecnico')) {
        await supabase.auth.signOut();
        setIsLoading(false);
        toast({
          title: "Acceso No Permitido",
          description: "Este tipo de usuario no puede iniciar sesión en esta plataforma.",
          variant: "destructive",
        });
        return;
      }

      // Verificar si el usuario es un taller y si está aprobado
      const { data: tallerData } = await supabase
        .from('talleres')
        .select('status')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (tallerData && (tallerData.status === 'pendiente' || tallerData.status === 'rechazado')) {
        await supabase.auth.signOut();
        setIsLoading(false);
        toast({
          title: tallerData.status === 'pendiente' ? "Solicitud pendiente" : "Solicitud rechazada",
          description: tallerData.status === 'pendiente' 
            ? "Tu solicitud de registro está siendo revisada." 
            : "Tu solicitud fue rechazada. Contacta al administrador.",
          variant: "destructive",
        });
        return;
      }

      // Verificar si el usuario es una flota y si está aprobada
      const { data: flotaData } = await supabase
        .from('flotas')
        .select('status')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (flotaData && (flotaData.status === 'pendiente' || flotaData.status === 'rechazado')) {
        await supabase.auth.signOut();
        setIsLoading(false);
        toast({
          title: flotaData.status === 'pendiente' ? "Solicitud pendiente" : "Solicitud rechazada",
          description: flotaData.status === 'pendiente'
            ? "Tu solicitud de registro está siendo revisada."
            : "Tu solicitud fue rechazada. Contacta al administrador.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(false);
    toast({
      title: "¡Bienvenido!",
      description: "Has iniciado sesión correctamente",
    });
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const signupData = {
      nombre_taller: formData.get("nombre_taller") as string,
      telefono: formData.get("telefono") as string,
      direccion: formData.get("direccion") as string,
      ciudad: formData.get("ciudad") as string,
      estado: formData.get("estado") as string,
      codigo_postal: formData.get("codigo_postal") as string,
      nombre_contacto: formData.get("nombre_contacto") as string,
      apellido_contacto: formData.get("apellido_contacto") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      descripcion: (formData.get("descripcion") as string) || undefined,
    };

    const result = signupSchema.safeParse(signupData);

    if (!result.success) {
      setIsLoading(false);
      toast({
        title: "Validación fallida",
        description: result.error.errors[0]?.message || "Por favor verifica los campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          user_type: 'taller',
          nombre_taller: signupData.nombre_taller,
          telefono: signupData.telefono,
          direccion: signupData.direccion,
          ciudad: signupData.ciudad,
          estado: signupData.estado,
          codigo_postal: signupData.codigo_postal,
          nombre_contacto: signupData.nombre_contacto,
          apellido_contacto: signupData.apellido_contacto,
          descripcion: signupData.descripcion,
        },
      },
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error al registrar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Cerrar sesión inmediatamente después del registro para evitar auto-login
    await supabase.auth.signOut();
    
    setIsLoading(false);

    // Limpiar el formulario
    (e.target as HTMLFormElement).reset();

    toast({
      title: "¡Registro exitoso!",
      description: "Tu solicitud de registro ha sido enviada. Podrás iniciar sesión una vez que sea aprobada por un administrador.",
    });
  };

  const handleAseguradoraSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const signupData = {
      nombre_aseguradora: formData.get("nombre_aseguradora") as string,
      rfc: formData.get("rfc") as string,
      telefono: formData.get("telefono") as string,
      direccion: formData.get("direccion") as string,
      ciudad: formData.get("ciudad") as string,
      estado: formData.get("estado") as string,
      codigo_postal: formData.get("codigo_postal") as string,
      nombre_contacto: formData.get("nombre_contacto") as string,
      apellido_contacto: formData.get("apellido_contacto") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      descripcion: (formData.get("descripcion") as string) || undefined,
    };

    const result = aseguradoraSignupSchema.safeParse(signupData);

    if (!result.success) {
      setIsLoading(false);
      toast({
        title: "Validación fallida",
        description: result.error.errors[0]?.message || "Por favor verifica los campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          user_type: 'aseguradora',
          nombre_aseguradora: signupData.nombre_aseguradora,
          rfc: signupData.rfc,
          telefono: signupData.telefono,
          direccion: signupData.direccion,
          ciudad: signupData.ciudad,
          estado: signupData.estado,
          codigo_postal: signupData.codigo_postal,
          nombre_contacto: signupData.nombre_contacto,
          apellido_contacto: signupData.apellido_contacto,
          descripcion: signupData.descripcion,
        },
      },
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: "Error al registrar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Cerrar sesión inmediatamente después del registro para evitar auto-login
    await supabase.auth.signOut();
    
    setIsLoading(false);

    // Limpiar el formulario
    (e.target as HTMLFormElement).reset();

    toast({
      title: "¡Registro exitoso!",
      description: "Tu cuenta de aseguradora ha sido creada exitosamente. Ya puedes iniciar sesión.",
    });
  };

  const handleFlotaSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const signupData = {
      nombre_flota: formData.get("nombre_flota") as string,
      telefono: formData.get("telefono") as string,
      direccion: formData.get("direccion") as string,
      ciudad: formData.get("ciudad") as string,
      estado: formData.get("estado") as string,
      codigo_postal: formData.get("codigo_postal") as string,
      nombre_contacto: formData.get("nombre_contacto") as string,
      apellido_contacto: formData.get("apellido_contacto") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    const result = flotaSignupSchema.safeParse(signupData);
    if (!result.success) {
      setIsLoading(false);
      toast({ title: "Validación fallida", description: result.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          user_type: 'flota',
          nombre_flota: signupData.nombre_flota,
          telefono: signupData.telefono,
          direccion: signupData.direccion,
          ciudad: signupData.ciudad,
          estado: signupData.estado,
          codigo_postal: signupData.codigo_postal,
          nombre_contacto: signupData.nombre_contacto,
          apellido_contacto: signupData.apellido_contacto,
        },
      },
    });
    if (error) {
      setIsLoading(false);
      toast({ title: "Error al registrar", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.auth.signOut();
    setIsLoading(false);
    (e.target as HTMLFormElement).reset();
    toast({
      title: "¡Registro exitoso!",
      description: "Tu solicitud ha sido enviada. Podrás iniciar sesión una vez aprobada.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary to-secondary/90 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            className="mb-4 text-primary-foreground hover:text-primary-foreground/80"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wrench className="h-8 w-8 text-primary" />
            <span className="text-3xl font-bold text-primary-foreground">AutoFlowX</span>
          </div>
          <p className="text-primary-foreground/80">
            Sistema de gestión para talleres automotrices
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-border/50 shadow-[var(--shadow-elevated)]">
          <CardHeader>
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Taller</TabsTrigger>
                <TabsTrigger value="aseguradora">Aseguradora</TabsTrigger>
                <TabsTrigger value="flota">Flota</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo Electrónico</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" className="text-sm text-muted-foreground">
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Información del Taller */}
                  <div className="space-y-3 pb-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-muted-foreground">Información del Taller</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nombre_taller">Nombre del Taller *</Label>
                      <Input
                        id="nombre_taller"
                        name="nombre_taller"
                        type="text"
                        placeholder="Taller Automotriz XYZ"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        placeholder="+52 123 456 7890"
                        required
                        maxLength={20}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección *</Label>
                      <Input
                        id="direccion"
                        name="direccion"
                        type="text"
                        placeholder="Calle Principal #123"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="ciudad">Ciudad *</Label>
                        <Input
                          id="ciudad"
                          name="ciudad"
                          type="text"
                          placeholder="Ciudad"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">País *</Label>
                        <Select name="estado" required>
                          <SelectTrigger id="estado">
                            <SelectValue placeholder="Seleccionar país" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAISES_AMERICA.map((pais) => (
                              <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo_postal">Código Postal *</Label>
                      <Input
                        id="codigo_postal"
                        name="codigo_postal"
                        type="text"
                        placeholder="12345"
                        required
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción del Taller</Label>
                      <Textarea
                        id="descripcion"
                        name="descripcion"
                        placeholder="Breve descripción de los servicios que ofrece tu taller (opcional)"
                        maxLength={500}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-3 pb-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-muted-foreground">Información de Contacto</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_contacto">Nombre *</Label>
                        <Input
                          id="nombre_contacto"
                          name="nombre_contacto"
                          type="text"
                          placeholder="Juan"
                          required
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido_contacto">Apellido *</Label>
                        <Input
                          id="apellido_contacto"
                          name="apellido_contacto"
                          type="text"
                          placeholder="Pérez"
                          required
                          maxLength={50}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Correo Electrónico *</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="contacto@taller.com"
                        required
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña *</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Al registrarte, aceptas nuestros términos de servicio y política de privacidad
                  </p>
                </form>
              </TabsContent>

              {/* Aseguradora Signup Form */}
              <TabsContent value="aseguradora">
                <form onSubmit={handleAseguradoraSignup} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Información de la Aseguradora */}
                  <div className="space-y-3 pb-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-muted-foreground">Información de la Aseguradora</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nombre_aseguradora">Nombre de la Aseguradora *</Label>
                      <Input
                        id="nombre_aseguradora"
                        name="nombre_aseguradora"
                        type="text"
                        placeholder="Aseguradora XYZ S.A."
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rfc">RFC *</Label>
                      <Input
                        id="rfc"
                        name="rfc"
                        type="text"
                        placeholder="ABC123456XYZ"
                        required
                        minLength={12}
                        maxLength={13}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono_aseg">Teléfono *</Label>
                      <Input
                        id="telefono_aseg"
                        name="telefono"
                        type="tel"
                        placeholder="+52 123 456 7890"
                        required
                        maxLength={20}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion_aseg">Dirección *</Label>
                      <Input
                        id="direccion_aseg"
                        name="direccion"
                        type="text"
                        placeholder="Avenida Principal #123"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="ciudad_aseg">Ciudad *</Label>
                        <Input
                          id="ciudad_aseg"
                          name="ciudad"
                          type="text"
                          placeholder="Ciudad"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado_aseg">País *</Label>
                        <Select name="estado" required>
                          <SelectTrigger id="estado_aseg">
                            <SelectValue placeholder="Seleccionar país" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAISES_AMERICA.map((pais) => (
                              <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo_postal_aseg">Código Postal *</Label>
                      <Input
                        id="codigo_postal_aseg"
                        name="codigo_postal"
                        type="text"
                        placeholder="12345"
                        required
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion_aseg">Descripción</Label>
                      <Textarea
                        id="descripcion_aseg"
                        name="descripcion"
                        placeholder="Breve descripción de los servicios de la aseguradora (opcional)"
                        maxLength={500}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-3 pb-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-muted-foreground">Información de Contacto</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_contacto_aseg">Nombre *</Label>
                        <Input
                          id="nombre_contacto_aseg"
                          name="nombre_contacto"
                          type="text"
                          placeholder="María"
                          required
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido_contacto_aseg">Apellido *</Label>
                        <Input
                          id="apellido_contacto_aseg"
                          name="apellido_contacto"
                          type="text"
                          placeholder="González"
                          required
                          maxLength={50}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aseg-email">Correo Electrónico *</Label>
                      <Input
                        id="aseg-email"
                        name="email"
                        type="email"
                        placeholder="contacto@aseguradora.com"
                        required
                        maxLength={255}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aseg-password">Contraseña *</Label>
                      <Input
                        id="aseg-password"
                        name="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta de Aseguradora"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Al registrarte, aceptas nuestros términos de servicio y política de privacidad
                  </p>
                </form>
              </TabsContent>

              {/* Flota Signup Form */}
              <TabsContent value="flota">
                <form onSubmit={handleFlotaSignup} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="space-y-3 pb-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-muted-foreground">Información de la Flota</h3>
                    <div className="space-y-2">
                      <Label htmlFor="nombre_flota">Nombre de la Flota *</Label>
                      <Input id="nombre_flota" name="nombre_flota" type="text" placeholder="Flota Transportes ABC" required maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono_flota">Teléfono *</Label>
                      <Input id="telefono_flota" name="telefono" type="tel" placeholder="+504 1234 5678" required maxLength={20} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direccion_flota">Dirección *</Label>
                      <Input id="direccion_flota" name="direccion" type="text" placeholder="Blvd. Principal #456" required maxLength={200} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="ciudad_flota">Ciudad *</Label>
                        <Input id="ciudad_flota" name="ciudad" type="text" placeholder="Ciudad" required maxLength={100} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado_flota">País *</Label>
                        <Select name="estado" required>
                          <SelectTrigger id="estado_flota"><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
                          <SelectContent>
                            {PAISES_AMERICA.map((pais) => (
                              <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo_postal_flota">Código Postal *</Label>
                      <Input id="codigo_postal_flota" name="codigo_postal" type="text" placeholder="12345" required maxLength={10} />
                    </div>
                  </div>
                  <div className="space-y-3 pb-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-muted-foreground">Información de Contacto</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="nombre_contacto_flota">Nombre *</Label>
                        <Input id="nombre_contacto_flota" name="nombre_contacto" type="text" placeholder="Carlos" required maxLength={50} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido_contacto_flota">Apellido *</Label>
                        <Input id="apellido_contacto_flota" name="apellido_contacto" type="text" placeholder="Rodríguez" required maxLength={50} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flota-email">Correo Electrónico *</Label>
                      <Input id="flota-email" name="email" type="email" placeholder="contacto@flota.com" required maxLength={255} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flota-password">Contraseña *</Label>
                      <Input id="flota-password" name="password" type="password" placeholder="Mínimo 8 caracteres" required minLength={8} maxLength={100} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta de Flota"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Al registrarte, aceptas nuestros términos de servicio y política de privacidad
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
