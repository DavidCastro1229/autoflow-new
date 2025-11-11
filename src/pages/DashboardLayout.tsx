import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Define allowed roles for each route
const routePermissions: Record<string, UserRole[]> = {
  // Rutas específicas de super_admin
  "/usuarios": ["super_admin"],
  "/solicitudes": ["super_admin"],
  "/aseguradoras": ["super_admin"],
  
  // Rutas compartidas
  "/dashboard": ["admin_taller", "aseguradora", "super_admin"],
  "/kanban": ["admin_taller", "super_admin"],
  "/talleres": ["aseguradora", "super_admin"],
  "/equipo": ["taller", "admin_taller", "super_admin"],
  "/ordenes": ["taller", "admin_taller", "super_admin"],
  "/vehiculos": ["taller", "admin_taller", "aseguradora", "super_admin"],
  "/hoja-ingreso": ["taller", "admin_taller", "super_admin"],
  "/flotas": ["taller", "admin_taller", "super_admin"],
  "/cotizaciones": ["taller", "admin_taller", "aseguradora", "super_admin"],
  "/facturacion": ["taller", "admin_taller", "aseguradora", "super_admin"],
  "/mensajes": ["aseguradora", "super_admin"],
  "/reparaciones": ["aseguradora", "super_admin"],
  "/siniestros": ["aseguradora", "super_admin"],
  "/citas": ["taller", "admin_taller", "super_admin"],
  "/inventario": ["taller", "admin_taller", "super_admin"],
  "/tecnicos": ["taller", "admin_taller", "super_admin"],
  "/clientes": ["admin_taller", "super_admin"],
  "/reportes": ["taller", "admin_taller", "aseguradora", "super_admin"],
  "/accesos": ["admin_taller", "super_admin"],
  "/configuraciones": ["admin_taller", "super_admin"],
  "/servicios": ["taller", "admin_taller", "super_admin"],
  "/paquetes": ["taller", "admin_taller", "super_admin"],
};

export default function DashboardLayout() {
  const { role, loading } = useUserRole();
  const { trialStatus } = useTrialStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showTrialModal, setShowTrialModal] = useState(false);
  
  const currentPath = location.pathname;
  const allowedRoles = routePermissions[currentPath] || [];

  // Check trial status and show modal if expired or about to expire
  useEffect(() => {
    if (trialStatus) {
      const isExpired = trialStatus.estado_suscripcion === "expirado";
      const isAboutToExpire = 
        trialStatus.dias_restantes !== null && 
        trialStatus.dias_restantes <= 3 &&
        trialStatus.estado_suscripcion === "prueba";

      if (isExpired || isAboutToExpire) {
        setShowTrialModal(true);
      }
    }
  }, [trialStatus]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar userRole={role} />
          
          {/* Trial Expired Modal */}
          {trialStatus && (
            <TrialExpiredModal 
              open={showTrialModal && trialStatus.estado_suscripcion !== "activo"}
              diasRestantes={trialStatus.dias_restantes}
            />
          )}
          
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b border-border flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold">Sistema de Gestión AutoFlowX</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </header>

            <main className="flex-1 p-6 overflow-auto">
              <RoleProtectedRoute allowedRoles={allowedRoles} userRole={role}>
                <Outlet />
              </RoleProtectedRoute>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
