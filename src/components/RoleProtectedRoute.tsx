import { UserRole } from "@/hooks/useUserRole";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  userRole: UserRole | null;
}

export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles, 
  userRole 
}: RoleProtectedRouteProps) => {
  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a este módulo
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>Este módulo solo está disponible para administradores del taller.</p>
            <p className="mt-2">Si crees que deberías tener acceso, contacta con tu administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
