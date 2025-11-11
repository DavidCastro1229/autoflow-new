import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface TrialStatus {
  estado_suscripcion: "prueba" | "activo" | "expirado";
  fecha_inicio_prueba: string | null;
  fecha_fin_prueba: string | null;
  dias_restantes: number | null;
}

export const useTrialStatus = () => {
  const { tallerId, role } = useUserRole();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialStatus = async () => {
      // Solo aplica para roles de taller
      if (!tallerId || role === "super_admin" || role === "aseguradora") {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("talleres" as any)
        .select("estado_suscripcion, fecha_inicio_prueba, fecha_fin_prueba")
        .eq("id", tallerId)
        .single() as any;

      if (error) {
        console.error("Error fetching trial status:", error);
        setLoading(false);
        return;
      }

      let diasRestantes = null;
      let estadoActual = data.estado_suscripcion;

      if (data.fecha_fin_prueba && data.estado_suscripcion === "prueba") {
        const fechaFin = new Date(data.fecha_fin_prueba);
        const hoy = new Date();
        const diferencia = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        diasRestantes = Math.max(0, diferencia);

        // Si el trial ha expirado, actualizar el estado en la base de datos
        if (diasRestantes === 0 && hoy > fechaFin) {
          estadoActual = "expirado";
          
          // Actualizar en la base de datos
          await supabase
            .from("talleres" as any)
            .update({ estado_suscripcion: "expirado" } as any)
            .eq("id", tallerId);
        }
      }

      setTrialStatus({
        ...data,
        estado_suscripcion: estadoActual,
        dias_restantes: diasRestantes,
      });
      setLoading(false);
    };

    fetchTrialStatus();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel("trial-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "talleres",
          filter: `id=eq.${tallerId}`,
        },
        () => {
          fetchTrialStatus();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [tallerId, role]);

  return { trialStatus, loading };
};
