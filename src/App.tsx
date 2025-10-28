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

const queryClient = new QueryClient();

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
            <Route path="/" element={<DashboardLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="kanban" element={<Kanban />} />
              <Route path="talleres" element={<Talleres />} />
              <Route path="equipo" element={<Equipo />} />
              <Route path="ordenes" element={<Ordenes />} />
              <Route path="vehiculos" element={<Vehiculos />} />
              <Route path="flotas" element={<Flotas />} />
              <Route path="cotizaciones" element={<Cotizaciones />} />
              <Route path="facturacion" element={<Facturacion />} />
              <Route path="mensajes" element={<Mensajes />} />
              <Route path="reparaciones" element={<Reparaciones />} />
              <Route path="siniestros" element={<Siniestros />} />
              <Route path="citas" element={<Citas />} />
              <Route path="inventario" element={<Inventario />} />
              <Route path="tecnicos" element={<Tecnicos />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="accesos" element={<Accesos />} />
              <Route path="configuraciones" element={<Configuraciones />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
