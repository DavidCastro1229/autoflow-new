import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);

    if (!userData.user) {
      throw new Error("No autorizado");
    }

    // Verificar que el usuario tenga un rol permitido
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role, taller_id")
      .eq("user_id", userData.user.id)
      .single();

    if (!userRole || (userRole.role !== "admin_taller" && userRole.role !== "super_admin")) {
      throw new Error("No tienes permisos para actualizar técnicos");
    }

    const requestBody = await req.json();
    const { 
      tecnico_id,
      nombre, 
      apellido, 
      area,
      especialidad_id,
      experiencia,
      telefono,
      direccion,
      habilidades,
      certificaciones,
      email,
      genero,
      documento_identidad,
      rtn,
      fecha_contratacion,
      fecha_nacimiento,
      estado,
      frecuencia_pago,
      salario
    } = requestBody;

    if (!tecnico_id) {
      throw new Error("ID del técnico es requerido");
    }

    // Verificar que el técnico pertenece al taller del usuario (si no es super admin)
    if (userRole.role === "admin_taller") {
      const { data: tecnico } = await supabaseAdmin
        .from("tecnicos")
        .select("taller_id")
        .eq("id", tecnico_id)
        .single();

      if (!tecnico || tecnico.taller_id !== userRole.taller_id) {
        throw new Error("No tienes permisos para actualizar este técnico");
      }
    }

    // Actualizar técnico
    const { data: updatedTecnico, error: updateError } = await supabaseAdmin
      .from("tecnicos")
      .update({
        nombre,
        apellido,
        area,
        especialidad_id: parseInt(especialidad_id),
        experiencia,
        telefono,
        direccion,
        habilidades,
        certificaciones,
        email,
        genero,
        documento_identidad,
        rtn,
        fecha_contratacion,
        fecha_nacimiento,
        estado,
        frecuencia_pago,
        salario: parseFloat(salario),
      })
      .eq("id", tecnico_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        tecnico: updatedTecnico,
        message: "Técnico actualizado exitosamente" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
