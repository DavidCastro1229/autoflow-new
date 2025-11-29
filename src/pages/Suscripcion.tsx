import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    id: "basico",
    name: "Plan Básico",
    price: "$29",
    period: "/mes",
    description: "Perfecto para talleres pequeños",
    features: [
      "Hasta 50 órdenes al mes",
      "Gestión de clientes",
      "Gestión de vehículos",
      "Dashboard básico",
      "Soporte por email",
    ],
    popular: false,
  },
  {
    id: "profesional",
    name: "Plan Profesional",
    price: "$79",
    period: "/mes",
    description: "Para talleres en crecimiento",
    features: [
      "Órdenes ilimitadas",
      "Gestión completa de equipo",
      "Kanban avanzado",
      "Reportes detallados",
      "Gestión de inventario",
      "Soporte prioritario",
      "Integración con aseguradoras",
    ],
    popular: true,
  },
  {
    id: "empresarial",
    name: "Plan Empresarial",
    price: "$149",
    period: "/mes",
    description: "Para talleres establecidos",
    features: [
      "Todo del Plan Profesional",
      "Múltiples ubicaciones",
      "API personalizada",
      "Gestión de flotas",
      "Soporte 24/7",
      "Capacitación personalizada",
      "Gerente de cuenta dedicado",
    ],
    popular: false,
  },
];

export default function Suscripcion() {
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tallerId } = useUserRole();

  const handleSubscribe = async (planId: string, method: "card" | "paypal") => {
    setLoading(planId);
    setPaymentMethod(method);

    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Actualizar el estado de suscripción en la base de datos
      if (tallerId) {
        const { error: updateError } = await supabase
          .from("talleres")
          .update({ 
            estado_suscripcion: "activo",
            // Limpiar las fechas de prueba ya que ahora está en suscripción activa
            fecha_fin_prueba: null
          })
          .eq("id", tallerId);

        if (updateError) {
          throw updateError;
        }
      }

      toast({
        title: "¡Suscripción activada!",
        description: `Tu plan ha sido activado exitosamente. Redirigiendo al dashboard...`,
      });

      setTimeout(() => {
        navigate("/dashboard");
        // Recargar la página para que se actualice el estado de la suscripción
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error al activar suscripción:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu pago. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      setPaymentMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Elige tu Plan Perfecto</h1>
          <p className="text-lg text-muted-foreground">
            Selecciona el plan que mejor se adapte a las necesidades de tu taller
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Más Popular
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id, "card")}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id && paymentMethod === "card" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pagar con Tarjeta
                    </>
                  )}
                </Button>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleSubscribe(plan.id, "paypal")}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id && paymentMethod === "paypal" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Pagar con PayPal"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
