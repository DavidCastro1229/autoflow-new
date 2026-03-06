import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Truck, AlertTriangle, Wrench, FileText, Users, Shield, Clock,
  TrendingUp, TrendingDown, RefreshCw, Car, CircleDot, Activity,
  Loader2, DollarSign, CalendarDays, Eye,
} from "lucide-react";

const DONUT_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

interface FlotaVehiculo {
  id: string;
  numero_unidad: string;
  marca_modelo: string;
  numero_placa: string;
  kilometraje_actual: number;
  estado_vehiculo: string;
  fecha_ultimo_mantenimiento: string | null;
  proximo_mantenimiento_programado: string | null;
  fecha_vencimiento_circulacion: string | null;
  fecha_vencimiento_explotacion: string | null;
  fecha_vencimiento_especiales: string | null;
}

interface Conductor {
  id: string;
  nombre: string;
  apellido: string;
  vehiculo_asignado_actual: string | null;
  calificacion_desempeno: number | null;
  observaciones_desempeno: string | null;
}

export default function FlotaDashboard() {
  const { flotaId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState<FlotaVehiculo[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [flotaData, setFlotaData] = useState<any>(null);
  const [tallerSolicitudes, setTallerSolicitudes] = useState<any[]>([]);

  // Filters
  const [filtroVehiculo, setFiltroVehiculo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const fetchData = async () => {
    if (!flotaId) return;
    setLoading(true);
    try {
      const [vehRes, condRes, flotaRes, solRes] = await Promise.all([
        supabase.from("flota_vehiculos").select("*").eq("flota_id", flotaId),
        supabase.from("flota_conductores").select("*").eq("flota_id", flotaId),
        supabase.from("flotas").select("*").eq("id", flotaId).maybeSingle(),
        supabase.from("flota_taller_solicitudes").select("*, talleres:taller_id(nombre_taller)").eq("flota_id", flotaId).eq("status", "aprobado"),
      ]);

      setVehiculos(vehRes.data || []);
      setConductores(condRes.data || []);
      setFlotaData(flotaRes.data);
      setTallerSolicitudes(solRes.data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [flotaId]);

  // ── KPIs ──
  const totalVehiculos = vehiculos.length;
  const operativos = vehiculos.filter(v => v.estado_vehiculo === "operativo").length;
  const enTaller = vehiculos.filter(v => v.estado_vehiculo === "en_taller").length;
  const enMantenimiento = vehiculos.filter(v => v.estado_vehiculo === "en_mantenimiento").length;
  const accidentados = vehiculos.filter(v => v.estado_vehiculo === "accidentado").length;
  const fueraServicio = enTaller + enMantenimiento + accidentados;
  const disponibilidad = totalVehiculos > 0 ? ((operativos / totalVehiculos) * 100) : 0;

  // ── Donut data ──
  const donutData = [
    { name: "Operativos", value: operativos, color: DONUT_COLORS[0] },
    { name: "En Taller", value: enTaller, color: DONUT_COLORS[1] },
    { name: "En Mantenimiento", value: enMantenimiento, color: DONUT_COLORS[2] },
    { name: "Accidentados", value: accidentados, color: DONUT_COLORS[3] },
  ];

  // ── Document semaphore ──
  const getDocStatus = (fecha: string | null) => {
    if (!fecha) return "none";
    const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) return "red";
    if (dias <= 30) return "yellow";
    return "green";
  };

  const docStats = useMemo(() => {
    let green = 0, yellow = 0, red = 0;
    vehiculos.forEach(v => {
      [v.fecha_vencimiento_circulacion, v.fecha_vencimiento_explotacion, v.fecha_vencimiento_especiales].forEach(f => {
        const s = getDocStatus(f);
        if (s === "green") green++;
        else if (s === "yellow") yellow++;
        else if (s === "red") red++;
      });
    });
    const total = green + yellow + red;
    return { green, yellow, red, total };
  }, [vehiculos]);

  // ── Maintenance ──
  const vehiculosMantenimiento = vehiculos.filter(v => v.fecha_ultimo_mantenimiento).map(v => {
    const lastMaint = v.fecha_ultimo_mantenimiento ? new Date(v.fecha_ultimo_mantenimiento) : null;
    const nextMaint = v.proximo_mantenimiento_programado ? new Date(v.proximo_mantenimiento_programado) : null;
    return { ...v, lastMaint, nextMaint };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Panel de control de flota</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* Panel 1: Filtros */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">Filtrar por:</div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="operativo">Operativo</SelectItem>
                <SelectItem value="en_taller">En Taller</SelectItem>
                <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                <SelectItem value="accidentado">Accidentado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroVehiculo} onValueChange={setFiltroVehiculo}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Vehículo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los vehículos</SelectItem>
                {vehiculos.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.numero_unidad} - {v.marca_modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Panel 2: KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Vehículos" value={totalVehiculos} icon={<Truck className="h-5 w-5" />} />
        <KPICard title="Vehículos Operativos" value={operativos} icon={<Car className="h-5 w-5" />} accent="text-emerald-500" />
        <KPICard title="Fuera de Servicio" value={fueraServicio} icon={<AlertTriangle className="h-5 w-5" />} accent="text-amber-500"
          subtitle={`${enTaller} Taller · ${enMantenimiento} Mant.`} />
        <KPICard title="Disponibilidad" value={`${disponibilidad.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />}
          accent={disponibilidad >= 80 ? "text-emerald-500" : "text-red-500"} />
      </div>

      {/* Row: Disponibilidad + Costos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 3: Disponibilidad Operativa */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Disponibilidad Operativa</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData.filter(d => d.value > 0)} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {donutData.filter(d => d.value > 0).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{disponibilidad.toFixed(0)}%</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel 4: Costos y Rentabilidad */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Costos y Rentabilidad</CardTitle></CardHeader>
          <CardContent>
            {vehiculos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Sin datos de vehículos</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">KM Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiculos.slice(0, 5).map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.numero_unidad}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEstadoClass(v.estado_vehiculo)}>
                          {formatEstado(v.estado_vehiculo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{v.kilometraje_actual.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row: Mantenimiento + Documentos + Siniestros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 5: Control de Mantenimiento */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Control de Mantenimiento</CardTitle></CardHeader>
          <CardContent>
            {vehiculosMantenimiento.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sin datos de mantenimiento</p>
            ) : (
              <div className="space-y-3">
                {vehiculosMantenimiento.slice(0, 4).map(v => {
                  const nextDays = v.nextMaint ? Math.ceil((v.nextMaint.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <div key={v.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{v.numero_unidad}</p>
                        <p className="text-xs text-muted-foreground">
                          Últ: {v.lastMaint ? v.lastMaint.toLocaleDateString("es-MX") : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{v.kilometraje_actual.toLocaleString()} km</p>
                        {nextDays !== null && (
                          <Badge variant="outline" className={nextDays <= 0 ? "bg-red-500/10 text-red-500" : nextDays <= 15 ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"}>
                            {nextDays <= 0 ? "Vencido" : `${nextDays}d`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 6: Control de Documentos */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Control de Documentación</CardTitle></CardHeader>
          <CardContent>
            {docStats.total === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sin documentos registrados</p>
            ) : (
              <div className="space-y-4">
                {/* Semaphore bars */}
                <div className="flex gap-1 h-6 rounded-full overflow-hidden">
                  {docStats.green > 0 && <div className="bg-emerald-500" style={{ flex: docStats.green }} />}
                  {docStats.yellow > 0 && <div className="bg-yellow-500" style={{ flex: docStats.yellow }} />}
                  {docStats.red > 0 && <div className="bg-red-500" style={{ flex: docStats.red }} />}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-500">{docStats.green}</p>
                    <p className="text-xs text-muted-foreground">Vigente</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-500">{docStats.yellow}</p>
                    <p className="text-xs text-muted-foreground">1-30 días</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{docStats.red}</p>
                    <p className="text-xs text-muted-foreground">Vencido</p>
                  </div>
                </div>
                {/* List vehicles with expired docs */}
                <div className="space-y-2 pt-2">
                  {vehiculos.filter(v => {
                    return [v.fecha_vencimiento_circulacion, v.fecha_vencimiento_explotacion, v.fecha_vencimiento_especiales]
                      .some(f => getDocStatus(f) === "red" || getDocStatus(f) === "yellow");
                  }).slice(0, 3).map(v => (
                    <div key={v.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{v.numero_unidad}</span>
                      <div className="flex gap-1">
                        <DocDot status={getDocStatus(v.fecha_vencimiento_circulacion)} label="Circ" />
                        <DocDot status={getDocStatus(v.fecha_vencimiento_explotacion)} label="Expl" />
                        <DocDot status={getDocStatus(v.fecha_vencimiento_especiales)} label="Esp" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 7: Control de Siniestros */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Control de Siniestros</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{accidentados}</p>
                  <p className="text-xs text-muted-foreground">Accidentados</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-500">{accidentados > 0 ? "Abiertos" : "—"}</p>
                  <p className="text-xs text-muted-foreground">Estado</p>
                </div>
              </div>
              {vehiculos.filter(v => v.estado_vehiculo === "accidentado").length > 0 ? (
                <div className="space-y-2">
                  {vehiculos.filter(v => v.estado_vehiculo === "accidentado").slice(0, 3).map(v => (
                    <div key={v.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <span className="font-medium">{v.numero_unidad}</span>
                      <Badge variant="outline" className="bg-red-500/10 text-red-500">Accidentado</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-2">Sin siniestros activos 🎉</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row: Relación Taller + Conductores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 8: Relación con Taller */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Relación con Taller</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{enTaller}</p>
                  <p className="text-xs text-muted-foreground">Vehículos en Taller</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{tallerSolicitudes.length}</p>
                  <p className="text-xs text-muted-foreground">Talleres Asociados</p>
                </div>
              </div>
              {tallerSolicitudes.length > 0 ? (
                <div className="space-y-2">
                  {tallerSolicitudes.map((sol: any) => (
                    <div key={sol.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <span className="font-medium">{(sol.talleres as any)?.nombre_taller || "Taller"}</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">Activo</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-2">Sin talleres asociados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel 9: Conductores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Conductores</CardTitle>
              <span className="text-sm text-muted-foreground">{conductores.length} total</span>
            </div>
          </CardHeader>
          <CardContent>
            {conductores.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sin conductores registrados</p>
            ) : (
              <div className="space-y-3">
                {conductores.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {c.nombre[0]}{c.apellido[0]}
                      </div>
                      <div>
                        <p className="font-medium">{c.nombre} {c.apellido}</p>
                        <p className="text-xs text-muted-foreground">{c.vehiculo_asignado_actual || "Sin vehículo"}</p>
                      </div>
                    </div>
                    {c.calificacion_desempeno !== null && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">⭐</span>
                        <span className="text-sm font-medium">{c.calificacion_desempeno}</span>
                      </div>
                    )}
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

// ── Helper Components ──

function KPICard({ title, value, icon, accent, subtitle }: {
  title: string; value: string | number; icon: React.ReactNode; accent?: string; subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <p className={`text-3xl font-bold ${accent || ""}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function DocDot({ status, label }: { status: string; label: string }) {
  const colorClass = status === "red" ? "bg-red-500" : status === "yellow" ? "bg-yellow-500" : status === "green" ? "bg-emerald-500" : "bg-muted";
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function getEstadoClass(estado: string) {
  switch (estado) {
    case "operativo": return "bg-emerald-500/10 text-emerald-500";
    case "en_taller": return "bg-amber-500/10 text-amber-500";
    case "en_mantenimiento": return "bg-blue-500/10 text-blue-500";
    case "accidentado": return "bg-red-500/10 text-red-500";
    default: return "";
  }
}

function formatEstado(estado: string) {
  switch (estado) {
    case "operativo": return "Operativo";
    case "en_taller": return "En Taller";
    case "en_mantenimiento": return "En Mant.";
    case "accidentado": return "Accidentado";
    default: return estado;
  }
}
