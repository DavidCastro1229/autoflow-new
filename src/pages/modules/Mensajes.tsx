import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Mensajes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mensajes</h1>
        <p className="text-muted-foreground">
          Sistema de mensajería con talleres
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Mensajes</CardTitle>
          <CardDescription>
            Comunicación directa con los talleres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo en desarrollo - Aquí podrás gestionar la comunicación con los talleres
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Mensajes;
