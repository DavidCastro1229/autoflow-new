import { useState } from "react";
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

const signupSchema = z.object({
  workshopName: z.string().trim().min(1, "El nombre del taller es requerido").max(100, "Máximo 100 caracteres"),
  phone: z.string().trim().min(10, "Teléfono debe tener al menos 10 dígitos").max(20, "Máximo 20 caracteres"),
  address: z.string().trim().min(1, "La dirección es requerida").max(200, "Máximo 200 caracteres"),
  city: z.string().trim().min(1, "La ciudad es requerida").max(100, "Máximo 100 caracteres"),
  state: z.string().trim().min(1, "El estado es requerido").max(100, "Máximo 100 caracteres"),
  zipCode: z.string().trim().min(1, "El código postal es requerido").max(10, "Máximo 10 caracteres"),
  firstName: z.string().trim().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
  lastName: z.string().trim().min(1, "El apellido es requerido").max(50, "Máximo 50 caracteres"),
  email: z.string().trim().email("Correo electrónico inválido").max(255, "Máximo 255 caracteres"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Máximo 100 caracteres"),
  description: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      const validated = loginSchema.parse(data);
      // Simulación de login - aquí se conectará con el backend
      setTimeout(() => {
        setIsLoading(false);
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido a AutoFlowX",
        });
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      workshopName: formData.get("workshopName") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zipCode: formData.get("zipCode") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      description: formData.get("description") as string || undefined,
    };

    try {
      const validated = signupSchema.parse(data);
      // Simulación de registro - aquí se conectará con el backend
      setTimeout(() => {
        setIsLoading(false);
        toast({
          title: "Registro exitoso",
          description: "Tu cuenta ha sido creada correctamente",
        });
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
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
                      <Label htmlFor="workshopName">Nombre del Taller *</Label>
                      <Input
                        id="workshopName"
                        name="workshopName"
                        type="text"
                        placeholder="Taller Automotriz XYZ"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+52 123 456 7890"
                        required
                        maxLength={20}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección *</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="Calle Principal #123"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad *</Label>
                        <Input
                          id="city"
                          name="city"
                          type="text"
                          placeholder="Ciudad"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado *</Label>
                        <Input
                          id="state"
                          name="state"
                          type="text"
                          placeholder="Estado"
                          required
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Código Postal *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        placeholder="12345"
                        required
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción del Taller</Label>
                      <Textarea
                        id="description"
                        name="description"
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
                        <Label htmlFor="firstName">Nombre *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="Juan"
                          required
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellido *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
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
