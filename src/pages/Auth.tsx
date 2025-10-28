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

const signupSchema = z.object({
  nombre_taller: z.string().trim().min(1, "El nombre del taller es requerido").max(100, "Máximo 100 caracteres"),
  telefono: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20, "Máximo 20 caracteres"),
  direccion: z.string().trim().min(1, "La dirección es requerida").max(200, "Máximo 200 caracteres"),
  ciudad: z.string().trim().min(1, "La ciudad es requerida").max(100, "Máximo 100 caracteres"),
  estado: z.string().trim().min(1, "El estado es requerido").max(100, "Máximo 100 caracteres"),
  codigo_postal: z.string().trim().min(1, "El código postal es requerido").max(10, "Máximo 10 caracteres"),
  nombre_contacto: z.string().trim().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
  apellido_contacto: z.string().trim().min(1, "El apellido es requerido").max(50, "Máximo 50 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido").max(255, "Máximo 255 caracteres"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Máximo 100 caracteres"),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

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

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error al registrar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Registro exitoso!",
      description: "Tu cuenta ha sido creada. Redirigiendo...",
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
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
                        <Label htmlFor="estado">Estado *</Label>
                        <Input
                          id="estado"
                          name="estado"
                          type="text"
                          placeholder="Estado"
                          required
                          maxLength={100}
                        />
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
