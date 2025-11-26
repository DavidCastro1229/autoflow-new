import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAseguradoraTalleres } from "@/hooks/useAseguradoraTalleres";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Car, FileText, Receipt, AlertTriangle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AseguradoraDashboard() {
  const { talleres, loading: talleresLoading } = useAseguradoraTalleres();
  const [selectedTaller, setSelectedTaller] = useState<string>("todos");
  const [stats, setStats] = useState({
    totalVehiculos: 0,
    totalCotizaciones: 0,
    totalFacturas: 0,
    totalSiniestros: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (talleres.length === 0) {
        setLoading(false);
        return;
      }

      const tallerIds = selectedTaller === "todos" 
        ? talleres.map(t => t.id)
        : [selectedTaller];

      try {
        const [vehiculos, cotizaciones, facturas] = await Promise.all([
          supabase
            .from("vehiculos")
            .select("id", { count: "exact", head: true })
            .in("taller_id", tallerIds),
          supabase
            .from("cotizaciones")
            .select("id", { count: "exact", head: true })
            .in("taller_id", tallerIds),
          supabase
            .from("facturas")
            .select("id", { count: "exact", head: true })
            .in("taller_id", tallerIds)
        ]);

        setStats({
          totalVehiculos: vehiculos.count || 0,
          totalCotizaciones: cotizaciones.count || 0,
          totalFacturas: facturas.count || 0,
          totalSiniestros: 0 // Por implementar cuando exista la tabla
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }

      setLoading(false);
    };

    if (!talleresLoading) {
      fetchStats();
    }
  }, [talleres, selectedTaller, talleresLoading]);

  if (talleresLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Talleres Afiliados",
      value: talleres.length,
      icon: Building2,
      color: "text-blue-500"
    },
    {
      title: "Vehículos",
      value: stats.totalVehiculos,
      icon: Car,
      color: "text-green-500"
    },
    {
      title: "Cotizaciones",
      value: stats.totalCotizaciones,
      icon: FileText,
      color: "text-purple-500"
    },
    {
      title: "Facturas",
      value: stats.totalFacturas,
      icon: Receipt,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Aseguradora</h1>
          <p className="text-muted-foreground">Resumen general de actividades</p>
        </div>
        
        <Select value={selectedTaller} onValueChange={setSelectedTaller}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por taller" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los talleres</SelectItem>
            {talleres.map((taller) => (
              <SelectItem key={taller.id} value={taller.id}>
                {taller.nombre_taller}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Talleres Afiliados</CardTitle>
          </CardHeader>
          <CardContent>
            {talleres.length === 0 ? (
              <p className="text-muted-foreground">No hay talleres afiliados</p>
            ) : (
              <div className="space-y-2">
                {talleres.map((taller) => (
                  <div key={taller.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{taller.nombre_taller}</p>
                      <p className="text-sm text-muted-foreground">{taller.ciudad}, {taller.estado}</p>
                    </div>
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No hay actividad reciente para mostrar
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
