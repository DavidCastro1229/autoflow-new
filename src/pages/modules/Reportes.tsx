import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  Filter,
} from "lucide-react";

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
];

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down";
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-danger" />
            )}
            <span className={trend === "up" ? "text-success" : "text-danger"}>
              {Math.abs(change)}%
            </span>
            <span>vs mes anterior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const { toast } = useToast();

  // Metrics state
  const [metrics, setMetrics] = useState({
    totalIngresos: 0,
    totalOrdenes: 0,
    totalClientes: 0,
    totalTecnicos: 0,
    ordenesCompletadas: 0,
    ordenesPendientes: 0,
    inventarioBajo: 0,
    citasPendientes: 0,
  });

  // Charts data state
  const [ordenesEstado, setOrdenesEstado] = useState<any[]>([]);
  const [ingresosMensuales, setIngresosMensuales] = useState<any[]>([]);
  const [tecnicosRendimiento, setTecnicosRendimiento] = useState<any[]>([]);
  const [productosPopulares, setProductosPopulares] = useState<any[]>([]);
  const [facturacionEstado, setFacturacionEstado] = useState<any[]>([]);
  const [clientesFrecuentes, setClientesFrecuentes] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [dateFrom, dateTo]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchOrdenesEstado(),
        fetchIngresosMensuales(),
        fetchTecnicosRendimiento(),
        fetchProductosPopulares(),
        fetchFacturacionEstado(),
        fetchClientesFrecuentes(),
      ]);
    } catch (error: any) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Total ingresos from facturas
      const { data: facturas } = await supabase
        .from("facturas")
        .select("total")
        .gte("fecha_emision", dateFrom)
        .lte("fecha_emision", dateTo);

      const totalIngresos = facturas?.reduce((sum, f) => sum + Number(f.total), 0) || 0;

      // Total ordenes
      const { count: totalOrdenes } = await supabase
        .from("ordenes")
        .select("*", { count: "exact", head: true })
        .gte("fecha_ingreso", dateFrom)
        .lte("fecha_ingreso", dateTo);

      // Ordenes completadas
      const { count: ordenesCompletadas } = await supabase
        .from("ordenes")
        .select("*", { count: "exact", head: true })
        .eq("estado", "finalizada")
        .gte("fecha_ingreso", dateFrom)
        .lte("fecha_ingreso", dateTo);

      // Ordenes pendientes
      const { count: ordenesPendientes } = await supabase
        .from("ordenes")
        .select("*", { count: "exact", head: true })
        .in("estado", ["recepcion", "autorizado", "en_proceso"]);

      // Total clientes
      const { count: totalClientes } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true });

      // Total tecnicos
      const { count: totalTecnicos } = await supabase
        .from("tecnicos")
        .select("*", { count: "exact", head: true });

      // Inventario bajo
      const { count: inventarioBajo } = await supabase
        .from("inventario")
        .select("*", { count: "exact", head: true })
        .filter("stock_actual", "lte", "stock_minimo");

      // Citas pendientes
      const { count: citasPendientes } = await supabase
        .from("citas")
        .select("*", { count: "exact", head: true })
        .eq("estado", "programada");

      setMetrics({
        totalIngresos,
        totalOrdenes: totalOrdenes || 0,
        totalClientes: totalClientes || 0,
        totalTecnicos: totalTecnicos || 0,
        ordenesCompletadas: ordenesCompletadas || 0,
        ordenesPendientes: ordenesPendientes || 0,
        inventarioBajo: inventarioBajo || 0,
        citasPendientes: citasPendientes || 0,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const fetchOrdenesEstado = async () => {
    try {
      const { data } = await supabase
        .from("ordenes")
        .select("estado")
        .gte("fecha_ingreso", dateFrom)
        .lte("fecha_ingreso", dateTo);

      const estadoCounts = data?.reduce((acc: any, orden) => {
        acc[orden.estado] = (acc[orden.estado] || 0) + 1;
        return acc;
      }, {});

      const estadoLabels: Record<string, string> = {
        recepcion: "Recepción",
        autorizado: "Autorizado",
        en_proceso: "En Proceso",
        finalizada: "Finalizada",
        cancelada: "Cancelada",
      };

      const chartData = Object.entries(estadoCounts || {}).map(([estado, count]) => ({
        name: estadoLabels[estado] || estado,
        value: count,
      }));

      setOrdenesEstado(chartData);
    } catch (error) {
      console.error("Error fetching ordenes estado:", error);
    }
  };

  const fetchIngresosMensuales = async () => {
    try {
      const { data } = await supabase
        .from("facturas")
        .select("fecha_emision, total")
        .gte("fecha_emision", dateFrom)
        .lte("fecha_emision", dateTo)
        .order("fecha_emision");

      const monthlyData = data?.reduce((acc: any, factura) => {
        const month = new Date(factura.fecha_emision).toLocaleDateString("es", {
          month: "short",
        });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += Number(factura.total);
        return acc;
      }, {});

      const chartData = Object.entries(monthlyData || {}).map(([month, total]) => ({
        mes: month,
        ingresos: total,
      }));

      setIngresosMensuales(chartData);
    } catch (error) {
      console.error("Error fetching ingresos mensuales:", error);
    }
  };

  const fetchTecnicosRendimiento = async () => {
    try {
      const { data } = await supabase
        .from("ordenes")
        .select(`
          tecnico_id,
          estado,
          tecnicos (
            nombre,
            apellido
          )
        `)
        .gte("fecha_ingreso", dateFrom)
        .lte("fecha_ingreso", dateTo);

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
          nombre: stat.nombre,
          total: stat.total,
          completadas: stat.completadas,
        }))
        .slice(0, 5);

      setTecnicosRendimiento(chartData);
    } catch (error) {
      console.error("Error fetching tecnicos rendimiento:", error);
    }
  };

  const fetchProductosPopulares = async () => {
    try {
      const { data } = await supabase
        .from("inventario")
        .select("nombre, stock_actual, stock_minimo")
        .order("stock_actual", { ascending: false })
        .limit(5);

      setProductosPopulares(data || []);
    } catch (error) {
      console.error("Error fetching productos populares:", error);
    }
  };

  const fetchFacturacionEstado = async () => {
    try {
      const { data } = await supabase
        .from("facturas")
        .select("estado")
        .gte("fecha_emision", dateFrom)
        .lte("fecha_emision", dateTo);

      const estadoCounts = data?.reduce((acc: any, factura) => {
        acc[factura.estado] = (acc[factura.estado] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(estadoCounts || {}).map(([estado, count]) => ({
        name: estado.charAt(0).toUpperCase() + estado.slice(1),
        value: count,
      }));

      setFacturacionEstado(chartData);
    } catch (error) {
      console.error("Error fetching facturacion estado:", error);
    }
  };

  const fetchClientesFrecuentes = async () => {
    try {
      const { data } = await supabase
        .from("ordenes")
        .select(`
          cliente_id,
          clientes (
            nombre,
            apellido
          )
        `)
        .gte("fecha_ingreso", dateFrom)
        .lte("fecha_ingreso", dateTo);

      const clienteCounts = data?.reduce((acc: any, orden: any) => {
        const clienteKey = orden.cliente_id;
        if (!acc[clienteKey]) {
          acc[clienteKey] = {
            nombre: `${orden.clientes?.nombre} ${orden.clientes?.apellido}`,
            ordenes: 0,
          };
        }
        acc[clienteKey].ordenes += 1;
        return acc;
      }, {});

      const chartData = Object.values(clienteCounts || {})
        .sort((a: any, b: any) => b.ordenes - a.ordenes)
        .slice(0, 5);

      setClientesFrecuentes(chartData as any);
    } catch (error) {
      console.error("Error fetching clientes frecuentes:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Análisis</h1>
          <p className="text-muted-foreground">Dashboard con métricas y análisis del taller</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={fetchReportData} disabled={loading}>
              {loading ? "Cargando..." : "Aplicar Filtros"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Ingresos Totales"
                value={formatCurrency(metrics.totalIngresos)}
                icon={<DollarSign className="h-4 w-4" />}
                change={12.5}
                trend="up"
              />
              <MetricCard
                title="Órdenes Completadas"
                value={metrics.ordenesCompletadas}
                icon={<FileText className="h-4 w-4" />}
                change={8.2}
                trend="up"
              />
              <MetricCard
                title="Total Clientes"
                value={metrics.totalClientes}
                icon={<Users className="h-4 w-4" />}
                change={5.4}
                trend="up"
              />
              <MetricCard
                title="Técnicos Activos"
                value={metrics.totalTecnicos}
                icon={<Wrench className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Órdenes</CardTitle>
                  <CardDescription>Distribución por estado</CardDescription>
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
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ingresos Mensuales</CardTitle>
                  <CardDescription>Evolución de ingresos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ingresosMensuales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ingresos"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        name="Ingresos"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.ordenesPendientes}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Citas Programadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.citasPendientes}</div>
                  <p className="text-xs text-muted-foreground mt-1">Próximas citas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Inventario Bajo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{metrics.inventarioBajo}</div>
                  <p className="text-xs text-muted-foreground mt-1">Productos a reabastecer</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {metrics.totalOrdenes > 0
                      ? ((metrics.ordenesCompletadas / metrics.totalOrdenes) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Del total de órdenes</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ordenes Tab */}
          <TabsContent value="ordenes" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Órdenes</CardTitle>
                  <CardDescription>Distribución actual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ordenesEstado}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Bar dataKey="value" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clientes Frecuentes</CardTitle>
                  <CardDescription>Top 5 clientes por órdenes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clientesFrecuentes.map((cliente: any, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{cliente.nombre}</p>
                            <p className="text-sm text-muted-foreground">{cliente.ordenes} órdenes</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{index + 1}º</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Órdenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total de Órdenes</p>
                    <p className="text-2xl font-bold">{metrics.totalOrdenes}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Completadas</p>
                    <p className="text-2xl font-bold text-success">{metrics.ordenesCompletadas}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold text-warning">{metrics.ordenesPendientes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financiero Tab */}
          <TabsContent value="financiero" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Ingresos Totales"
                value={formatCurrency(metrics.totalIngresos)}
                icon={<DollarSign className="h-4 w-4" />}
                change={12.5}
                trend="up"
              />
              <MetricCard
                title="Promedio por Orden"
                value={
                  metrics.ordenesCompletadas > 0
                    ? formatCurrency(metrics.totalIngresos / metrics.ordenesCompletadas)
                    : "$0.00"
                }
                icon={<FileText className="h-4 w-4" />}
              />
              <MetricCard
                title="Total Facturas"
                value={facturacionEstado.reduce((sum, f) => sum + f.value, 0)}
                icon={<ShoppingCart className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos Mensuales</CardTitle>
                  <CardDescription>Tendencia de ingresos en el período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ingresosMensuales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ingresos"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        name="Ingresos"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado de Facturación</CardTitle>
                  <CardDescription>Distribución por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={facturacionEstado}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {facturacionEstado.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventario Tab */}
          <TabsContent value="inventario" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Productos en Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{productosPopulares.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{metrics.inventarioBajo}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren reabastecimiento</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Rotación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Alta</div>
                  <p className="text-xs text-muted-foreground mt-1">Tasa de rotación</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos en Inventario
                </CardTitle>
                <CardDescription>Top 5 productos por stock</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosPopulares.map((producto: any, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{producto.nombre}</TableCell>
                        <TableCell>{producto.stock_actual}</TableCell>
                        <TableCell>{producto.stock_minimo}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              producto.stock_actual <= producto.stock_minimo
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {producto.stock_actual <= producto.stock_minimo ? "Bajo" : "OK"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Total Técnicos"
                value={metrics.totalTecnicos}
                icon={<Wrench className="h-4 w-4" />}
              />
              <MetricCard
                title="Órdenes Completadas"
                value={metrics.ordenesCompletadas}
                icon={<FileText className="h-4 w-4" />}
              />
              <MetricCard
                title="Promedio por Técnico"
                value={
                  metrics.totalTecnicos > 0
                    ? (metrics.ordenesCompletadas / metrics.totalTecnicos).toFixed(1)
                    : "0"
                }
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Técnicos</CardTitle>
                <CardDescription>Top 5 técnicos por órdenes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={tecnicosRendimiento} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--foreground))" />
                    <YAxis dataKey="nombre" type="category" stroke="hsl(var(--foreground))" width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="total" fill={COLORS.primary} name="Total Órdenes" />
                    <Bar dataKey="completadas" fill={COLORS.success} name="Completadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
