import { useUserRole } from "@/hooks/useUserRole";
import Mensajes from "./Mensajes";
import TallerMensajes from "./TallerMensajes";
import { Loader2 } from "lucide-react";

export default function MensajesWrapper() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Aseguradoras usan el módulo Mensajes (para contactar talleres)
  if (role === "aseguradora") {
    return <Mensajes />;
  }

  // Talleres usan TallerMensajes (para recibir mensajes de aseguradoras)
  return <TallerMensajes />;
}