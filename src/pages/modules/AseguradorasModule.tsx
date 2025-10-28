import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const AseguradorasModule = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Aseguradoras</h1>
          <p className="text-muted-foreground">Gestión de aseguradoras registradas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aseguradoras Registradas</CardTitle>
          <CardDescription>
            Administra las aseguradoras asociadas a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo de aseguradoras en desarrollo...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AseguradorasModule;
