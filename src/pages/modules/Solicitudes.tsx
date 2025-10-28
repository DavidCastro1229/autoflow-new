import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck } from "lucide-react";

const Solicitudes = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Talleres</h1>
          <p className="text-muted-foreground">Gestión de solicitudes de registro de talleres</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Pendientes</CardTitle>
          <CardDescription>
            Revisa y aprueba las solicitudes de registro de nuevos talleres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Módulo de solicitudes en desarrollo...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Solicitudes;
