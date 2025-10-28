import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Reparaciones = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reparaciones</h1>
        <p className="text-muted-foreground">
          Seguimiento de reparaciones en proceso
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reparaciones Activas</CardTitle>
          <CardDescription>
            Monitorea el estado de las reparaciones autorizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo en desarrollo - Aquí podrás dar seguimiento a todas las reparaciones
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reparaciones;
