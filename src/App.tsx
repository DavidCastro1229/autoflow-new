import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/modules/Kanban";
import Equipo from "./pages/modules/Equipo";
import Ordenes from "./pages/modules/Ordenes";
import Vehiculos from "./pages/modules/Vehiculos";
import Flotas from "./pages/modules/Flotas";
import Cotizaciones from "./pages/modules/Cotizaciones";
import Facturacion from "./pages/modules/Facturacion";
import Citas from "./pages/modules/Citas";
import Inventario from "./pages/modules/Inventario";
import Tecnicos from "./pages/modules/Tecnicos";
import Clientes from "./pages/modules/Clientes";
import Reportes from "./pages/modules/Reportes";
import Accesos from "./pages/modules/Accesos";
import Configuraciones from "./pages/modules/Configuraciones";
import Talleres from "./pages/modules/Talleres";
import Mensajes from "./pages/modules/Mensajes";
import Reparaciones from "./pages/modules/Reparaciones";
import Siniestros from "./pages/modules/Siniestros";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { useUserRole, UserRole } from "./hooks/useUserRole";

const queryClient = new QueryClient();

// Define allowed roles for each route
const routePermissions: Record<string, UserRole[]> = {
  dashboard: ["admin_taller", "aseguradora", "super_admin"],
  kanban: ["admin_taller", "super_admin"],
  talleres: ["aseguradora", "super_admin"],
  equipo: ["taller", "admin_taller", "super_admin"],
  ordenes: ["taller", "admin_taller", "super_admin"],
  vehiculos: ["taller", "admin_taller", "aseguradora", "super_admin"],
  flotas: ["taller", "admin_taller", "super_admin"],
  cotizaciones: ["taller", "admin_taller", "aseguradora", "super_admin"],
  facturacion: ["taller", "admin_taller", "aseguradora", "super_admin"],
  mensajes: ["aseguradora", "super_admin"],
  reparaciones: ["aseguradora", "super_admin"],
  siniestros: ["aseguradora", "super_admin"],
  citas: ["taller", "admin_taller", "super_admin"],
  inventario: ["taller", "admin_taller", "super_admin"],
  tecnicos: ["taller", "admin_taller", "super_admin"],
  clientes: ["admin_taller", "super_admin"],
  reportes: ["taller", "admin_taller", "aseguradora", "super_admin"],
  accesos: ["admin_taller", "super_admin"],
  configuraciones: ["admin_taller", "super_admin"],
};

const ProtectedRoutes = () => {
  const { role } = useUserRole();

  return (
    <Route path="/" element={<DashboardLayout />}>
      <Route path="dashboard" element={
        <RoleProtectedRoute allowedRoles={routePermissions.dashboard} userRole={role}>
          <Dashboard />
        </RoleProtectedRoute>
      } />
      <Route path="kanban" element={
        <RoleProtectedRoute allowedRoles={routePermissions.kanban} userRole={role}>
          <Kanban />
        </RoleProtectedRoute>
      } />
      <Route path="talleres" element={
        <RoleProtectedRoute allowedRoles={routePermissions.talleres} userRole={role}>
          <Talleres />
        </RoleProtectedRoute>
      } />
      <Route path="equipo" element={
        <RoleProtectedRoute allowedRoles={routePermissions.equipo} userRole={role}>
          <Equipo />
        </RoleProtectedRoute>
      } />
      <Route path="ordenes" element={
        <RoleProtectedRoute allowedRoles={routePermissions.ordenes} userRole={role}>
          <Ordenes />
        </RoleProtectedRoute>
      } />
      <Route path="vehiculos" element={
        <RoleProtectedRoute allowedRoles={routePermissions.vehiculos} userRole={role}>
          <Vehiculos />
        </RoleProtectedRoute>
      } />
      <Route path="flotas" element={
        <RoleProtectedRoute allowedRoles={routePermissions.flotas} userRole={role}>
          <Flotas />
        </RoleProtectedRoute>
      } />
      <Route path="cotizaciones" element={
        <RoleProtectedRoute allowedRoles={routePermissions.cotizaciones} userRole={role}>
          <Cotizaciones />
        </RoleProtectedRoute>
      } />
      <Route path="facturacion" element={
        <RoleProtectedRoute allowedRoles={routePermissions.facturacion} userRole={role}>
          <Facturacion />
        </RoleProtectedRoute>
      } />
      <Route path="mensajes" element={
        <RoleProtectedRoute allowedRoles={routePermissions.mensajes} userRole={role}>
          <Mensajes />
        </RoleProtectedRoute>
      } />
      <Route path="reparaciones" element={
        <RoleProtectedRoute allowedRoles={routePermissions.reparaciones} userRole={role}>
          <Reparaciones />
        </RoleProtectedRoute>
      } />
      <Route path="siniestros" element={
        <RoleProtectedRoute allowedRoles={routePermissions.siniestros} userRole={role}>
          <Siniestros />
        </RoleProtectedRoute>
      } />
      <Route path="citas" element={
        <RoleProtectedRoute allowedRoles={routePermissions.citas} userRole={role}>
          <Citas />
        </RoleProtectedRoute>
      } />
      <Route path="inventario" element={
        <RoleProtectedRoute allowedRoles={routePermissions.inventario} userRole={role}>
          <Inventario />
        </RoleProtectedRoute>
      } />
      <Route path="tecnicos" element={
        <RoleProtectedRoute allowedRoles={routePermissions.tecnicos} userRole={role}>
          <Tecnicos />
        </RoleProtectedRoute>
      } />
      <Route path="clientes" element={
        <RoleProtectedRoute allowedRoles={routePermissions.clientes} userRole={role}>
          <Clientes />
        </RoleProtectedRoute>
      } />
      <Route path="reportes" element={
        <RoleProtectedRoute allowedRoles={routePermissions.reportes} userRole={role}>
          <Reportes />
        </RoleProtectedRoute>
      } />
      <Route path="accesos" element={
        <RoleProtectedRoute allowedRoles={routePermissions.accesos} userRole={role}>
          <Accesos />
        </RoleProtectedRoute>
      } />
      <Route path="configuraciones" element={
        <RoleProtectedRoute allowedRoles={routePermissions.configuraciones} userRole={role}>
          <Configuraciones />
        </RoleProtectedRoute>
      } />
    </Route>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <ProtectedRoutes />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
