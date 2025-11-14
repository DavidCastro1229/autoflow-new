import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Wrench,
  FileText,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

interface DashboardStats {
  totalOrdenes: number;
  ordenesActivas: number;
  ordenesCompletadas: number;
  totalClientes: number;
  totalTecnicos: number;
  totalVehiculos: number;
  ingresosMes: number;
  citasHoy: number;
  inventarioBajo: number;
  facturasVencidas: number;
}

interface RecentActivity {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  icon: React.ReactNode;
  color: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrdenes: 0,
    ordenesActivas: 0,
    ordenesCompletadas: 0,
    totalClientes: 0,
    totalTecnicos: 0,
    totalVehiculos: 0,
    ingresosMes: 0,
    citasHoy: 0,
    inventarioBajo: 0,
    facturasVencidas: 0,
  });
  const [ordenesEstado, setOrdenesEstado] = useState<any[]>([]);
  const [ingresosSemanal, setIngresosSemanal] = useState<any[]>([]);
  const [tecnicosOrdenes, setTecnicosOrdenes] = useState<any[]>([]);
  const [ordenesRecientes, setOrdenesRecientes] = useState<any[]>([]);
  const [citasProximas, setCitasProximas] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [productosAlerta, setProductosAlerta] = useState<any[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchOrdenesEstado(),
        fetchIngresosSemanal(),
        fetchTecnicosOrdenes(),
        fetchOrdenesRecientes(),
        fetchCitasProximas(),
        fetchProductosAlerta(),
      ]);
      generateRecentActivity();
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];

      // Órdenes
      const { count: totalOrdenes } = await supabase
        .from("ordenes")
        .select("*", { count: "exact", head: true });

      const { count: ordenesActivas } = await supabase
        .from("ordenes")
        .select("*", { count: "exact", head: true })
        .in("estado", ["recepcion", "autorizado", "en_proceso"]);

      const { count: ordenesCompletadas } = await supabase
        .from("ordenes")
        .select("*", { count: "exact", head: true })
        .eq("estado", "finalizada");

      // Clientes
      const { count: totalClientes } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true });

      // Técnicos
      const { count: totalTecnicos } = await supabase
        .from("tecnicos")
        .select("*", { count: "exact", head: true });

      // Vehículos
      const { count: totalVehiculos } = await supabase
        .from("vehiculos")
        .select("*", { count: "exact", head: true });

      // Ingresos del mes
      const { data: facturas } = await supabase
        .from("facturas")
        .select("total")
        .gte("fecha_emision", firstDayMonth)
        .eq("estado", "pagada");

      const ingresosMes = facturas?.reduce((sum, f) => sum + Number(f.total), 0) || 0;

      // Citas de hoy
      const { count: citasHoy } = await supabase
        .from("citas")
        .select("*", { count: "exact", head: true })
        .eq("fecha", today)
        .eq("estado", "programada");

      // Inventario bajo
      const { data: inventario } = await supabase
        .from("inventario")
        .select("stock_actual, stock_minimo");

      const inventarioBajo = inventario?.filter(
        (item) => item.stock_actual <= item.stock_minimo
      ).length || 0;

      // Facturas vencidas
      const { count: facturasVencidas } = await supabase
        .from("facturas")
        .select("*", { count: "exact", head: true })
        .eq("estado", "vencida");

      setStats({
        totalOrdenes: totalOrdenes || 0,
        ordenesActivas: ordenesActivas || 0,
        ordenesCompletadas: ordenesCompletadas || 0,
        totalClientes: totalClientes || 0,
        totalTecnicos: totalTecnicos || 0,
        totalVehiculos: totalVehiculos || 0,
        ingresosMes,
        citasHoy: citasHoy || 0,
        inventarioBajo,
        facturasVencidas: facturasVencidas || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchOrdenesEstado = async () => {
    try {
      const { data } = await supabase.from("ordenes").select("estado");

      const estadoCounts = data?.reduce((acc: any, orden) => {
        acc[orden.estado] = (acc[orden.estado] || 0) + 1;
        return acc;
      }, {});

      const chartData = [
        { name: "Recepción", value: estadoCounts?.recepcion || 0 },
        { name: "Autorizado", value: estadoCounts?.autorizado || 0 },
        { name: "En Proceso", value: estadoCounts?.en_proceso || 0 },
        { name: "Finalizada", value: estadoCounts?.finalizada || 0 },
        { name: "Cancelada", value: estadoCounts?.cancelada || 0 },
      ];

      setOrdenesEstado(chartData);
    } catch (error) {
      console.error("Error fetching ordenes estado:", error);
    }
  };

  const fetchIngresosSemanal = async () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      const { data } = await supabase
        .from("facturas")
        .select("fecha_emision, total")
        .in("fecha_emision", last7Days)
        .eq("estado", "pagada");

      const dailyData = last7Days.map((date) => {
        const dayData = data?.filter((f) => f.fecha_emision === date) || [];
        const total = dayData.reduce((sum, f) => sum + Number(f.total), 0);
        return {
          dia: new Date(date).toLocaleDateString("es", { weekday: "short" }),
          ingresos: total,
        };
      });

      setIngresosSemanal(dailyData);
    } catch (error) {
      console.error("Error fetching ingresos semanal:", error);
    }
  };

  const fetchTecnicosOrdenes = async () => {
    try {
      const { data } = await supabase.from("ordenes").select(`
        tecnico_id,
        estado,
        tecnicos (
          nombre,
          apellido
        )
      `);

      const tecnicoStats = data?.reduce((acc: any, orden: any) => {
        const tecnicoKey = orden.tecnico_id;
        if (!acc[tecnicoKey]) {
          acc[tecnicoKey] = {
            nombre: `${orden.tecnicos?.nombre} ${orden.tecnicos?.apellido}`,
            total: 0,
            completadas: 0,
          };
        }
        acc[tecnicoKey].total += 1;
        if (orden.estado === "completada") {
          acc[tecnicoKey].completadas += 1;
        }
        return acc;
      }, {});

      const chartData = Object.values(tecnicoStats || {})
        .map((stat: any) => ({
          nombre: stat.nombre.split(" ").slice(0, 2).join(" "),
          ordenes: stat.total,
        }))
        .slice(0, 5);

      setTecnicosOrdenes(chartData);
    } catch (error) {
      console.error("Error fetching tecnicos ordenes:", error);
    }
  };

  const fetchOrdenesRecientes = async () => {
    try {
      const { data } = await supabase
        .from("ordenes")
        .select(`
          id,
          descripcion,
          estado,
          fecha_ingreso,
          clientes (
            nombre,
            apellido
          ),
          vehiculos (
            marca,
            modelo,
            placa
          )
        `)
        .order("fecha_ingreso", { ascending: false })
        .limit(5);

      setOrdenesRecientes(data as any || []);
    } catch (error) {
      console.error("Error fetching ordenes recientes:", error);
    }
  };

  const fetchCitasProximas = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("citas")
        .select(`
          id,
          fecha,
          hora_inicio,
          estado,
          clientes (
            nombre,
            apellido
          ),
          vehiculos (
            marca,
            modelo
          )
        `)
        .gte("fecha", today)
        .eq("estado", "programada")
        .order("fecha")
        .order("hora_inicio")
        .limit(5);

      setCitasProximas(data as any || []);
    } catch (error) {
      console.error("Error fetching citas proximas:", error);
    }
  };

  const fetchProductosAlerta = async () => {
    try {
      const { data } = await supabase
        .from("inventario")
        .select("nombre, stock_actual, stock_minimo");

      const productosConStockBajo = data?.filter(
        (item) => item.stock_actual <= item.stock_minimo
      ).slice(0, 5) || [];

      setProductosAlerta(productosConStockBajo);
    } catch (error) {
      console.error("Error fetching productos alerta:", error);
    }
  };

  const generateRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from("ordenes")
        .select("id, created_at, descripcion, clientes(nombre, apellido)")
        .order("created_at", { ascending: false })
        .limit(2);

      // Fetch recent clients
      const { data: recentClients } = await supabase
        .from("clientes")
        .select("id, created_at, nombre, apellido")
        .order("created_at", { ascending: false })
        .limit(2);

      // Fetch recent appointments
      const { data: recentCitas } = await supabase
        .from("citas")
        .select("id, created_at, fecha, hora_inicio, clientes(nombre, apellido)")
        .order("created_at", { ascending: false })
        .limit(2);

      // Fetch inventory with low stock
      const { data: inventario } = await supabase
        .from("inventario")
        .select("id, nombre, stock_actual, stock_minimo, updated_at")
        .order("updated_at", { ascending: false });

      const lowStockItems = inventario?.filter(
        (item) => item.stock_actual <= item.stock_minimo
      ).slice(0, 2) || [];

      // Format activities
      recentOrders?.forEach((orden: any) => {
        activities.push({
          id: `orden-${orden.id}`,
          tipo: "orden",
          descripcion: `Nueva orden: ${orden.clientes?.nombre || "Cliente"} - ${orden.descripcion?.substring(0, 30) || "Orden de trabajo"}`,
          fecha: getTimeAgo(orden.created_at),
          icon: <FileText className="h-4 w-4" />,
          color: COLORS.primary,
        });
      });

      recentClients?.forEach((cliente: any) => {
        activities.push({
          id: `cliente-${cliente.id}`,
          tipo: "cliente",
          descripcion: `Nuevo cliente registrado: ${cliente.nombre} ${cliente.apellido}`,
          fecha: getTimeAgo(cliente.created_at),
          icon: <Users className="h-4 w-4" />,
          color: COLORS.success,
        });
      });

      recentCitas?.forEach((cita: any) => {
        activities.push({
          id: `cita-${cita.id}`,
          tipo: "cita",
          descripcion: `Cita programada: ${cita.clientes?.nombre || "Cliente"} - ${new Date(cita.fecha).toLocaleDateString()}`,
          fecha: getTimeAgo(cita.created_at),
          icon: <Calendar className="h-4 w-4" />,
          color: COLORS.info,
        });
      });

      lowStockItems.forEach((producto: any) => {
        activities.push({
          id: `inventario-${producto.id}`,
          tipo: "inventario",
          descripcion: `Alerta: Stock bajo en ${producto.nombre} (${producto.stock_actual}/${producto.stock_minimo})`,
          fecha: getTimeAgo(producto.updated_at),
          icon: <AlertTriangle className="h-4 w-4" />,
          color: COLORS.warning,
        });
      });

      // Sort by most recent and limit to 6 items
      activities.sort((a, b) => {
        const timeA = a.fecha.includes("segundo") ? 1 : 
                     a.fecha.includes("minuto") ? 60 : 
                     a.fecha.includes("hora") ? 3600 : 86400;
        const timeB = b.fecha.includes("segundo") ? 1 : 
                     b.fecha.includes("minuto") ? 60 : 
                     b.fecha.includes("hora") ? 3600 : 86400;
        return timeA - timeB;
      });

      setRecentActivity(activities.slice(0, 6));
    } catch (error) {
      console.error("Error generating recent activity:", error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `Hace ${diffInSeconds} segundo${diffInSeconds !== 1 ? 's' : ''}`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      recepcion: { variant: "secondary", label: "Recepción" },
      autorizado: { variant: "default", label: "Autorizado" },
      en_proceso: { variant: "default", label: "En Proceso" },
      finalizada: { variant: "secondary", label: "Finalizada" },
      cancelada: { variant: "outline", label: "Cancelada" },
    };
    return variants[estado] || { variant: "outline", label: estado };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Vista general de tu taller automotriz</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <Activity className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Alertas Importantes */}
      {(stats.inventarioBajo > 0 || stats.facturasVencidas > 0 || stats.citasHoy > 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.citasHoy > 0 && (
            <Card className="border-l-4 border-l-info bg-info/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Citas Programadas Hoy</p>
                    <p className="text-2xl font-bold">{stats.citasHoy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.inventarioBajo > 0 && (
            <Card className="border-l-4 border-l-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Productos con Stock Bajo</p>
                    <p className="text-2xl font-bold">{stats.inventarioBajo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.facturasVencidas > 0 && (
            <Card className="border-l-4 border-l-danger bg-danger/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-danger/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-danger" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Facturas Vencidas</p>
                    <p className="text-2xl font-bold">{stats.facturasVencidas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ingresosMes)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+12.5%</span>
              <span>vs mes anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Activas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordenesActivas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalOrdenes} órdenes totales
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success">+8.2%</span>
              <span>este mes</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Técnicos Activos</CardTitle>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <Wrench className="h-5 w-5" style={{ color: COLORS.success }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTecnicos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalVehiculos} vehículos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas y Estadísticas */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Ingresos de la Última Semana
            </CardTitle>
            <CardDescription>Tendencia de ingresos diarios</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ingresosSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado de Órdenes
            </CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordenesEstado}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ordenesEstado.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[COLORS.warning, COLORS.primary, COLORS.success][index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento de Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Rendimiento de Técnicos
          </CardTitle>
          <CardDescription>Órdenes asignadas por técnico</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tecnicosOrdenes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="nombre" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ordenes" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Órdenes y Citas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Órdenes Recientes
              </CardTitle>
              <CardDescription>Últimas órdenes de trabajo</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/ordenes")}>
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {ordenesRecientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay órdenes recientes</p>
            ) : (
              <div className="space-y-4">
                {ordenesRecientes.map((orden: any) => (
                  <div key={orden.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {orden.clientes?.nombre} {orden.clientes?.apellido}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {orden.vehiculos?.marca} {orden.vehiculos?.modelo} - {orden.vehiculos?.placa}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {orden.descripcion}
                      </p>
                    </div>
                    <Badge variant={getEstadoBadge(orden.estado).variant}>
                      {getEstadoBadge(orden.estado).label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Citas
              </CardTitle>
              <CardDescription>Citas programadas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/citas")}>
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {citasProximas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay citas programadas</p>
            ) : (
              <div className="space-y-4">
                {citasProximas.map((cita: any) => (
                  <div key={cita.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {cita.clientes?.nombre} {cita.clientes?.apellido}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cita.vehiculos?.marca} {cita.vehiculos?.modelo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(cita.fecha).toLocaleDateString()} - {cita.hora_inicio}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente y Alertas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimos eventos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${activity.color}20`, color: activity.color }}
                  >
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{activity.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos con Stock Bajo
              </CardTitle>
              <CardDescription>Requieren reabastecimiento</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/inventario")}>
              Ver inventario
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {productosAlerta.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-success mb-2" />
                <p className="text-center text-muted-foreground">
                  Todos los productos tienen stock adecuado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {productosAlerta.map((producto, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{producto.nombre}</p>
                      <Badge variant="outline">
                        {producto.stock_actual}/{producto.stock_minimo}
                      </Badge>
                    </div>
                    <Progress
                      value={(producto.stock_actual / producto.stock_minimo) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
