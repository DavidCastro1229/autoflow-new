import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Talleres = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Talleres</h1>
        <p className="text-muted-foreground">
          Gestión de talleres asociados a la aseguradora
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Talleres</CardTitle>
          <CardDescription>
            Administra los talleres con los que trabaja tu aseguradora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo en desarrollo - Aquí podrás ver y gestionar todos los talleres asociados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Talleres;
