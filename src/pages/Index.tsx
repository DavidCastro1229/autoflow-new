import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Wrench, Users, LineChart, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImage from "@/assets/hero-auto.jpg";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkSession();
  }, [navigate]);

  const features = [
    {
      icon: Wrench,
      title: "Gestión de Órdenes",
      description: "Controla todas las órdenes de trabajo, asignaciones y estado en tiempo real.",
    },
    {
      icon: Users,
      title: "Administración de Clientes",
      description: "Base de datos completa de clientes con historial de servicios y vehículos.",
    },
    {
      icon: LineChart,
      title: "Reportes y Analíticas",
      description: "Visualiza métricas clave, rendimiento del taller y proyecciones de negocio.",
    },
    {
      icon: Clock,
      title: "Programación Inteligente",
      description: "Agenda citas, asigna técnicos y optimiza los tiempos de servicio.",
    },
  ];

  const benefits = [
    "Reduce tiempos de operación hasta 40%",
    "Mejora la satisfacción del cliente",
    "Control total de inventario y repuestos",
    "Facturación y pagos automatizados",
    "Acceso desde cualquier dispositivo",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AutoFlowX</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="hero" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 -z-10" />
        <div 
          className="absolute inset-0 opacity-20 -z-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight">
              Gestiona tu Taller
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                de Forma Inteligente
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-primary-foreground/80">
              AutoFlowX es el sistema completo para optimizar la gestión de talleres automotrices y flotas vehiculares.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8"
                onClick={() => navigate("/auth")}
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline-hero" 
                size="lg" 
                className="text-lg px-8"
              >
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Funcionalidades Clave
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitas para llevar tu taller al siguiente nivel
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[var(--shadow-elevated)]"
              >
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Por qué elegir AutoFlowX
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Diseñado específicamente para talleres automotrices que buscan eficiencia y crecimiento.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="text-7xl font-bold text-primary">40%</div>
                  <p className="text-2xl font-semibold">Más Eficiente</p>
                  <p className="text-muted-foreground">
                    Los talleres que usan AutoFlowX reportan un incremento promedio del 40% en eficiencia operativa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-secondary via-secondary to-secondary/90">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Comienza a optimizar tu taller hoy
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Únete a cientos de talleres que ya confían en AutoFlowX
          </p>
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg px-12"
            onClick={() => navigate("/auth")}
          >
            Crear Cuenta Gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <span className="font-semibold">AutoFlowX</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 AutoFlowX. Sistema de gestión para talleres automotrices.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
