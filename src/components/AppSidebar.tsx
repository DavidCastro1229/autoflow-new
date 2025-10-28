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
  Shield, 
  Settings 
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

const menuItems: MenuItem[] = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: LayoutDashboard, 
    allowedRoles: ["admin_taller", "super_admin"] 
  },
  { 
    title: "Kanban", 
    url: "/kanban", 
    icon: KanbanSquare, 
    allowedRoles: ["admin_taller", "super_admin"] 
  },
  { 
    title: "Equipo", 
    url: "/equipo", 
    icon: Users, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Órdenes", 
    url: "/ordenes", 
    icon: ClipboardList, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Vehículos", 
    url: "/vehiculos", 
    icon: Car, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Flotas", 
    url: "/flotas", 
    icon: Truck, 
    allowedRoles: ["taller", "admin_taller", "aseguradora", "super_admin"] 
  },
  { 
    title: "Cotizaciones", 
    url: "/cotizaciones", 
    icon: FileText, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Facturación", 
    url: "/facturacion", 
    icon: Receipt, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Citas", 
    url: "/citas", 
    icon: Calendar, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Inventario", 
    url: "/inventario", 
    icon: Package, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Técnicos", 
    url: "/tecnicos", 
    icon: Wrench, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Gestión de Clientes", 
    url: "/clientes", 
    icon: UserCog, 
    allowedRoles: ["admin_taller", "super_admin"] 
  },
  { 
    title: "Reportes", 
    url: "/reportes", 
    icon: BarChart3, 
    allowedRoles: ["taller", "admin_taller", "super_admin"] 
  },
  { 
    title: "Gestión de Accesos", 
    url: "/accesos", 
    icon: Shield, 
    allowedRoles: ["admin_taller", "super_admin"] 
  },
  { 
    title: "Configuraciones", 
    url: "/configuraciones", 
    icon: Settings, 
    allowedRoles: ["admin_taller", "super_admin"] 
  },
];

interface AppSidebarProps {
  userRole: UserRole | null;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const filteredItems = menuItems.filter(item => 
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
