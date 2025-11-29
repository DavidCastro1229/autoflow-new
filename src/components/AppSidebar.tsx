import { 
  LayoutDashboard, 
  KanbanSquare, 
  Users, 
  ClipboardList, 
  Car, 
  Truck, 
  FileText, 
  Receipt, 
  Calendar, 
  Package, 
  Wrench, 
  UserCog, 
  BarChart3, 
  Shield as ShieldIcon, 
  Settings,
  Building2,
  MessageSquare,
  WrenchIcon,
  AlertTriangle,
  FileCheck,
  Briefcase,
  PackageSearch
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserRole } from "@/hooks/useUserRole";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  allowedRoles: UserRole[];
}

// Módulos específicos para Super Admin
const superAdminMenuItems: MenuItem[] = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: LayoutDashboard, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Usuarios", 
    url: "/usuarios", 
    icon: Users, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Solicitudes de Talleres", 
    url: "/solicitudes", 
    icon: FileCheck, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Aseguradoras", 
    url: "/aseguradoras", 
    icon: ShieldIcon, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Clientes", 
    url: "/clientes", 
    icon: UserCog, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Vehículos", 
    url: "/vehiculos", 
    icon: Car, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Cotizaciones", 
    url: "/cotizaciones", 
    icon: FileText, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Reportes", 
    url: "/reportes", 
    icon: BarChart3, 
    allowedRoles: ["super_admin"] 
  },
  { 
    title: "Configuración", 
    url: "/configuraciones", 
    icon: Settings, 
    allowedRoles: ["super_admin"] 
  },
];

// Módulos para otros roles
const menuItems: MenuItem[] = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: LayoutDashboard, 
    allowedRoles: ["admin_taller", "aseguradora"] 
  },
  { 
    title: "Kanban", 
    url: "/kanban", 
    icon: KanbanSquare, 
    allowedRoles: ["admin_taller"] 
  },
  { 
    title: "Talleres", 
    url: "/talleres", 
    icon: Building2, 
    allowedRoles: ["aseguradora"] 
  },
  { 
    title: "Equipo Administrativo", 
    url: "/equipo", 
    icon: Briefcase, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Equipo Técnico", 
    url: "/tecnicos", 
    icon: Wrench, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Órdenes", 
    url: "/ordenes", 
    icon: ClipboardList, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Vehículos", 
    url: "/vehiculos", 
    icon: Car, 
    allowedRoles: ["taller", "admin_taller", "aseguradora"] 
  },
  { 
    title: "Flotas", 
    url: "/flotas", 
    icon: Truck, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Cotizaciones", 
    url: "/cotizaciones", 
    icon: FileText, 
    allowedRoles: ["taller", "admin_taller", "aseguradora"] 
  },
  { 
    title: "Facturación", 
    url: "/facturacion", 
    icon: Receipt, 
    allowedRoles: ["taller", "admin_taller", "aseguradora"] 
  },
  { 
    title: "Aseguradoras", 
    url: "/aseguradoras", 
    icon: Building2, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Mensajes", 
    url: "/mensajes", 
    icon: MessageSquare, 
    allowedRoles: ["aseguradora", "taller", "admin_taller"] 
  },
  { 
    title: "Solicitudes Afiliación", 
    url: "/solicitudes-afiliacion", 
    icon: FileCheck, 
    allowedRoles: ["aseguradora"] 
  },
  { 
    title: "Reparaciones", 
    url: "/reparaciones", 
    icon: WrenchIcon, 
    allowedRoles: ["aseguradora"] 
  },
  { 
    title: "Siniestros", 
    url: "/siniestros", 
    icon: AlertTriangle, 
    allowedRoles: ["aseguradora"] 
  },
  { 
    title: "Citas", 
    url: "/citas", 
    icon: Calendar, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Inventario", 
    url: "/inventario", 
    icon: Package, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Servicios", 
    url: "/servicios", 
    icon: Briefcase, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Paquetes", 
    url: "/paquetes", 
    icon: PackageSearch, 
    allowedRoles: ["taller", "admin_taller"] 
  },
  { 
    title: "Gestión de Clientes",
    url: "/clientes", 
    icon: UserCog, 
    allowedRoles: ["admin_taller"] 
  },
  { 
    title: "Reportes", 
    url: "/reportes", 
    icon: BarChart3, 
    allowedRoles: ["taller", "admin_taller", "aseguradora"] 
  },
  { 
    title: "Gestión de Accesos", 
    url: "/accesos", 
    icon: ShieldIcon, 
    allowedRoles: ["admin_taller"] 
  },
  { 
    title: "Configuraciones", 
    url: "/configuraciones", 
    icon: Settings, 
    allowedRoles: ["admin_taller"] 
  },
  { 
    title: "Configuraciones", 
    url: "/configuraciones-aseguradora", 
    icon: Settings, 
    allowedRoles: ["aseguradora"] 
  },
];

interface AppSidebarProps {
  userRole: UserRole | null;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  // Si es super_admin, usar su menú específico
  const itemsToUse = userRole === "super_admin" ? superAdminMenuItems : menuItems;
  
  const filteredItems = itemsToUse.filter(item => 
    userRole && item.allowedRoles.includes(userRole)
  );

  return (
    <Sidebar collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AutoFlowX
          </h2>
        )}
        <SidebarTrigger />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-accent text-accent-foreground font-medium" 
                          : "hover:bg-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
