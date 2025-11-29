import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TallerAfiliado {
  id: string;
  nombre_taller: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  estado: string;
  email: string;
  logo_url: string | null;
  codigo_postal: string;
  nombre_contacto: string;
  apellido_contacto: string;
  descripcion: string | null;
}

export const useAseguradoraTalleres = () => {
  const [talleres, setTalleres] = useState<TallerAfiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [aseguradoraId, setAseguradoraId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTalleres = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        // Obtener el ID de la aseguradora del usuario actual
        const { data: aseguradoraData, error: aseguradoraError } = await supabase
          .from("aseguradoras")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (aseguradoraError || !aseguradoraData) {
          console.error("Error fetching aseguradora:", aseguradoraError);
          setLoading(false);
          return;
        }

        setAseguradoraId(aseguradoraData.id);

        // Obtener los talleres afiliados a esta aseguradora
        const { data: talleresData, error: talleresError } = await supabase
          .from("taller_aseguradoras")
          .select(`
            taller_id,
            talleres (
              id,
              nombre_taller,
              telefono,
              direccion,
              ciudad,
              estado,
              email,
              logo_url,
              codigo_postal,
              nombre_contacto,
              apellido_contacto,
              descripcion
            )
          `)
          .eq("aseguradora_id", aseguradoraData.id);

        if (talleresError) {
          console.error("Error fetching talleres:", talleresError);
          setLoading(false);
          return;
        }

        const talleresFormateados = talleresData
          .filter(item => item.talleres)
          .map(item => item.talleres as unknown as TallerAfiliado);

        setTalleres(talleresFormateados);
        setLoading(false);
      } catch (error) {
        console.error("Error in useAseguradoraTalleres:", error);
        setLoading(false);
      }
    };

    fetchTalleres();
  }, []);

  return { talleres, loading, aseguradoraId };
};
