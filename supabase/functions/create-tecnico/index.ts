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
      throw new Error("No tienes permisos para crear técnicos");
    }

    const tallerId = userRole.taller_id;
    
    if (!tallerId && userRole.role === "admin_taller") {
      throw new Error("No se encontró el taller asociado");
    }

    const requestBody = await req.json();
    const { 
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
      password,
      genero,
      documento_identidad,
      rtn,
      fecha_contratacion,
      fecha_nacimiento,
      estado,
      frecuencia_pago,
      salario
    } = requestBody;

    if (!nombre || !apellido || !area || !especialidad_id || !experiencia || !telefono || !direccion || !email || !password || 
        !genero || !documento_identidad || !rtn || !fecha_contratacion || !fecha_nacimiento || !estado || !frecuencia_pago || !salario) {
      throw new Error("Faltan campos obligatorios");
    }

    // Crear usuario en auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellido,
        user_type: "tecnico",
      },
    });

    if (createError) throw createError;
    if (!newUser.user) throw new Error("No se pudo crear el usuario");

    // Usar el taller_id del admin o el taller especificado (para super admin)
    const finalTallerId = requestBody.taller_id || tallerId;

    // Insertar en tabla tecnicos
    const { data: tecnico, error: tecnicoError } = await supabaseAdmin
      .from("tecnicos")
      .insert({
        user_id: newUser.user.id,
        taller_id: finalTallerId,
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
      .select()
      .single();

    if (tecnicoError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw tecnicoError;
    }

    // Generar código de empleado TEC-consecutivo
    const codigoEmpleado = `TEC-${tecnico.id.substring(0, 8).toUpperCase()}`;
    await supabaseAdmin
      .from("tecnicos")
      .update({ codigo_empleado: codigoEmpleado })
      .eq("id", tecnico.id);

    // Asignar rol de técnico
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "tecnico",
        taller_id: finalTallerId,
      });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      await supabaseAdmin.from("tecnicos").delete().eq("id", tecnico.id);
      throw roleError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tecnico,
        message: "Técnico creado exitosamente" 
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
