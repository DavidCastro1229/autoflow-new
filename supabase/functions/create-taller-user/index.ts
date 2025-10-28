import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      throw new Error('No autorizado');
    }

    // Verify user is admin_taller
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin_taller') {
      throw new Error('Solo administradores de taller pueden crear usuarios');
    }

    // Get taller_id from the admin's taller
    const { data: taller } = await supabaseAdmin
      .from('talleres')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!taller) {
      throw new Error('Taller no encontrado');
    }

    const { email, password, nombre, apellidos, role } = await req.json();

    // Validate input
    if (!email || !password || !nombre || !apellidos || !role) {
      throw new Error('Todos los campos son requeridos');
    }

    if (!['taller', 'admin_taller'].includes(role)) {
      throw new Error('Rol inválido');
    }

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellidos,
      }
    });

    if (createError) throw createError;

    // Insert employee info
    const { error: empleadoError } = await supabaseAdmin
      .from('taller_empleados')
      .insert({
        user_id: newUser.user.id,
        taller_id: taller.id,
        nombre,
        apellidos,
      });

    if (empleadoError) throw empleadoError;

    // Insert role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
        taller_id: taller.id,
      });

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});