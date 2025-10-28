import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Siniestros = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Siniestros</h1>
        <p className="text-muted-foreground">
          Gestión de reportes de siniestros
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Siniestros</CardTitle>
          <CardDescription>
            Administra y da seguimiento a los siniestros reportados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo en desarrollo - Aquí podrás gestionar todos los siniestros
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Siniestros;
